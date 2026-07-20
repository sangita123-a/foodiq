const { pool } = require('../config/db');

const createPaymentRecord = async (data, client = pool) => {
  const {
    orderId,
    userId,
    amount,
    method,
    status = 'pending',
    provider_transaction_id = null,
    razorpay_order_id = null,
    razorpay_payment_id = null,
    razorpay_signature = null,
    currency = 'INR',
    transaction_time = null,
  } = data;

  const query = `
    INSERT INTO payments (
      order_id, user_id, amount, method, status, provider_transaction_id,
      razorpay_order_id, razorpay_payment_id, razorpay_signature, currency, transaction_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, CURRENT_TIMESTAMP))
    ON CONFLICT (order_id) DO UPDATE SET
      method = EXCLUDED.method,
      amount = EXCLUDED.amount,
      status = CASE
        WHEN payments.status = 'completed' THEN payments.status
        ELSE EXCLUDED.status
      END,
      provider_transaction_id = COALESCE(EXCLUDED.provider_transaction_id, payments.provider_transaction_id),
      razorpay_order_id = COALESCE(EXCLUDED.razorpay_order_id, payments.razorpay_order_id),
      razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, payments.razorpay_payment_id),
      razorpay_signature = COALESCE(EXCLUDED.razorpay_signature, payments.razorpay_signature),
      currency = COALESCE(EXCLUDED.currency, payments.currency),
      transaction_time = COALESCE(EXCLUDED.transaction_time, payments.transaction_time),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const { rows } = await client.query(query, [
    orderId,
    userId,
    amount,
    method,
    status,
    provider_transaction_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    currency,
    transaction_time,
  ]);
  return rows[0];
};

const updatePaymentStatus = async (paymentId, userId, status, transactionId, client = pool) => {
  const query = `
    UPDATE payments
    SET status = $1,
        provider_transaction_id = COALESCE($2, provider_transaction_id),
        transaction_time = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE transaction_time END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND user_id = $4
    RETURNING *
  `;
  const { rows } = await client.query(query, [status, transactionId, paymentId, userId]);
  return rows[0];
};

const getPaymentByOrderId = async (orderId) => {
  const { rows } = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
  return rows[0];
};

const getPaymentById = async (paymentId, userId = null) => {
  const { rows } = await pool.query(
    userId
      ? 'SELECT * FROM payments WHERE id = $1 AND user_id = $2'
      : 'SELECT * FROM payments WHERE id = $1',
    userId ? [paymentId, userId] : [paymentId]
  );
  return rows[0];
};

const getPaymentHistory = async (userId) => {
  const { rows } = await pool.query(
    `SELECT p.*, o.status AS order_status, r.name AS restaurant_name
     FROM payments p
     LEFT JOIN orders o ON o.id = p.order_id
     LEFT JOIN restaurants r ON r.id = o.restaurant_id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
};

const createPaymentTransaction = async (data, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO payment_transactions (
       user_id, razorpay_order_id, amount, currency, payment_method, status, checkout_payload, receipt
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
     RETURNING *`,
    [
      data.user_id,
      data.razorpay_order_id,
      data.amount,
      data.currency || 'INR',
      data.payment_method,
      data.status || 'created',
      JSON.stringify(data.checkout_payload || {}),
      data.receipt || null,
    ]
  );
  return rows[0];
};

const getTransactionByRazorpayOrderId = async (razorpayOrderId) => {
  const { rows } = await pool.query(
    `SELECT * FROM payment_transactions WHERE razorpay_order_id = $1`,
    [razorpayOrderId]
  );
  return rows[0];
};

const updateTransaction = async (id, fields, client = pool) => {
  const { rows } = await client.query(
    `UPDATE payment_transactions SET
       status = COALESCE($2, status),
       razorpay_payment_id = COALESCE($3, razorpay_payment_id),
       razorpay_signature = COALESCE($4, razorpay_signature),
       payment_id = COALESCE($5, payment_id),
       order_id = COALESCE($6, order_id),
       failure_reason = COALESCE($7, failure_reason),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [
      id,
      fields.status || null,
      fields.razorpay_payment_id || null,
      fields.razorpay_signature || null,
      fields.payment_id || null,
      fields.order_id || null,
      fields.failure_reason || null,
    ]
  );
  return rows[0];
};

const listAdminTransactions = async ({ status = '', limit = 100 } = {}) => {
  const { rows } = await pool.query(
    `SELECT pt.*, u.full_name, u.email,
       p.status AS payment_status, p.method AS payment_method_final
     FROM payment_transactions pt
     JOIN users u ON u.id = pt.user_id
     LEFT JOIN payments p ON p.id = pt.payment_id
     WHERE ($1 = '' OR pt.status = $1)
     ORDER BY pt.created_at DESC
     LIMIT $2`,
    [status, limit]
  );
  return rows;
};

const getAdminPaymentStats = async () => {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::float AS total_revenue,
       COALESCE(SUM(amount) FILTER (
         WHERE status = 'completed'
           AND COALESCE(transaction_time, created_at)::date = CURRENT_DATE
       ), 0)::float AS todays_revenue,
       COUNT(*) FILTER (WHERE status = 'completed')::int AS successful_payments,
       COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_payments,
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_payments,
       COALESCE(SUM(amount) FILTER (WHERE status = 'refunded' OR status = 'partially_refunded'), 0)::float AS refunded_amount
     FROM payments`
  );
  const txnFails = await pool.query(
    `SELECT COUNT(*)::int AS failed_checkouts
     FROM payment_transactions WHERE status = 'failed'`
  );
  const refunds = await pool.query(
    `SELECT COUNT(*)::int AS refund_count,
            COALESCE(SUM(amount), 0)::float AS refund_total
     FROM refunds WHERE status IN ('processed', 'pending')`
  );
  return {
    ...rows[0],
    failed_payments: Number(rows[0].failed_payments || 0) + Number(txnFails.rows[0].failed_checkouts || 0),
    failed_checkouts: txnFails.rows[0].failed_checkouts,
    ...refunds.rows[0],
  };
};

const createRefundRecord = async (data, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO refunds (
       payment_id, order_id, user_id, amount, type, reason, status,
       razorpay_refund_id, initiated_by, notes, refund_method, refund_request_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.payment_id,
      data.order_id,
      data.user_id,
      data.amount,
      data.type || 'full',
      data.reason || null,
      data.status || 'processed',
      data.razorpay_refund_id || null,
      data.initiated_by || null,
      data.notes || null,
      data.refund_method || 'original',
      data.refund_request_id || null,
    ]
  );
  return rows[0];
};

const listRefunds = async ({ limit = 100 } = {}) => {
  const { rows } = await pool.query(
    `SELECT rf.*, u.full_name, u.email, p.razorpay_payment_id
     FROM refunds rf
     JOIN users u ON u.id = rf.user_id
     LEFT JOIN payments p ON p.id = rf.payment_id
     ORDER BY rf.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
};

const getPartnerSettlements = async (restaurantId) => {
  const summary = await pool.query(
    `SELECT
       COALESCE(SUM(o.total_amount) FILTER (WHERE o.created_at::date = CURRENT_DATE AND LOWER(p.status) = 'completed'), 0)::float AS today,
       COALESCE(SUM(o.total_amount) FILTER (WHERE o.created_at >= date_trunc('week', CURRENT_DATE) AND LOWER(p.status) = 'completed'), 0)::float AS week,
       COALESCE(SUM(o.total_amount) FILTER (WHERE o.created_at >= date_trunc('month', CURRENT_DATE) AND LOWER(p.status) = 'completed'), 0)::float AS month,
       COUNT(*) FILTER (WHERE LOWER(p.status) = 'completed')::int AS paid_orders,
       COUNT(*) FILTER (WHERE LOWER(p.status) = 'pending')::int AS pending_payments
     FROM orders o
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.restaurant_id = $1
       AND LOWER(o.status) NOT IN ('cancelled', 'rejected')`,
    [restaurantId]
  );

  const settings = await pool.query('SELECT commission_percent FROM admin_settings WHERE id = 1');
  const commission = Number(settings.rows[0]?.commission_percent || 15);
  const monthGross = summary.rows[0].month;
  const commissionAmount = (monthGross * commission) / 100;
  const netPayout = monthGross - commissionAmount;

  const paidOrders = await pool.query(
    `SELECT o.id, o.total_amount, o.status, o.created_at,
            p.status AS payment_status, p.method AS payment_method, p.transaction_time
     FROM orders o
     JOIN payments p ON p.order_id = o.id
     WHERE o.restaurant_id = $1
       AND LOWER(p.status) IN ('completed', 'refunded', 'partially_refunded', 'pending')
     ORDER BY o.created_at DESC
     LIMIT 50`,
    [restaurantId]
  );

  return {
    summary: {
      ...summary.rows[0],
      commission_percent: commission,
      commission_amount: Math.round(commissionAmount * 100) / 100,
      net_payout: Math.round(netPayout * 100) / 100,
    },
    paid_orders: paidOrders.rows,
  };
};

module.exports = {
  createPaymentRecord,
  updatePaymentStatus,
  getPaymentByOrderId,
  getPaymentById,
  getPaymentHistory,
  createPaymentTransaction,
  getTransactionByRazorpayOrderId,
  updateTransaction,
  listAdminTransactions,
  getAdminPaymentStats,
  createRefundRecord,
  listRefunds,
  getPartnerSettlements,
};
