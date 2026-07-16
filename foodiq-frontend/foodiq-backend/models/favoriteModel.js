const { pool } = require('../config/db');

const getFavorites = async (userId) => {
  const query = `
    SELECT f.id as favorite_id, m.*, r.name as restaurant_name 
    FROM favorites f
    JOIN menu_items m ON f.menu_item_id = m.id
    JOIN restaurants r ON m.restaurant_id = r.id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

const addFavorite = async (userId, menuItemId) => {
  const query = `
    INSERT INTO favorites (user_id, menu_item_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, menu_item_id) DO NOTHING
    RETURNING *
  `;
  const { rows } = await pool.query(query, [userId, menuItemId]);
  return rows[0];
};

const removeFavorite = async (userId, menuItemId) => {
  await pool.query('DELETE FROM favorites WHERE user_id = $1 AND menu_item_id = $2', [userId, menuItemId]);
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite
};
