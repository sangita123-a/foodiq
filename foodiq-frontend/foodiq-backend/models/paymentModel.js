const { pool } = require('../config/db');

const createPaymentRecord = async (orderId, userId, amount, method, status = 'pending') => {
  const query = `
    INSERT INTO payments (order_id, user_id, amount, method, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [orderId, userId, amount, method, status]);
  return rows[0];
};

const updatePaymentStatus = async (paymentId, status, transactionId, client = pool) => {
  const query = `
    UPDATE payments
    SET status = $1, provider_transaction_id = $2
    WHERE id = $3
    RETURNING *
  `;
  const { rows } = await client.query(query, [status, transactionId, paymentId]);
  return rows[0];
};

const getPaymentByOrderId = async (orderId) => {
  const { rows } = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
  return rows[0];
};

const getPaymentHistory = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
};

module.exports = {
  createPaymentRecord,
  updatePaymentStatus,
  getPaymentByOrderId,
  getPaymentHistory
};
