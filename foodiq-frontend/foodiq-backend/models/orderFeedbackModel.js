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

const updateOrderFeedback = async (orderId, data, client = pool) => {
  const { overall_rating, comment, tags } = data;
  const { rows } = await client.query(
    `UPDATE order_feedback
     SET overall_rating = COALESCE($1, overall_rating),
         comment = COALESCE($2, comment),
         tags = COALESCE($3, tags),
         updated_at = CURRENT_TIMESTAMP
     WHERE order_id = $4
     RETURNING *`,
    [
      overall_rating ?? null,
      comment !== undefined ? comment : null,
      tags !== undefined ? (Array.isArray(tags) ? tags : []) : null,
      orderId,
    ]
  );
  return rows[0] || null;
};

const deleteByOrderId = async (orderId, client = pool) => {
  const { rows } = await client.query(
    `DELETE FROM order_feedback WHERE order_id = $1 RETURNING *`,
    [orderId]
  );
  return rows[0] || null;
};

/**
 * Admin list of post-order feedback with filters + pagination.
 */
const listAdminOrderFeedback = async ({
  restaurantId = null,
  deliveryPartnerId = null,
  rating = null,
  from = null,
  to = null,
  limit = 20,
  offset = 0,
} = {}) => {
  const values = [];
  let where = 'WHERE 1=1';

  if (restaurantId) {
    values.push(restaurantId);
    where += ` AND o.restaurant_id = $${values.length}`;
  }
  if (deliveryPartnerId) {
    values.push(deliveryPartnerId);
    where += ` AND dr.delivery_partner_id = $${values.length}`;
  }
  if (rating != null && rating !== '') {
    values.push(Number(rating));
    where += ` AND (
      rev.rating = $${values.length}
      OR ofb.overall_rating = $${values.length}
      OR dr.rating = $${values.length}
    )`;
  }
  if (from) {
    values.push(from);
    where += ` AND COALESCE(ofb.created_at, rev.created_at, dr.created_at)::date >= $${values.length}::date`;
  }
  if (to) {
    values.push(to);
    where += ` AND COALESCE(ofb.created_at, rev.created_at, dr.created_at)::date <= $${values.length}::date`;
  }

  const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const off = Math.max(Number(offset) || 0, 0);
  values.push(lim);
  values.push(off);

  const countValues = values.slice(0, -2);
  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM orders o
    LEFT JOIN order_feedback ofb ON ofb.order_id = o.id
    LEFT JOIN reviews rev ON rev.order_id = o.id
    LEFT JOIN delivery_reviews dr ON dr.order_id = o.id
    ${where}
      AND (ofb.id IS NOT NULL OR rev.id IS NOT NULL OR dr.id IS NOT NULL)
  `;

  const listSql = `
    SELECT
      o.id AS order_id,
      o.restaurant_id,
      rest.name AS restaurant_name,
      ofb.id AS order_feedback_id,
      ofb.overall_rating,
      ofb.comment AS overall_comment,
      ofb.created_at AS feedback_at,
      rev.id AS restaurant_review_id,
      rev.rating AS restaurant_rating,
      rev.comment AS restaurant_comment,
      dr.id AS delivery_review_id,
      dr.rating AS delivery_rating,
      dr.comment AS delivery_comment,
      dr.delivery_partner_id,
      dp.full_name AS delivery_partner_name,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM orders o
    LEFT JOIN order_feedback ofb ON ofb.order_id = o.id
    LEFT JOIN reviews rev ON rev.order_id = o.id
    LEFT JOIN delivery_reviews dr ON dr.order_id = o.id
    LEFT JOIN restaurants rest ON rest.id = o.restaurant_id
    LEFT JOIN delivery_partners dp ON dp.id = dr.delivery_partner_id
    LEFT JOIN users u ON u.id = COALESCE(ofb.user_id, rev.user_id, dr.user_id)
    ${where}
      AND (ofb.id IS NOT NULL OR rev.id IS NOT NULL OR dr.id IS NOT NULL)
    ORDER BY COALESCE(ofb.created_at, rev.created_at, dr.created_at) DESC NULLS LAST
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `;

  const [countRes, listRes] = await Promise.all([
    pool.query(countSql, countValues),
    pool.query(listSql, values),
  ]);

  return {
    rows: listRes.rows,
    total: countRes.rows[0]?.total || 0,
    limit: lim,
    offset: off,
  };
};

module.exports = {
  createOrderFeedback,
  getByOrderId,
  updateOrderFeedback,
  deleteByOrderId,
  listAdminOrderFeedback,
};
