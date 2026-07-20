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

  const paid = Number(payment.amount);
  const already = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::float AS refunded FROM refunds
     WHERE payment_id = $1 AND status = 'processed'`,
    [payment.id]
  );
  const pending = await pool.query(
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

  const dedupeKey = `refund_req:${orderId}:${refundType}:${refundMethod}:${Math.round(refundAmount * 100)}`;

  const { rows } = await pool.query(
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
      refundMethod,
      autoApprove ? 'approved' : 'pending',
      reason,
      initiatedBy,
      dedupeKey,
    ]
  );

  if (!rows[0]) {
    const existing = await pool.query(
      `SELECT * FROM refund_requests WHERE dedupe_key = $1 LIMIT 1`,
      [dedupeKey]
    );
    return { duplicate: true, request: existing.rows[0] };
  }

  if (autoApprove) {
    return processRefundRequest(rows[0].id, initiatedBy || null);
  }

  return { request: rows[0] };
};

const processRefundRequest = async (requestId, processedBy = null) => {
  const { rows } = await pool.query(
    `SELECT * FROM refund_requests WHERE id = $1 FOR UPDATE`,
    [requestId]
  );
  const req = rows[0];
  if (!req) throw Object.assign(new Error('Refund request not found'), { status: 404 });
  if (req.status === 'processed') return { duplicate: true, request: req };
  if (req.status === 'rejected') {
    throw Object.assign(new Error('Refund request was rejected'), { status: 400 });
  }

  const payment = await pool.query(`SELECT * FROM payments WHERE id = $1`, [req.payment_id]);
  const pay = payment.rows[0];
  if (!pay) throw Object.assign(new Error('Payment not found'), { status: 404 });

  const refundAmount = Number(req.amount);
  let rzRefund = null;

  if (req.refund_method === 'wallet') {
    await creditWallet(req.user_id, refundAmount, {
      type: 'refund',
      category: 'refund',
      refundPortion: refundAmount,
      referenceType: 'refund_request',
      referenceId: req.id,
      orderId: req.order_id,
      dedupeKey: `wallet_refund:${req.id}`,
      note: req.reason || `Refund for order #${String(req.order_id).slice(0, 8)}`,
      meta: { refund_type: req.refund_type },
    });
  } else if (pay.razorpay_payment_id && pay.method !== 'cod') {
    rzRefund = await createRefund({
      paymentId: pay.razorpay_payment_id,
      amountInPaise: Math.round(refundAmount * 100),
      notes: { order_id: req.order_id, reason: req.reason || '' },
    });
  }

  const paid = Number(pay.amount);
  const already = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::float AS refunded FROM refunds WHERE payment_id = $1 AND status = 'processed'`,
    [pay.id]
  );
  const newStatus =
    refundAmount >= paid - Number(already.rows[0].refunded) - 0.01
      ? 'refunded'
      : 'partially_refunded';

  await pool.query(
    `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [newStatus, pay.id]
  );

  if (newStatus === 'refunded' && ['cancelled_order', 'full'].includes(req.refund_type)) {
    await pool.query(
      `UPDATE orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.order_id]
    );
  }

  const refund = await createRefundRecord({
    payment_id: pay.id,
    order_id: req.order_id,
    user_id: req.user_id,
    amount: refundAmount,
    type: refundAmount >= paid - 0.01 ? 'full' : 'partial',
    reason: req.reason,
    status: 'processed',
    razorpay_refund_id: rzRefund?.id || null,
    initiated_by: processedBy || req.initiated_by,
    notes: req.refund_method === 'wallet' ? 'Credited to Foodiq Wallet' : rzRefund?.mock ? 'Mock Razorpay refund' : null,
    refund_method: req.refund_method,
    refund_request_id: req.id,
  });

  const { rows: updated } = await pool.query(
    `UPDATE refund_requests SET
       status = 'processed',
       processed_by = $1,
       processed_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 RETURNING *`,
    [processedBy, req.id]
  );

  try {
    const { createNotification } = require('../models/notificationModel');
    const msg =
      req.refund_method === 'wallet'
        ? `₹${refundAmount.toFixed(0)} credited to your Foodiq Wallet for order #${String(req.order_id).slice(0, 8)}.`
        : `₹${refundAmount.toFixed(0)} refunded to your original payment method.`;
    await createNotification(req.user_id, 'refund_completed', 'Refund Processed', msg, {
      order_id: req.order_id,
      link: '/my-wallet',
    });
  } catch {
    /* non-blocking */
  }

  return { request: updated[0], refund };
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

module.exports = {
  createRefundRequest,
  processRefundRequest,
  approveRefundRequest,
  rejectRefundRequest,
  listRefundRequests,
};
