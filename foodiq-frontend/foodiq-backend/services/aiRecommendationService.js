const { pool } = require('../config/db');
const { recommendRestaurants } = require('./recommendationService');

/**
 * Enhanced AI-style recommendations: restaurants + dishes from order history.
 */
const getFoodRecommendations = async ({ userId = null, limit = 8 } = {}) => {
  const lim = Math.min(Number(limit) || 8, 20);
  const restaurants = await recommendRestaurants({ userId, limit: lim });

  let dishes = [];
  if (userId) {
    const { rows } = await pool.query(
      `SELECT m.id, m.name, m.image_url, m.price, m.discount_price, m.rating,
              r.name AS restaurant_name, r.id AS restaurant_id,
              COUNT(oi.id)::int AS times_ordered
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN menu_items m ON m.id = oi.menu_item_id
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE o.user_id = $1 AND r.is_active = TRUE
         AND (m.is_available IS NULL OR m.is_available = TRUE)
       GROUP BY m.id, r.id
       ORDER BY times_ordered DESC, m.rating DESC NULLS LAST
       LIMIT $2`,
      [userId, lim]
    );
    dishes = rows;
  }

  if (!dishes.length) {
    const { rows } = await pool.query(
      `SELECT m.id, m.name, m.image_url, m.price, m.discount_price, m.rating,
              r.name AS restaurant_name, r.id AS restaurant_id, 0 AS times_ordered
       FROM menu_items m
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE r.is_active = TRUE
         AND (m.is_available IS NULL OR m.is_available = TRUE)
       ORDER BY COALESCE(m.trending_score, 0) DESC, m.rating DESC NULLS LAST
       LIMIT $1`,
      [lim]
    );
    dishes = rows;
  }

  return {
    strategy: restaurants.strategy,
    restaurants: restaurants.restaurants,
    dishes,
  };
};

module.exports = { getFoodRecommendations };
