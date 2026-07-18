const { pool } = require('../config/db');

const createOrderFeedback = async (data, client = pool) => {
  const { order_id, user_id, overall_rating, comment, tags } = data;
  const { rows } = await client.query(
    `INSERT INTO order_feedback (order_id, user_id, overall_rating, comment, tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      order_id,
      user_id,
      overall_rating ?? null,
      comment || null,
      Array.isArray(tags) ? tags : [],
    ]
  );
  return rows[0];
};

const getByOrderId = async (orderId) => {
  const { rows } = await pool.query(
    `SELECT * FROM order_feedback WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
};

module.exports = { createOrderFeedback, getByOrderId };
