/**
 * Refund requests + wallet/Razorpay refund processing with dedupe.
 */
const { pool } = require('../config/db');
const { creditWallet } = require('../models/customerWalletModel');
const { getPaymentByOrderId, createRefundRecord } = require('../models/paymentModel');
const { createRefund } = require('../utils/razorpayClient');

const createRefundRequest = async ({
  orderId,
  userId,
  amount,
  refundType = 'full',
  refundMethod = 'wallet',
  reason = '',
  initiatedBy = null,
  autoApprove = false,
}) => {
  const payment = await getPaymentByOrderId(orderId);
  if (!payment) {
    throw Object.assign(new Error('Payment not found for order'), { status: 404 });
  }

  // COD orders were never captured electronically — there is no "original
  // payment method" to refund to, only the wallet. Coerce instead of
  // silently completing a refund that moves no money.
  const method = payment.method === 'cod' ? 'wallet' : refundMethod;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the payment row so two concurrent refund requests for the same
    // payment serialize instead of both reading the same "remaining"
    // refundable balance and both proceeding.
    await client.query(`SELECT id FROM payments WHERE id = $1 FOR UPDATE`, [payment.id]);

    const paid = Number(payment.amount);
    const already = await client.query(
      `SELECT COALESCE(SUM(amount), 0)::float AS refunded FROM refunds
       WHERE payment_id = $1 AND status = 'processed'`,
      [payment.id]
    );
    const pending = await client.query(
      `SELECT COALESCE(SUM(amount), 0)::float AS pending FROM refund_requests
       WHERE order_id = $1 AND status IN ('pending', 'approved')`,
      [orderId]
    );
    const refundedSoFar = Number(already.rows[0].refunded) + Number(pending.rows[0].pending);
    const remaining = paid - refundedSoFar;

    let refundAmount = amount != null ? Number(amount) : remaining;
    if (refundType === 'full' || amount == null) refundAmount = remaining;
    refundAmount = Math.min(refundAmount, remaining);

    if (refundAmount <= 0) {
      throw Object.assign(new Error('No refundable balance remaining'), { status: 400 });
    }

    const dedupeKey = `refund_req:${orderId}:${refundType}:${method}:${Math.round(refundAmount * 100)}`;

    const { rows } = await client.query(
      `INSERT INTO refund_requests (
         order_id, payment_id, user_id, amount, refund_type, refund_method,
         status, reason, initiated_by, dedupe_key
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (dedupe_key) DO NOTHING
       RETURNING *`,
      [
        orderId,
        payment.id,
        userId || payment.user_id,
        refundAmount,
        refundType,
        method,
        autoApprove ? 'approved' : 'pending',
        reason,
        initiatedBy,
        dedupeKey,
      ]
    );

    if (!rows[0]) {
      const existing = await client.query(
        `SELECT * FROM refund_requests WHERE dedupe_key = $1 LIMIT 1`,
        [dedupeKey]
      );
      await client.query('COMMIT');
      return { duplicate: true, request: existing.rows[0] };
    }

    if (!autoApprove) {
      await client.query('COMMIT');
      notifyRefundInitiated(rows[0]);
      return { request: rows[0] };
    }

    const result = await processRefundRequest(rows[0].id, initiatedBy || null, client);
    await client.query('COMMIT');
    notifyRefundInitiated(rows[0]);
    notifyRefundCompleted(result.request, result.refund);
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Locks and processes a refund_request. Accepts an optional shared `client`
 * so createRefundRequest's auto-approve path can run entirely inside one
 * transaction. When called standalone (e.g. from approveRefundRequest) it
 * owns its own connection/transaction. On success, notifications/socket
 * events are only fired by the caller that actually committed (see
 * notifyRefundCompleted calls in this file) — never from inside here while
 * a shared transaction is still open.
 */
const processRefundRequest = async (requestId, processedBy = null, client = null) => {
  const db = client || (await pool.connect());
  const ownClient = !client;

  try {
    if (ownClient) await db.query('BEGIN');

    const { rows } = await db.query(
      `SELECT * FROM refund_requests WHERE id = $1 FOR UPDATE`,
      [requestId]
    );
    const req = rows[0];
    if (!req) throw Object.assign(new Error('Refund request not found'), { status: 404 });
    if (req.status === 'processed') {
      if (ownClient) await db.query('COMMIT');
      return { duplicate: true, request: req };
    }
    if (req.status === 'rejected') {
      throw Object.assign(new Error('Refund request was rejected'), { status: 400 });
    }

    const paymentRes = await db.query(`SELECT * FROM payments WHERE id = $1 FOR UPDATE`, [req.payment_id]);
    const pay = paymentRes.rows[0];
    if (!pay) throw Object.assign(new Error('Payment not found'), { status: 404 });

    const refundAmount = Number(req.amount);
    let rzRefund = null;

    if (req.refund_method === 'wallet') {
      await creditWallet(
        req.user_id,
        refundAmount,
        {
          type: 'refund',
          category: 'refund',
          refundPortion: refundAmount,
          referenceType: 'refund_request',
          referenceId: req.id,
          orderId: req.order_id,
          dedupeKey: `wallet_refund:${req.id}`,
          note: req.reason || `Refund for order #${String(req.order_id).slice(0, 8)}`,
          meta: { refund_type: req.refund_type },
        },
        db
      );
    } else if (pay.razorpay_payment_id && pay.method !== 'cod') {
      rzRefund = await createRefund({
        paymentId: pay.razorpay_payment_id,
        amountInPaise: Math.round(refundAmount * 100),
        notes: { order_id: req.order_id, reason: req.reason || '' },
      });
    } else {
      // Should be unreachable: createRefundRequest coerces COD to wallet,
      // and any payment without a Razorpay reference has no other refund
      // destination. Fail loudly instead of silently "succeeding".
      throw Object.assign(
        new Error('This payment has no valid refund destination'),
        { status: 400 }
      );
    }

    const already = await db.query(
      `SELECT COALESCE(SUM(amount), 0)::float AS refunded FROM refunds WHERE payment_id = $1 AND status = 'processed'`,
      [pay.id]
    );
    const paid = Number(pay.amount);
    const newStatus =
      refundAmount >= paid - Number(already.rows[0].refunded) - 0.01
        ? 'refunded'
        : 'partially_refunded';

    await db.query(
      `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newStatus, pay.id]
    );

    if (newStatus === 'refunded' && ['cancelled_order', 'full'].includes(req.refund_type)) {
      await db.query(
        `UPDATE orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [req.order_id]
      );
    }

    const refund = await createRefundRecord(
      {
        payment_id: pay.id,
        order_id: req.order_id,
        user_id: req.user_id,
        amount: refundAmount,
        type: refundAmount >= paid - 0.01 ? 'full' : 'partial',
        reason: req.reason,
        status: 'processed',
        razorpay_refund_id: rzRefund?.id || null,
        initiated_by: processedBy || req.initiated_by,
        notes:
          req.refund_method === 'wallet'
            ? 'Credited to Foodiq Wallet'
            : rzRefund?.mock
              ? 'Mock Razorpay refund'
              : null,
        refund_method: req.refund_method,
        refund_request_id: req.id,
      },
      db
    );

    const { rows: updated } = await db.query(
      `UPDATE refund_requests SET
         status = 'processed',
         processed_by = $1,
         processed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [processedBy, req.id]
    );

    if (ownClient) {
      await db.query('COMMIT');
      notifyRefundCompleted(updated[0], refund);
    }

    return { request: updated[0], refund };
  } catch (err) {
    if (ownClient) {
      try {
        await db.query('ROLLBACK');
      } catch {
        /* ignore */
      }
    }
    throw err;
  } finally {
    if (ownClient) db.release();
  }
};

const rejectRefundRequest = async (requestId, processedBy, reason = '') => {
  const { rows } = await pool.query(
    `UPDATE refund_requests SET
       status = 'rejected',
       processed_by = $1,
       notes = COALESCE($2, notes),
       processed_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND status = 'pending'
     RETURNING *`,
    [processedBy, reason, requestId]
  );
  if (!rows[0]) throw Object.assign(new Error('Refund request not found or already processed'), { status: 404 });
  return rows[0];
};

const approveRefundRequest = async (requestId, processedBy) => {
  await pool.query(
    `UPDATE refund_requests SET status = 'approved', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'pending'`,
    [requestId]
  );
  return processRefundRequest(requestId, processedBy);
};

const listRefundRequests = async ({ status = '', limit = 50 } = {}) => {
  const { rows } = await pool.query(
    `SELECT rr.*, u.full_name, u.email, o.total_amount AS order_total
     FROM refund_requests rr
     JOIN users u ON u.id = rr.user_id
     LEFT JOIN orders o ON o.id = rr.order_id
     WHERE ($1 = '' OR rr.status = $1)
     ORDER BY rr.created_at DESC
     LIMIT $2`,
    [status || '', Math.min(Number(limit) || 50, 200)]
  );
  return rows;
};

function notifyRefundInitiated(request) {
  try {
    const { emitRefundInitiated } = require('../socket/emitters');
    emitRefundInitiated({
      order_id: request.order_id,
      user_id: request.user_id,
      amount: Number(request.amount),
      refund_id: request.id,
    });
  } catch {
    /* ignore */
  }
}

function notifyRefundCompleted(request, refund) {
  try {
    const { emitRefundCompleted, emitWalletUpdated } = require('../socket/emitters');
    emitRefundCompleted({
      order_id: request.order_id,
      user_id: request.user_id,
      amount: Number(request.amount),
      refund_id: refund?.id || null,
      method: request.refund_method,
    });
    // creditWallet doesn't emit here itself — it ran on a shared transaction
    // client inside this same commit, not its own.
    if (request.refund_method === 'wallet') {
      emitWalletUpdated({ wallet_type: 'customer', user_id: request.user_id, reason: 'refund' });
    }
  } catch {
    /* ignore */
  }

  try {
    const { createNotification } = require('../models/notificationModel');
    const msg =
      request.refund_method === 'wallet'
        ? `₹${Number(request.amount).toFixed(0)} credited to your Foodiq Wallet for order #${String(request.order_id).slice(0, 8)}.`
        : `₹${Number(request.amount).toFixed(0)} refunded to your original payment method.`;
    createNotification(request.user_id, 'refund_completed', 'Refund Processed', msg, {
      order_id: request.order_id,
      link: '/my-wallet',
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

module.exports = {
  createRefundRequest,
  processRefundRequest,
  approveRefundRequest,
  rejectRefundRequest,
  listRefundRequests,
};
