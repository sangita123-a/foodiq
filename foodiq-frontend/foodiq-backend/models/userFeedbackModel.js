const { pool } = require('../config/db');

const createUserFeedback = async ({ user_id, category, message, page_url }) => {
  const { rows } = await pool.query(
    `INSERT INTO user_feedback (user_id, category, message, page_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user_id || null, category || 'general', message, page_url || null]
  );
  return rows[0];
};

const listUserFeedback = async ({ status, limit = 50, offset = 0 } = {}) => {
  const values = [];
  let where = 'WHERE 1=1';
  if (status) {
    values.push(status);
    where += ` AND status = $${values.length}`;
  }
  values.push(Math.min(Number(limit) || 50, 100));
  values.push(Number(offset) || 0);
  const { rows } = await pool.query(
    `SELECT f.*, u.full_name, u.email
     FROM user_feedback f
     LEFT JOIN users u ON u.id = f.user_id
     ${where}
     ORDER BY f.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows;
};

const updateUserFeedback = async (id, { status, admin_notes }) => {
  const { rows } = await pool.query(
    `UPDATE user_feedback
     SET status = COALESCE($1, status),
         admin_notes = COALESCE($2, admin_notes),
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status || null, admin_notes ?? null, id]
  );
  return rows[0];
};

module.exports = { createUserFeedback, listUserFeedback, updateUserFeedback };
