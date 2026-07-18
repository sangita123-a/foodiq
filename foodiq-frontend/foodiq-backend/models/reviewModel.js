const { pool } = require('../config/db');

const getReviewsByRestaurant = async (restaurantId, { includeHidden = false } = {}) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name, u.profile_image_url
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.restaurant_id = $1
       AND ($2::boolean OR COALESCE(r.status, 'visible') = 'visible')
     ORDER BY r.created_at DESC`,
    [restaurantId, includeHidden]
  );
  return rows;
};

const getReviewById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
  return rows[0];
};

const getReviewByOrder = async (orderId, userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM reviews WHERE order_id = $1 AND user_id = $2 LIMIT 1`,
    [orderId, userId]
  );
  return rows[0] || null;
};

const createReview = async (reviewData, client = pool) => {
  const { user_id, restaurant_id, rating, comment, order_id = null } = reviewData;
  const query = `
    INSERT INTO reviews (user_id, restaurant_id, rating, comment, order_id, status)
    VALUES ($1, $2, $3, $4, $5, 'visible')
    RETURNING *
  `;
  const { rows } = await client.query(query, [
    user_id,
    restaurant_id,
    rating,
    comment || null,
    order_id,
  ]);
  return rows[0];
};

const updateReview = async (id, reviewData, client = pool) => {
  const { rating, comment, status, admin_reply } = reviewData;
  if (rating != null) {
    const n = Number(rating);
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      const err = new Error('rating must be between 1 and 5');
      err.status = 400;
      throw err;
    }
  }
  const setReply = Object.prototype.hasOwnProperty.call(reviewData, 'admin_reply');
  const repliedAt =
    setReply && admin_reply != null && String(admin_reply).trim()
      ? new Date()
      : setReply
        ? null
        : undefined;

  const query = `
    UPDATE reviews
    SET rating = COALESCE($1, rating),
        comment = COALESCE($2, comment),
        status = COALESCE($3, status),
        admin_reply = CASE WHEN $6::boolean THEN $4 ELSE admin_reply END,
        replied_at = CASE
          WHEN $6::boolean THEN $5
          ELSE replied_at
        END
    WHERE id = $7
    RETURNING *
  `;
  const { rows } = await client.query(query, [
    rating ?? null,
    comment !== undefined ? comment : null,
    status ?? null,
    setReply ? admin_reply : null,
    repliedAt === undefined ? null : repliedAt,
    setReply,
    id,
  ]);
  return rows[0];
};

const deleteReview = async (id, client = pool) => {
  const { rows } = await client.query(
    'DELETE FROM reviews WHERE id = $1 RETURNING id, restaurant_id',
    [id]
  );
  return rows[0];
};

const listAdminReviews = async ({
  status,
  restaurantId = null,
  rating = null,
  from = null,
  to = null,
  limit = 50,
  offset = 0,
} = {}) => {
  const values = [];
  let where = 'WHERE 1=1';
  if (status) {
    values.push(status);
    where += ` AND COALESCE(r.status, 'visible') = $${values.length}`;
  }
  if (restaurantId) {
    values.push(restaurantId);
    where += ` AND r.restaurant_id = $${values.length}`;
  }
  if (rating != null && rating !== '') {
    values.push(Number(rating));
    where += ` AND r.rating = $${values.length}`;
  }
  if (from) {
    values.push(from);
    where += ` AND r.created_at::date >= $${values.length}::date`;
  }
  if (to) {
    values.push(to);
    where += ` AND r.created_at::date <= $${values.length}::date`;
  }
  const lim = Math.min(Number(limit) || 50, 100);
  const off = Number(offset) || 0;
  values.push(lim);
  values.push(off);

  const countValues = values.slice(0, -2);
  const [countRes, listRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM reviews r ${where}`,
      countValues
    ),
    pool.query(
      `SELECT r.*, u.full_name, u.email, rest.name AS restaurant_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN restaurants rest ON rest.id = r.restaurant_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    ),
  ]);

  return {
    rows: listRes.rows,
    total: countRes.rows[0]?.total || 0,
    limit: lim,
    offset: off,
  };
};

const listPartnerReviews = async (restaurantId, { limit = 100, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name, u.profile_image_url,
            (SELECT m.name FROM order_items oi
             JOIN menu_items m ON m.id = oi.menu_item_id
             WHERE oi.order_id = r.order_id
             LIMIT 1) AS ordered_dish
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.restaurant_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [restaurantId, Math.min(Number(limit) || 100, 200), Number(offset) || 0]
  );
  return rows;
};

module.exports = {
  getReviewsByRestaurant,
  getReviewById,
  getReviewByOrder,
  createReview,
  updateReview,
  deleteReview,
  listAdminReviews,
  listPartnerReviews,
};
