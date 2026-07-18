/**
 * Access + refresh token helpers (additive — existing 30d JWT still works).
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[AUTH] WARNING: JWT_SECRET is not set. Using fallback secret (not safe for production).');
    return 'fallback_secret';
  }
  return secret;
};

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || `${getJwtSecret()}_refresh`;

const accessTtl = () => process.env.JWT_ACCESS_TTL || '30d';
const refreshTtl = () => process.env.JWT_REFRESH_TTL || '30d';

const generateToken = (id, extras = {}) => {
  return jwt.sign({ id, ...extras }, getJwtSecret(), {
    expiresIn: accessTtl(),
  });
};

const generateRefreshToken = async (userId, meta = {}) => {
  const token = jwt.sign({ id: userId, typ: 'refresh' }, getRefreshSecret(), {
    expiresIn: refreshTtl(),
  });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 30 * 864e5);

  try {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, expiresAt, meta.userAgent || null, meta.ip || null]
    );
  } catch (err) {
    console.warn('[AUTH] refresh token persist skipped', err.message);
  }
  return token;
};

const rotateRefreshToken = async (oldToken, meta = {}) => {
  let payload;
  try {
    payload = jwt.verify(oldToken, getRefreshSecret());
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }
  if (payload.typ !== 'refresh') {
    const err = new Error('Invalid refresh token type');
    err.status = 401;
    throw err;
  }

  const oldHash = crypto.createHash('sha256').update(oldToken).digest('hex');
  const existing = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [oldHash]
  );
  if (!existing.rows[0]) {
    const err = new Error('Refresh token revoked or unknown');
    err.status = 401;
    throw err;
  }

  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1`,
    [oldHash]
  );

  const access = generateToken(payload.id);
  const refresh = await generateRefreshToken(payload.id, meta);
  return { access, refresh, userId: payload.id };
};

const revokeRefreshToken = async (token) => {
  if (!token) return;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1`,
    [hash]
  );
};

const revokeAllForUser = async (userId) => {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
};

module.exports = generateToken;
module.exports.generateToken = generateToken;
module.exports.generateRefreshToken = generateRefreshToken;
module.exports.rotateRefreshToken = rotateRefreshToken;
module.exports.revokeRefreshToken = revokeRefreshToken;
module.exports.revokeAllForUser = revokeAllForUser;
module.exports.getJwtSecret = getJwtSecret;
