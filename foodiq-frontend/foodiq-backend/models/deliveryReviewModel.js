const { pool } = require('../config/db');

const createDeliveryReview = async (data, client = pool) => {
  const { user_id, delivery_partner_id, order_id, rating, comment } = data;
  const { rows } = await client.query(
    `INSERT INTO delivery_reviews (user_id, delivery_partner_id, order_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user_id, delivery_partner_id, order_id, rating, comment || null]
  );
  return rows[0];
};

const getByOrderId = async (orderId) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_reviews WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
};

const updatePartnerRating = async (partnerId, client = pool) => {
  const { rows } = await client.query(
    `UPDATE delivery_partners dp
     SET rating = COALESCE((
       SELECT ROUND(AVG(rating)::numeric, 1)
       FROM delivery_reviews
       WHERE delivery_partner_id = dp.id
     ), 0.0)
     WHERE id = $1
     RETURNING rating`,
    [partnerId]
  );
  return rows[0]?.rating;
};

const listForPartner = async (partnerId, { limit = 50, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT dr.*, u.full_name, o.id AS order_ref
     FROM delivery_reviews dr
     LEFT JOIN users u ON u.id = dr.user_id
     LEFT JOIN orders o ON o.id = dr.order_id
     WHERE dr.delivery_partner_id = $1
     ORDER BY dr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [partnerId, Math.min(Number(limit) || 50, 100), Number(offset) || 0]
  );
  return rows;
};

const resolvePartnerIdForOrder = async (orderId, client = pool) => {
  const { rows } = await client.query(
    `SELECT delivery_partner_id FROM order_tracking
     WHERE order_id = $1 AND delivery_partner_id IS NOT NULL
     LIMIT 1`,
    [orderId]
  );
  if (rows[0]?.delivery_partner_id) return rows[0].delivery_partner_id;

  const assigned = await client.query(
    `SELECT delivery_partner_id FROM delivery_assignments
     WHERE order_id = $1
       AND status IN ('accepted', 'picked_up', 'on_the_way', 'delivered', 'completed')
       AND delivery_partner_id IS NOT NULL
     ORDER BY created_at DESC NULLS LAST
     LIMIT 1`,
    [orderId]
  );
  return assigned.rows[0]?.delivery_partner_id || null;
};

module.exports = {
  createDeliveryReview,
  getByOrderId,
  updatePartnerRating,
  listForPartner,
  resolvePartnerIdForOrder,
};
