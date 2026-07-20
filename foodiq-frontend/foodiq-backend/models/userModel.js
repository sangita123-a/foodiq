const { pool } = require('../config/db');
const { normalizeEmail } = require('../utils/normalizeEmail');

const createUser = async (userData) => {
  const { full_name, email, password_hash, phone_number } = userData;
  const normalizedEmail = normalizeEmail(email);
  const query = `
    INSERT INTO users (full_name, email, password_hash, phone_number)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, phone_number, role, created_at, updated_at
  `;
  const values = [full_name, normalizedEmail, password_hash, phone_number];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const query = `SELECT * FROM users WHERE LOWER(TRIM(email)) = $1 AND COALESCE(is_deleted, false) = false`;
  const { rows } = await pool.query(query, [normalizedEmail]);
  return rows[0];
};

const findUserById = async (id) => {
  const query = `SELECT id, full_name, email, phone_number, role, admin_role, created_at, updated_at FROM users WHERE id = $1 AND COALESCE(is_deleted, false) = false`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

const updateUserProfile = async (id, userData) => {
  const { full_name, phone_number } = userData;
  const query = `
    UPDATE users 
    SET full_name = COALESCE($1, full_name), 
        phone_number = COALESCE($2, phone_number)
    WHERE id = $3
    RETURNING id, full_name, email, phone_number, role, created_at, updated_at
  `;
  const values = [full_name, phone_number, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const updateUserPassword = async (id, passwordHash) => {
  const { rows } = await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
    [passwordHash, id]
  );
  return rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
  updateUserPassword,
};
