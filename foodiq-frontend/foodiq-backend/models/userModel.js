const { pool } = require('../config/db');
const { normalizeEmail } = require('../utils/normalizeEmail');
const { toE164Indian, phoneMatchVariants, normalizeIndianMobile } = require('../utils/phone');

const createUser = async (userData) => {
  const { full_name, email, password_hash, phone_number, is_phone_verified = false } = userData;
  const normalizedEmail = normalizeEmail(email);
  const phone = phone_number ? toE164Indian(phone_number) : null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone_number, is_phone_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone_number, role, is_phone_verified, created_at, updated_at`,
      [full_name, normalizedEmail, password_hash, phone, Boolean(is_phone_verified)]
    );
    return rows[0];
  } catch (err) {
    if (!String(err.message || '').includes('is_phone_verified')) throw err;
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone_number)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, phone_number, role, created_at, updated_at`,
      [full_name, normalizedEmail, password_hash, phone]
    );
    return rows[0];
  }
};

const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const query = `SELECT * FROM users WHERE LOWER(TRIM(email)) = $1 AND COALESCE(is_deleted, false) = false`;
  const { rows } = await pool.query(query, [normalizedEmail]);
  return rows[0];
};

const findUserByPhone = async (phone) => {
  const variants = phoneMatchVariants(phone);
  if (!variants.length) return null;
  const query = `
    SELECT *
    FROM users
    WHERE COALESCE(is_deleted, false) = false
      AND (
        TRIM(phone_number) = ANY($1::text[])
        OR regexp_replace(COALESCE(phone_number, ''), '\\D', '', 'g') = $2
      )
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [variants, normalizeIndianMobile(phone)]);
  return rows[0] || null;
};

const findUserById = async (id) => {
  const query = `SELECT id, full_name, email, phone_number, role, admin_role, COALESCE(token_version, 1)::int AS token_version, COALESCE(is_phone_verified, false) AS is_phone_verified, created_at, updated_at FROM users WHERE id = $1 AND COALESCE(is_deleted, false) = false`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

const updateUserProfile = async (id, userData) => {
  const { full_name, phone_number } = userData;
  const phone = phone_number ? toE164Indian(phone_number) : null;
  const query = `
    UPDATE users 
    SET full_name = COALESCE($1, full_name), 
        phone_number = COALESCE($2, phone_number)
    WHERE id = $3
    RETURNING id, full_name, email, phone_number, role, created_at, updated_at
  `;
  const values = [full_name, phone, id];
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

const markPhoneVerified = async (id) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_phone_verified = true, updated_at = NOW()
     WHERE id = $1
     RETURNING id, full_name, email, phone_number, role, admin_role, is_phone_verified, COALESCE(token_version, 1)::int AS token_version`,
    [id]
  );
  return rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  updateUserProfile,
  updateUserPassword,
  markPhoneVerified,
};
