const { pool } = require('../config/db');
const {
  prepareCheckout,
  commitCheckoutOrder,
  notifyRestaurantOwner,
  formatCheckoutResponse,
  isOnlineMethod,
  normalizePaymentMethod,
} = require('../services/checkoutService');
const {
  createPaymentRecord,
  updatePaymentStatus,
  getPaymentHistory,
  getPaymentById,
  getPaymentByOrderId,
  createPaymentTransaction,
  getTransactionByRazorpayOrderId,
  updateTransaction,
  createRefundRecord,
  listRefunds,
  listAdminTransactions,
  getAdminPaymentStats,
} = require('../models/paymentModel');
const {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  signMockPayment,
  fetchAndValidatePayment,
  createRefund,
  getKeyId,
  isMockMode,
  toRazorpayPrefillMethod,
} = require('../utils/razorpayClient');

const { fail, ok } = require('../utils/respond');

/** Legacy: initialize payment against an existing order (retry). */
const createPayment = async (req, res) => {
  try {
    const { order_id, amount, method } = req.body;

    if (!order_id || !amount || !method) {
      return fail(res, 400, 'Order ID, amount, and method are required');
    }

    const normalizedMethod = normalizePaymentMethod(method);
    if (!normalizedMethod) {
      return fail(res, 400, 'Invalid payment method');
    }

    const order = await pool.query(
      'SELECT id, total_amount, status FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, req.user.id]
    );
    if (!order.rows[0]) return fail(res, 404, 'Order not found');
    if (String(order.rows[0].status).toLowerCase() === 'cancelled') {
      return fail(res, 409, 'Cancelled orders cannot be paid');
    }
    if (Math.abs(Number(order.rows[0].total_amount) - Number(amount)) > 0.01) {
      return fail(res, 400, 'Payment amount does not match the order total');
    }

    if (normalizedMethod === 'cod') {
      const payment = await createPaymentRecord({
        orderId: order_id,
        userId: req.user.id,
        amount,
        method: 'cod',
        status: 'pending',
      });
      return ok(res, 'COD payment recorded', { payment_id: payment.id, method: 'cod' }, 201);
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const receipt = `retry_${String(order_id).slice(0, 8)}_${Date.now()}`;
    const rzOrder = await createRazorpayOrder({
      amountInPaise,
      receipt,
      notes: { order_id, user_id: req.user.id, retry: 'true' },
    });

    await createPaymentTransaction({
      user_id: req.user.id,
      razorpay_order_id: rzOrder.id,
      amount: Number(amount),
      payment_method: normalizedMethod,
      status: 'created',
      checkout_payload: { order_id, payment_method: normalizedMethod, retry: true },
      receipt,
    });

    await createPaymentRecord({
      orderId: order_id,
      userId: req.user.id,
      amount,
      method: normalizedMethod,
      status: 'pending',
      razorpay_order_id: rzOrder.id,
    });

    return ok(
      res,
      'Payment initialized',
      {
        payment_order_id: rzOrder.id,
        razorpay_order_id: rzOrder.id,
        amount: Number(amount),
        amount_paise: amountInPaise,
        currency: 'INR',
        key_id: getKeyId(),
        mock: isMockMode(),
        order_id,
        payment_method: normalizedMethod,
        prefill_method: toRazorpayPrefillMethod(normalizedMethod),
      },
      201
    );
  } catch (error) {
    console.error('[payments/create]', error);
    return fail(res, 500, 'Server Error during payment initialization', error.message);
  }
};

/**
 * Create Razorpay order from cart BEFORE placing Foodiq order.
 * Cart → Checkout → Razorpay → Verify → Create Order
 */
const createRazorpayCheckoutOrder = async (req, res) => {
  try {
    const prepared = await prepareCheckout(req.user.id, req.body);

    if (!isOnlineMethod(prepared.payment_method)) {
      return fail(res, 400, 'Use place-order endpoint for Cash on Delivery');
    }

    const amountInPaise = Math.round(prepared.totalAmount * 100);
    if (amountInPaise < 100) {
      if (prepared.wallet_amount_used > 0) {
        const { commitCheckoutOrder } = require('../services/checkoutService');
        const dbClient = await pool.connect();
        try {
          await dbClient.query('BEGIN');
          const { order, payment } = await commitCheckoutOrder(req.user.id, prepared, {
            status: 'completed',
          }, dbClient);
          await dbClient.query('COMMIT');
          return ok(res, 'Order placed with wallet', {
            order_id: order.id,
            payment_id: payment.id,
            wallet_only: true,
          });
        } catch (err) {
          await dbClient.query('ROLLBACK');
          throw err;
        } finally {
          dbClient.release();
        }
      }
      return fail(res, 400, 'Minimum payable amount is ₹1');
    }

    const receipt = `foodiq_${Date.now()}`;
    const rzOrder = await createRazorpayOrder({
      amountInPaise,
      receipt,
      notes: {
        user_id: req.user.id,
        payment_method: prepared.payment_method,
      },
    });

    const txn = await createPaymentTransaction({
      user_id: req.user.id,
      razorpay_order_id: rzOrder.id,
      amount: prepared.totalAmount,
      payment_method: prepared.payment_method,
      status: 'created',
      checkout_payload: prepared.checkout_payload,
      receipt,
    });

    console.log('[payments/razorpay/order]', {
      txn: txn.id,
      rz: rzOrder.id,
      amount: prepared.totalAmount,
      method: prepared.payment_method,
      mock: isMockMode(),
    });

    return ok(
      res,
      'Razorpay order created',
      {
        transaction_id: txn.id,
        razorpay_order_id: rzOrder.id,
        amount: prepared.totalAmount,
        amount_paise: amountInPaise,
        currency: 'INR',
        key_id: getKeyId(),
        mock: isMockMode(),
        payment_method: prepared.payment_method,
        prefill_method: toRazorpayPrefillMethod(prepared.payment_method),
        summary: {
          subtotal: parseFloat(prepared.subtotal.toFixed(2)),
          discount: parseFloat(prepared.discount.toFixed(2)),
          delivery_charge: parseFloat(prepared.deliveryCharge.toFixed(2)),
          tax: parseFloat(prepared.tax.toFixed(2)),
          grand_total: parseFloat(prepared.totalAmount.toFixed(2)),
        },
        prefill: {
          name: req.user.full_name,
          email: req.user.email,
          contact: req.user.phone_number,
        },
      },
      201
    );
  } catch (error) {
    console.error('[payments/razorpay/order]', error);
    return fail(res, error.status || 500, error.message || 'Failed to create Razorpay order');
  }
};

/**
 * Shared finalize after signature + Razorpay capture validation.
 * Used by client verify and webhook (payment.captured).
 */
const finalizeVerifiedPayment = async ({
  txn,
  userId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const client = await pool.connect();
  try {
    if (txn.status === 'paid' && txn.order_id) {
      return {
        already_processed: true,
        order_id: txn.order_id,
        payment_id: txn.payment_id,
        razorpay_payment_id: txn.razorpay_payment_id || razorpay_payment_id,
      };
    }

    await client.query('BEGIN');

    const payload = txn.checkout_payload || {};
    let orderId = payload.order_id || txn.order_id;
    let payment;
    let checkoutPrepared = null;
    let checkoutResult = null;

    if (orderId && payload.retry) {
      payment = await createPaymentRecord(
        {
          orderId,
          userId,
          amount: Number(txn.amount),
          method: txn.payment_method || 'razorpay',
          status: 'completed',
          provider_transaction_id: razorpay_payment_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          currency: txn.currency || 'INR',
          transaction_time: new Date(),
        },
        client
      );
    } else {
      checkoutPrepared = await prepareCheckout(userId, {
        ...payload,
        payment_method: txn.payment_method || payload.payment_method,
      });

      if (Math.abs(checkoutPrepared.totalAmount - Number(txn.amount)) > 0.5) {
        await client.query('ROLLBACK');
        await updateTransaction(txn.id, {
          status: 'failed',
          failure_reason: 'Amount mismatch on verify',
        });
        const err = new Error('Cart total changed. Please retry checkout.');
        err.status = 409;
        throw err;
      }

      checkoutResult = await commitCheckoutOrder(
        userId,
        checkoutPrepared,
        {
          status: 'completed',
          provider_transaction_id: razorpay_payment_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          currency: 'INR',
          transaction_time: new Date(),
        },
        client
      );
      orderId = checkoutResult.order.id;
      payment = checkoutResult.payment;
    }

    await updateTransaction(
      txn.id,
      {
        status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        payment_id: payment.id,
        order_id: orderId,
      },
      client
    );
    await client.query('COMMIT');

    if (checkoutPrepared && checkoutResult) {
      await notifyRestaurantOwner(
        checkoutPrepared.restaurantId,
        orderId,
        checkoutPrepared.totalAmount
      );
      try {
        const { deductInventoryForOrder } = require('../services/inventoryService');
        await deductInventoryForOrder(orderId, checkoutPrepared.restaurantId);
      } catch {
        /* non-blocking */
      }
      return {
        already_processed: false,
        order_id: orderId,
        payment_id: payment.id,
        razorpay_payment_id,
        payment_status: 'completed',
        fresh_checkout: true,
        restaurant_id: checkoutPrepared.restaurantId,
        amount: checkoutPrepared.totalAmount,
        checkout_response: formatCheckoutResponse(
          checkoutResult.order,
          checkoutPrepared.payment_method,
          checkoutPrepared
        ),
      };
    }

    return {
      already_processed: false,
      order_id: orderId,
      payment_id: payment.id,
      razorpay_payment_id,
      payment_status: 'completed',
      fresh_checkout: false,
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    client.release();
  }
};

/** Server-side signature + capture verification → create Foodiq order (or complete retry). */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return fail(
        res,
        400,
        'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required'
      );
    }

    const valid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    if (!valid) {
      const txn = await getTransactionByRazorpayOrderId(razorpay_order_id);
      if (txn) {
        await updateTransaction(txn.id, {
          status: 'failed',
          failure_reason: 'Invalid payment signature',
          razorpay_payment_id,
          razorpay_signature,
        });
      }
      return fail(res, 400, 'Payment verification failed: invalid signature');
    }

    const txn = await getTransactionByRazorpayOrderId(razorpay_order_id);
    if (!txn) {
      return fail(res, 404, 'Payment transaction not found');
    }
    if (txn.user_id !== req.user.id) {
      return fail(res, 403, 'Not authorized for this payment');
    }
    if (txn.status === 'paid' && txn.order_id) {
      return ok(res, 'Payment already verified', {
        order_id: txn.order_id,
        payment_id: txn.payment_id,
        already_processed: true,
      });
    }

    // Re-confirm with Razorpay API (captured/authorized + amount)
    await fetchAndValidatePayment({
      razorpay_payment_id,
      razorpay_order_id,
      expectedAmountInPaise: Math.round(Number(txn.amount) * 100),
    });

    const result = await finalizeVerifiedPayment({
      txn,
      userId: req.user.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    console.log('[payments/razorpay/verify]', {
      order_id: result.order_id,
      payment_id: result.payment_id,
      already_processed: result.already_processed,
    });

    if (result.already_processed) {
      return ok(res, 'Payment already verified', {
        order_id: result.order_id,
        payment_id: result.payment_id,
        already_processed: true,
      });
    }

    try {
      const { emitPaymentCompleted } = require('../socket/emitters');
      emitPaymentCompleted({
        order_id: result.order_id,
        user_id: req.user.id,
        restaurant_id: result.restaurant_id || null,
        amount: result.amount || result.checkout_response?.summary?.grand_total,
        payment_id: result.payment_id,
      });
    } catch {
      /* ignore */
    }

    try {
      const { createNotification } = require('../models/notificationModel');
      const amount =
        result.amount || result.checkout_response?.summary?.grand_total || null;
      await createNotification(
        req.user.id,
        'payment_success',
        'Payment Successful',
        `Payment confirmed for order #${String(result.order_id).slice(0, 8)}.`,
        {
          order_id: result.order_id,
          amount,
          link: `/track-order?id=${result.order_id}`,
        }
      );
      if (result.restaurant_id) {
        const owner = await pool.query(
          'SELECT owner_id, name FROM restaurants WHERE id = $1',
          [result.restaurant_id]
        );
        if (owner.rows[0]?.owner_id) {
          await createNotification(
            owner.rows[0].owner_id,
            'payment_received',
            'Payment Received',
            `Payment received for order #${String(result.order_id).slice(0, 8)}.`,
            {
              order_id: result.order_id,
              amount,
              restaurant_name: owner.rows[0].name,
              link: '/partner/orders',
            }
          );
        }
      }
      // PDF invoice email (separate from payment_success template)
      emailInvoiceAfterPayment({
        userId: req.user.id,
        paymentId: result.payment_id,
        orderId: result.order_id,
        amount,
      }).catch(() => {});
    } catch {
      /* ignore */
    }

    if (result.fresh_checkout && result.checkout_response) {
      return ok(res, 'Payment verified and order created', {
        ...result.checkout_response,
        payment_id: result.payment_id,
        razorpay_payment_id,
        payment_status: 'completed',
      });
    }

    return ok(res, 'Payment verified successfully', {
      order_id: result.order_id,
      payment_id: result.payment_id,
      razorpay_payment_id,
      payment_status: 'completed',
      summary: { estimated_delivery_minutes: 30 },
    });
  } catch (error) {
    console.error('[payments/razorpay/verify]', error);
    return fail(res, error.status || 500, error.message || 'Payment verification failed');
  }
};

const markPaymentFailed = async (req, res) => {
  try {
    const { razorpay_order_id, reason } = req.body;
    if (!razorpay_order_id) return fail(res, 400, 'razorpay_order_id is required');
    const txn = await getTransactionByRazorpayOrderId(razorpay_order_id);
    if (!txn || txn.user_id !== req.user.id) return fail(res, 404, 'Transaction not found');
    if (txn.status === 'paid') {
      return ok(res, 'Payment already completed', { transaction_id: txn.id, status: 'paid' });
    }
    await updateTransaction(txn.id, {
      status: 'failed',
      failure_reason: reason || 'Payment cancelled or failed by customer',
    });

    try {
      require('../services/metricsService').bump('payments_failed');
    } catch {
      /* ignore */
    }

    try {
      const { writeAudit } = require('../services/auditService');
      await writeAudit({
        userId: req.user.id,
        action: 'payment_failed',
        category: 'payment',
        status: 'failure',
        message: reason || 'Payment failed',
        req,
      });
    } catch {
      /* ignore */
    }

    try {
      const { createNotification } = require('../models/notificationModel');
      const { notifyAdmins } = require('../services/notificationService');
      await createNotification(
        req.user.id,
        'payment_failed',
        'Payment Failed',
        reason || 'Your payment could not be completed. You can retry from checkout.',
        { razorpay_order_id, link: '/checkout' }
      );
      await notifyAdmins({
        type: 'failed_payment',
        title: 'Failed Payment',
        message: `Payment failed for user ${req.user.email || req.user.id}`,
        dedupeKey: `failed_pay:${razorpay_order_id}`,
        link: '/admin/payments',
      });
    } catch {
      /* ignore */
    }

    return ok(res, 'Payment marked as failed', { transaction_id: txn.id, status: 'failed' });
  } catch (error) {
    return fail(res, 500, 'Failed to record payment failure', error.message);
  }
};

/** Local/test helper: complete mock Razorpay checkout with a valid HMAC. */
const mockCompletePayment = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return fail(res, 403, 'Mock payment completion is disabled in production');
    }
    if (!isMockMode()) {
      return fail(res, 403, 'Mock complete is only available in Razorpay mock/test mode');
    }
    const { razorpay_order_id } = req.body;
    if (!razorpay_order_id) return fail(res, 400, 'razorpay_order_id is required');
    const razorpay_payment_id = `pay_mock_${Date.now()}`;
    const razorpay_signature = signMockPayment(razorpay_order_id, razorpay_payment_id);
    req.body = { razorpay_order_id, razorpay_payment_id, razorpay_signature };
    return verifyRazorpayPayment(req, res);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/**
 * Razorpay webhooks (payment.captured / payment.failed / refund.*).
 * Auth via X-Razorpay-Signature — no JWT.
 */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody =
      req.rawBody ||
      (Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {}));

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[payments/webhook] invalid signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = typeof req.body === 'object' && !Buffer.isBuffer(req.body)
      ? req.body
      : JSON.parse(rawBody);

    const eventName = event.event;
    const entity = event.payload?.payment?.entity || event.payload?.refund?.entity;
    console.log('[payments/webhook]', eventName, entity?.id || entity?.order_id);

    if (eventName === 'payment.captured' || eventName === 'payment.authorized') {
      const payment = event.payload?.payment?.entity;
      if (!payment?.order_id) {
        return res.status(200).json({ success: true, message: 'Ignored (no order_id)' });
      }

      const txn = await getTransactionByRazorpayOrderId(payment.order_id);
      if (!txn) {
        return res.status(200).json({ success: true, message: 'Ignored (unknown order)' });
      }
      if (txn.status === 'paid') {
        return res.status(200).json({ success: true, message: 'Already processed' });
      }

      try {
        await fetchAndValidatePayment({
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          expectedAmountInPaise: Math.round(Number(txn.amount) * 100),
        });
      } catch (err) {
        console.warn('[payments/webhook] payment validation failed', err.message);
        return res.status(200).json({ success: true, message: 'Validation skipped/failed' });
      }

      // Webhook has no client signature; store empty and rely on Razorpay fetch + webhook HMAC.
      await finalizeVerifiedPayment({
        txn,
        userId: txn.user_id,
        razorpay_order_id: payment.order_id,
        razorpay_payment_id: payment.id,
        razorpay_signature: `webhook:${eventName}`,
      });

      return res.status(200).json({ success: true, message: 'Payment captured processed' });
    }

    if (eventName === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        const txn = await getTransactionByRazorpayOrderId(payment.order_id);
        if (txn && txn.status !== 'paid') {
          await updateTransaction(txn.id, {
            status: 'failed',
            failure_reason: payment.error_description || 'Payment failed (webhook)',
            razorpay_payment_id: payment.id,
          });
        }
      }
      return res.status(200).json({ success: true, message: 'Payment failure recorded' });
    }

    if (eventName === 'refund.processed' || eventName === 'refund.failed') {
      const refund = event.payload?.refund?.entity;
      if (refund?.id) {
        await pool.query(
          `UPDATE refunds SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE razorpay_refund_id = $2`,
          [eventName === 'refund.processed' ? 'processed' : 'failed', refund.id]
        );
      }
      return res.status(200).json({ success: true, message: 'Refund event recorded' });
    }

    return res.status(200).json({ success: true, message: `Ignored event ${eventName}` });
  } catch (error) {
    console.error('[payments/webhook]', error);
    // Still 200 so Razorpay does not retry forever on app bugs; log for ops.
    return res.status(200).json({ success: false, message: error.message });
  }
};

/** Legacy verify (client-reported) — kept for old clients but restricted. */
const verifyPayment = async (req, res) => {
  if (req.body.razorpay_order_id) {
    return verifyRazorpayPayment(req, res);
  }

  const client = await pool.connect();
  try {
    const { payment_id, transaction_id, status } = req.body;
    if (!payment_id || !transaction_id || !status) {
      return fail(res, 400, 'Payment ID, transaction ID, and status required');
    }
    if (!['completed', 'failed', 'pending'].includes(status)) {
      return fail(res, 400, 'Invalid payment status');
    }

    const existing = await getPaymentById(payment_id, req.user.id);
    if (!existing) return fail(res, 404, 'Payment not found');
    if (existing.method !== 'cod' && status === 'completed') {
      return fail(res, 400, 'Online payments must be verified via Razorpay signature');
    }

    await client.query('BEGIN');
    const updatedPayment = await updatePaymentStatus(
      payment_id,
      req.user.id,
      status,
      transaction_id,
      client
    );
    await client.query('COMMIT');
    return ok(res, 'Payment updated', updatedPayment);
  } catch (error) {
    await client.query('ROLLBACK');
    return fail(res, 500, 'Server Error verifying payment', error.message);
  } finally {
    client.release();
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await getPaymentHistory(req.user.id);
    return ok(res, 'Payment history retrieved', history);
  } catch (error) {
    return fail(res, 500, 'Server Error retrieving history', error.message);
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id, req.user.id);
    if (!payment) return fail(res, 404, 'Payment not found');

    const format = String(req.query.format || 'pdf').toLowerCase();

    if (format !== 'html') {
      try {
        const { buildInvoicePdfBuffer } = require('../services/invoiceService');
        const pdf = await buildInvoicePdfBuffer({
          paymentId: payment.id,
          userId: req.user.id,
        });
        const shortId = String(payment.order_id || payment.id).slice(0, 8).toUpperCase();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="foodiq-invoice-${shortId}.pdf"`
        );
        return res.send(pdf);
      } catch (pdfErr) {
        console.warn('[invoice] PDF failed, falling back to HTML', pdfErr.message);
      }
    }

    const order = await pool.query(
      `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
              u.full_name, u.email, u.phone_number
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       JOIN users u ON u.id = o.user_id
       WHERE o.id = $1 AND o.user_id = $2`,
      [payment.order_id, req.user.id]
    );
    if (!order.rows[0]) return fail(res, 404, 'Order not found');

    const items = await pool.query(
      `SELECT oi.quantity, oi.price_at_time, m.name
       FROM order_items oi JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE oi.order_id = $1`,
      [payment.order_id]
    );

    const o = order.rows[0];
    const shortId = String(o.id).slice(0, 8).toUpperCase();
    const paidAt = new Date(payment.transaction_time || payment.created_at).toLocaleString('en-IN');
    const itemRows = items.rows
      .map(
        (i) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #E5E7EB;">${escapeHtml(i.name)}</td>
            <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:center;">${i.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right;">₹${Number(i.price_at_time).toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right;">₹${(Number(i.price_at_time) * i.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Foodiq Invoice #${shortId}</title>
</head>
<body style="font-family:Segoe UI,Arial,sans-serif;color:#111827;max-width:720px;margin:40px auto;padding:0 16px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #FC8019;padding-bottom:16px;margin-bottom:24px;">
    <div>
      <h1 style="margin:0;color:#FC8019;font-size:28px;">Foodiq</h1>
      <p style="margin:4px 0 0;color:#6B7280;">Tax Invoice</p>
    </div>
    <div style="text-align:right;font-size:13px;color:#6B7280;">
      <div><strong>Invoice / Payment:</strong> ${escapeHtml(String(payment.id).slice(0, 8))}</div>
      <div><strong>Order:</strong> #${shortId}</div>
      <div><strong>Date:</strong> ${escapeHtml(paidAt)}</div>
    </div>
  </div>

  <div style="display:flex;gap:32px;margin-bottom:24px;font-size:14px;">
    <div style="flex:1;">
      <h3 style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;">Bill To</h3>
      <p style="margin:0;font-weight:700;">${escapeHtml(o.full_name || '')}</p>
      <p style="margin:4px 0;color:#6B7280;">${escapeHtml(o.email || '')}</p>
      <p style="margin:0;color:#6B7280;">${escapeHtml(o.phone_number || '-')}</p>
    </div>
    <div style="flex:1;">
      <h3 style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;">Restaurant</h3>
      <p style="margin:0;font-weight:700;">${escapeHtml(o.restaurant_name || '')}</p>
      <p style="margin:4px 0;color:#6B7280;">${escapeHtml(o.restaurant_address || '')}</p>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
    <thead>
      <tr style="background:#F8FAFC;text-align:left;">
        <th style="padding:10px 8px;">Item</th>
        <th style="padding:10px 8px;text-align:center;">Qty</th>
        <th style="padding:10px 8px;text-align:right;">Price</th>
        <th style="padding:10px 8px;text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div style="margin-left:auto;width:260px;font-size:14px;">
    <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Subtotal</span><span>₹${Number(o.subtotal).toFixed(2)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Discount</span><span>-₹${Number(o.discount_amount || 0).toFixed(2)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Delivery</span><span>₹${Number(o.delivery_fee || 0).toFixed(2)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:8px;border-top:2px solid #111827;font-weight:800;font-size:16px;">
      <span>Total</span><span>₹${Number(o.total_amount).toFixed(2)}</span>
    </div>
  </div>

  <div style="margin-top:32px;padding:16px;background:#F8FAFC;border-radius:12px;font-size:13px;color:#6B7280;">
    <div><strong>Payment method:</strong> ${escapeHtml(String(payment.method || '').replace(/_/g, ' '))}</div>
    <div><strong>Payment status:</strong> ${escapeHtml(payment.status)}</div>
    <div><strong>Razorpay payment:</strong> ${escapeHtml(payment.razorpay_payment_id || '-')}</div>
    <div><strong>Currency:</strong> ${escapeHtml(payment.currency || 'INR')}</div>
  </div>

  <p style="margin-top:32px;text-align:center;color:#9CA3AF;font-size:12px;">Thank you for ordering with Foodiq!</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="foodiq-invoice-${shortId}.html"`
    );
    return res.send(html);
  } catch (error) {
    return fail(res, 500, 'Failed to generate invoice', error.message);
  }
};

/** Attach PDF invoice to payment-success email (non-blocking). */
const emailInvoiceAfterPayment = async ({ userId, paymentId, orderId, amount }) => {
  try {
    const { buildInvoicePdfBuffer } = require('../services/invoiceService');
    const { sendEmail } = require('../services/emailService');
    const { templates } = require('../services/emailTemplates');
    const userQ = await pool.query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [userId]
    );
    const email = userQ.rows[0]?.email;
    if (!email || !paymentId) return;

    const pdf = await buildInvoicePdfBuffer({ paymentId, userId });
    const tpl = templates.invoice({
      name: userQ.rows[0]?.full_name,
      orderId,
    });
    await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      userId,
      template: 'invoice',
      orderId,
      attachments: [
        {
          filename: `foodiq-invoice-${String(orderId || paymentId).slice(0, 8)}.pdf`,
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
      meta: { amount },
    });
  } catch (err) {
    console.warn('[invoice] email attach skipped', err.message);
  }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const processRefund = async ({
  orderId,
  amount,
  reason,
  initiatedBy,
  type = 'full',
  cancelOrder = true,
}) => {
  const payment = await getPaymentByOrderId(orderId);
  if (!payment) {
    const err = new Error('Payment not found for order');
    err.status = 404;
    throw err;
  }
  if (!['completed', 'partially_refunded'].includes(payment.status)) {
    const err = new Error('Only completed payments can be refunded');
    err.status = 400;
    throw err;
  }

  const paid = Number(payment.amount);
  const already = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::float AS refunded FROM refunds
     WHERE payment_id = $1 AND status = 'processed'`,
    [payment.id]
  );
  const refundedSoFar = already.rows[0].refunded;
  const remaining = paid - refundedSoFar;
  const refundAmount =
    type === 'full' || amount == null ? remaining : Math.min(Number(amount), remaining);

  if (refundAmount <= 0) {
    const err = new Error('No refundable balance remaining');
    err.status = 400;
    throw err;
  }

  let rzRefund = null;
  if (payment.razorpay_payment_id && payment.method !== 'cod') {
    rzRefund = await createRefund({
      paymentId: payment.razorpay_payment_id,
      amountInPaise: Math.round(refundAmount * 100),
      notes: { order_id: orderId, reason: reason || '' },
    });
  }

  const newStatus = refundAmount >= remaining - 0.01 ? 'refunded' : 'partially_refunded';

  await pool.query(
    `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [newStatus, payment.id]
  );

  if (cancelOrder && newStatus === 'refunded') {
    await pool.query(
      `UPDATE orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [orderId]
    );
  }

  const refund = await createRefundRecord({
    payment_id: payment.id,
    order_id: orderId,
    user_id: payment.user_id,
    amount: refundAmount,
    type: refundAmount >= paid - 0.01 ? 'full' : 'partial',
    reason,
    status: 'processed',
    razorpay_refund_id: rzRefund?.id || null,
    initiated_by: initiatedBy,
    notes: rzRefund?.mock ? 'Mock Razorpay refund' : null,
  });

  try {
    const { createNotification } = require('../models/notificationModel');
    await createNotification(
      payment.user_id,
      'refund_completed',
      'Refund Completed',
      `₹${refundAmount.toFixed(0)} has been refunded for order #${String(orderId).slice(0, 8)}.`,
      {
        order_id: orderId,
        refund_id: refund.id,
        amount: refundAmount,
        link: '/notifications',
      }
    );
    try {
      const { notifyAdmins } = require('../services/notificationService');
      await notifyAdmins({
        type: 'refund_request',
        title: 'Refund Completed',
        message: `Refund of ₹${refundAmount.toFixed(0)} for order #${String(orderId).slice(0, 8)}.`,
        orderId,
        link: '/admin/payments',
      });
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }

  console.log('[payments/refund]', {
    orderId,
    refundAmount,
    type: refund.type,
    rz: rzRefund?.id,
  });

  return refund;
};

const adminPaymentOverview = async (req, res) => {
  try {
    const stats = await getAdminPaymentStats();
    const transactions = await listAdminTransactions({ limit: 50 });
    const refunds = await listRefunds({ limit: 30 });
    return ok(res, 'Payment overview', { stats, transactions, refunds });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const adminListTransactions = async (req, res) => {
  try {
    const data = await listAdminTransactions({
      status: req.query.status || '',
      limit: Number(req.query.limit) || 100,
    });
    return ok(res, 'Transactions retrieved', data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const adminListRefunds = async (req, res) => {
  try {
    return ok(res, 'Refunds retrieved', await listRefunds({ limit: 100 }));
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const adminCreateRefund = async (req, res) => {
  try {
    const { order_id, amount, reason, type, refund_method, auto_approve } = req.body;
    if (!order_id) return fail(res, 400, 'order_id is required');

    if (refund_method === 'wallet' || auto_approve !== false) {
      const { createRefundRequest } = require('../services/refundService');
      const payment = await getPaymentByOrderId(order_id);
      const result = await createRefundRequest({
        orderId: order_id,
        userId: payment?.user_id,
        amount,
        refundType: type || (amount ? 'partial' : 'full'),
        refundMethod: refund_method || 'wallet',
        reason: reason || 'Admin refund',
        initiatedBy: req.user.id,
        autoApprove: auto_approve !== false,
      });
      const msg = result.duplicate ? 'Duplicate refund request' : 'Refund processed';
      return ok(res, msg, result, result.duplicate ? 200 : 201);
    }

    const refund = await processRefund({
      orderId: order_id,
      amount,
      reason: reason || 'Admin refund',
      initiatedBy: req.user.id,
      type: type || (amount ? 'partial' : 'full'),
      cancelOrder: type !== 'partial' && !amount,
    });
    return ok(res, 'Refund processed', refund);
  } catch (error) {
    return fail(res, error.status || 500, error.message);
  }
};

const getPaymentForOrder = async (req, res) => {
  try {
    const payment = await getPaymentByOrderId(req.params.orderId);
    if (!payment || payment.user_id !== req.user.id) {
      return fail(res, 404, 'Payment not found');
    }
    return ok(res, 'Payment retrieved', payment);
  } catch (error) {
    return fail(res, 500, 'Server Error retrieving payment', error.message);
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  getHistory,
  getPaymentForOrder,
  createRazorpayCheckoutOrder,
  verifyRazorpayPayment,
  markPaymentFailed,
  mockCompletePayment,
  handleRazorpayWebhook,
  downloadInvoice,
  processRefund,
  adminPaymentOverview,
  adminListTransactions,
  adminListRefunds,
  adminCreateRefund,
};
