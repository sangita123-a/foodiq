const { pool } = require('../config/db');

const getReviewsByRestaurant = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name, u.profile_image_url
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.restaurant_id = $1
     ORDER BY r.created_at DESC`,
    [restaurantId]
  );
  return rows;
};

const getReviewById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
  return rows[0];
};

const createReview = async (reviewData) => {
  const { user_id, restaurant_id, rating, comment } = reviewData;
  const query = `
    INSERT INTO reviews (user_id, restaurant_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [user_id, restaurant_id, rating, comment]);
  return rows[0];
};

const updateReview = async (id, reviewData) => {
  const { rating, comment } = reviewData;
  const query = `
    UPDATE reviews
    SET rating = COALESCE($1, rating),
        comment = COALESCE($2, comment)
    WHERE id = $3
    RETURNING *
  `;
  const { rows } = await pool.query(query, [rating, comment, id]);
  return rows[0];
};

const deleteReview = async (id) => {
  const { rows } = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING id, restaurant_id', [id]);
  return rows[0];
};

module.exports = {
  getReviewsByRestaurant,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
