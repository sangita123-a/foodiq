const { pool } = require('../config/db');

const recommendRestaurants = async ({ userId = null, limit = 8 } = {}) => {
  const lim = Math.min(Number(limit) || 8, 20);
  if (userId) {
    const { rows } = await pool.query(
      `SELECT r.id, r.name, r.slug, r.rating, r.image_url, COUNT(o.id)::int AS prior_orders
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.user_id = $1 AND r.is_active = TRUE
       GROUP BY r.id
       ORDER BY prior_orders DESC, r.rating DESC NULLS LAST
       LIMIT $2`,
      [userId, lim]
    );
    if (rows.length) {
      return { strategy: 'order_history', restaurants: rows };
    }
  }
  const { rows } = await pool.query(
    `SELECT id, name, slug, rating, image_url, 0 AS prior_orders
     FROM restaurants WHERE is_active = TRUE
     ORDER BY rating DESC NULLS LAST LIMIT $1`,
    [lim]
  );
  return { strategy: 'top_rated', restaurants: rows };
};

module.exports = { recommendRestaurants };
