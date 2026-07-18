const { pool } = require('../config/db');

const listWishlist = async (userId) => {
  const { rows } = await pool.query(
    `SELECT w.id AS wishlist_id, w.note, w.created_at AS wishlisted_at,
            m.*, r.name AS restaurant_name, r.slug AS restaurant_slug
     FROM wishlists w
     JOIN menu_items m ON m.id = w.menu_item_id
     JOIN restaurants r ON r.id = m.restaurant_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows;
};

const addToWishlist = async (userId, menuItemId, note = null) => {
  const { rows } = await pool.query(
    `INSERT INTO wishlists (user_id, menu_item_id, note)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, menu_item_id) DO UPDATE SET note = COALESCE(EXCLUDED.note, wishlists.note)
     RETURNING *`,
    [userId, menuItemId, note]
  );
  return rows[0];
};

const removeFromWishlist = async (userId, menuItemId) => {
  await pool.query(
    `DELETE FROM wishlists WHERE user_id = $1 AND menu_item_id = $2`,
    [userId, menuItemId]
  );
};

module.exports = { listWishlist, addToWishlist, removeFromWishlist };
