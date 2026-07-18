const { pool } = require('../config/db');

const recordView = async ({ userId = null, sessionKey = null, itemType, itemId }) => {
  if (!itemType || !itemId) return null;
  // Deduplicate rapid re-views: update timestamp if same item viewed recently
  if (userId) {
    const existing = await pool.query(
      `SELECT id FROM recently_viewed
       WHERE user_id = $1 AND item_type = $2 AND item_id = $3
         AND viewed_at > NOW() - INTERVAL '1 day'
       LIMIT 1`,
      [userId, itemType, itemId]
    );
    if (existing.rows[0]) {
      const { rows } = await pool.query(
        `UPDATE recently_viewed SET viewed_at = NOW() WHERE id = $1 RETURNING *`,
        [existing.rows[0].id]
      );
      return rows[0];
    }
  }
  const { rows } = await pool.query(
    `INSERT INTO recently_viewed (user_id, session_key, item_type, item_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId || null, sessionKey || null, itemType, itemId]
  );
  return rows[0];
};

const listRecent = async ({ userId = null, sessionKey = null, limit = 12 } = {}) => {
  const lim = Math.min(Number(limit) || 12, 40);
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (rv.item_type, rv.item_id)
            rv.item_type, rv.item_id, rv.viewed_at,
            CASE WHEN rv.item_type = 'restaurant' THEN r.name ELSE m.name END AS name,
            CASE WHEN rv.item_type = 'restaurant' THEN r.image_url ELSE m.image_url END AS image_url,
            CASE WHEN rv.item_type = 'restaurant' THEN r.slug ELSE NULL END AS slug,
            CASE WHEN rv.item_type = 'menu_item' THEN m.price ELSE NULL END AS price,
            CASE WHEN rv.item_type = 'menu_item' THEN rest.name ELSE NULL END AS restaurant_name
     FROM recently_viewed rv
     LEFT JOIN restaurants r ON rv.item_type = 'restaurant' AND r.id = rv.item_id
     LEFT JOIN menu_items m ON rv.item_type = 'menu_item' AND m.id = rv.item_id
     LEFT JOIN restaurants rest ON m.restaurant_id = rest.id
     WHERE ($1::uuid IS NOT NULL AND rv.user_id = $1)
        OR ($2::text IS NOT NULL AND rv.session_key = $2)
     ORDER BY rv.item_type, rv.item_id, rv.viewed_at DESC`,
    [userId || null, sessionKey || null]
  );
  return rows
    .sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at))
    .slice(0, lim);
};

module.exports = { recordView, listRecent };
