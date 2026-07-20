const { pool } = require('../config/db');

const bumpTokenVersion = async (userId) => {
  if (!userId) return 1;
  const { rows } = await pool.query(
    `UPDATE users SET token_version = COALESCE(token_version, 1) + 1, updated_at = NOW()
     WHERE id = $1
     RETURNING token_version`,
    [userId]
  );
  return Number(rows[0]?.token_version || 1);
};

const getTokenVersion = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(token_version, 1)::int AS token_version FROM users WHERE id = $1`,
    [userId]
  );
  return Number(rows[0]?.token_version || 1);
};

module.exports = {
  bumpTokenVersion,
  getTokenVersion,
};
