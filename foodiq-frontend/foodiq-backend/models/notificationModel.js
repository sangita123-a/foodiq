const { pool } = require('../config/db');
const { typeToCategory } = require('../services/notificationTypes');

/**
 * DB-only insert (used by notificationService.notify).
 */
const insertNotification = async (
  userId,
  type,
  title,
  message,
  meta = null,
  extras = {}
) => {
  const role = extras.role || null;
  const orderId = extras.order_id || meta?.order_id || null;
  const category = extras.category || typeToCategory(type);
  const dedupeKey = extras.dedupe_key || null;

  if (dedupeKey) {
    const dup = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND dedupe_key = $2
         AND created_at > NOW() - INTERVAL '2 minutes'
       LIMIT 1`,
      [userId, dedupeKey]
    );
    if (dup.rows[0]) {
      return { ...dup.rows[0], _duplicate: true };
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO notifications (
       user_id, role, type, category, title, message, meta, order_id, dedupe_key, is_read
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, FALSE)
     RETURNING *`,
    [
      userId,
      role,
      type || 'alert',
      category,
      title,
      message,
      JSON.stringify(meta || {}),
      orderId,
      dedupeKey,
    ]
  );
  return rows[0];
};

/**
 * Backwards-compatible entry point used across the codebase.
 * Dispatches Socket.IO + FCM via notificationService.
 */
const createNotification = async (userId, type, title, message, meta = null) => {
  const { notify } = require('../services/notificationService');
  return notify({
    userId,
    type,
    title,
    message,
    meta: meta || {},
    orderId: meta?.order_id || null,
  });
};

const getNotificationsByUserId = async (userId, filters = {}) => {
  const { type = '', category = '', q = '', from = '', to = '', unread = '', limit = 100 } =
    filters;

  const { rows } = await pool.query(
    `SELECT *
     FROM notifications
     WHERE user_id = $1
       AND ($2 = '' OR type = $2 OR category = $2)
       AND ($3 = '' OR category = $3)
       AND ($4 = '' OR title ILIKE '%' || $4 || '%' OR message ILIKE '%' || $4 || '%')
       AND ($5 = '' OR created_at::date >= $5::date)
       AND ($6 = '' OR created_at::date <= $6::date)
       AND ($7 = '' OR ($7 = 'true' AND is_read = FALSE) OR ($7 = 'false' AND is_read = TRUE))
     ORDER BY created_at DESC
     LIMIT $8`,
    [
      userId,
      type || '',
      category || '',
      q || '',
      from || '',
      to || '',
      unread || '',
      Math.min(Number(limit) || 100, 200),
    ]
  );
  return rows;
};

const getUnreadCount = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return rows[0].count;
};

const markRead = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE notifications SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return rows[0];
};

const markAllRead = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE notifications SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND is_read = FALSE RETURNING id`,
    [userId]
  );
  return rows.length;
};

const deleteNotification = async (id, userId) => {
  const { rows } = await pool.query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return rows[0];
};

const clearAll = async (userId) => {
  await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
};

const upsertDeviceToken = async ({
  userId,
  token,
  platform = 'web',
  device_info = null,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO device_tokens (user_id, token, platform, device_info, last_seen_at)
     VALUES ($1, $2, $3, $4::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (token) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       platform = EXCLUDED.platform,
       device_info = COALESCE(EXCLUDED.device_info, device_tokens.device_info),
       is_active = TRUE,
       last_seen_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, token, platform, JSON.stringify(device_info || {})]
  );
  return rows[0];
};

const deactivateDeviceToken = async (token, userId = null) => {
  await pool.query(
    userId
      ? `UPDATE device_tokens SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE token = $1 AND user_id = $2`
      : `UPDATE device_tokens SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE token = $1`,
    userId ? [token, userId] : [token]
  );
};

const getActiveTokensForUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM device_tokens
     WHERE user_id = $1 AND is_active = TRUE
     ORDER BY last_seen_at DESC`,
    [userId]
  );
  return rows;
};

const getAdminUserIds = async () => {
  const { rows } = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
  return rows.map((r) => r.id);
};

module.exports = {
  insertNotification,
  createNotification,
  getNotificationsByUserId,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  clearAll,
  upsertDeviceToken,
  deactivateDeviceToken,
  getActiveTokensForUser,
  getAdminUserIds,
};
