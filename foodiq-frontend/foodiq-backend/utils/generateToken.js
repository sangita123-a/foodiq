/**
 * JWT secret validation + HS256-pinned token helpers.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');

const WEAK_SECRETS = new Set([
  'fallback_secret',
  'change-me-in-production',
  'secret',
  'jwt_secret',
  'foodiq',
  'password',
]);

const assertSecretStrength = (secret, label = 'JWT_SECRET') => {
  if (!secret || String(secret).length < 32) {
    const err = new Error(
      `${label} must be at least 32 characters. Generate with: openssl rand -hex 32`
    );
    err.code = 'WEAK_SECRET';
    throw err;
  }
  if (WEAK_SECRETS.has(String(secret).toLowerCase())) {
    const err = new Error(`${label} is a known weak/default value — refuse to use`);
    err.code = 'WEAK_SECRET';
    throw err;
  }
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    // Dev: require explicit secret — no hardcoded fallback
    throw new Error(
      'JWT_SECRET is not set. Add it to .env (min 32 chars). Example: openssl rand -hex 32'
    );
  }
  assertSecretStrength(secret, 'JWT_SECRET');
  return secret;
};

const getRefreshSecret = () => {
  if (process.env.JWT_REFRESH_SECRET) {
    assertSecretStrength(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
    return process.env.JWT_REFRESH_SECRET;
  }
  return crypto.createHmac('sha256', getJwtSecret()).update('foodiq-refresh-v1').digest('hex');
};

const accessTtl = () =>
  process.env.JWT_ACCESS_TTL || (process.env.NODE_ENV === 'production' ? '1h' : '7d');
const refreshTtl = () =>
  process.env.JWT_REFRESH_TTL || (process.env.NODE_ENV === 'production' ? '7d' : '14d');

const SIGN_OPTS = { algorithm: 'HS256' };
const VERIFY_OPTS = { algorithms: ['HS256'] };

const generateToken = (id, extras = {}) => {
  const { tv, token_version, ...rest } = extras;
  const tokenVersion = tv ?? token_version ?? 1;
  return jwt.sign({ id, tv: tokenVersion, ...rest }, getJwtSecret(), {
    expiresIn: accessTtl(),
    ...SIGN_OPTS,
  });
};

const generateRefreshToken = async (userId, meta = {}) => {
  const token = jwt.sign({ id: userId, typ: 'refresh' }, getRefreshSecret(), {
    expiresIn: refreshTtl(),
    ...SIGN_OPTS,
  });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 14 * 864e5);

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
    payload = jwt.verify(oldToken, getRefreshSecret(), VERIFY_OPTS);
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
    const reused = await pool.query(
      `SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NOT NULL LIMIT 1`,
      [oldHash]
    );
    if (reused.rows[0]?.user_id) {
      const { bumpTokenVersion } = require('./tokenVersion');
      await revokeAllForUser(reused.rows[0].user_id);
      await bumpTokenVersion(reused.rows[0].user_id);
      const err = new Error('Refresh token reuse detected. All sessions revoked.');
      err.status = 401;
      throw err;
    }
    const err = new Error('Refresh token revoked or unknown');
    err.status = 401;
    throw err;
  }

  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1`,
    [oldHash]
  );

  const { getTokenVersion } = require('./tokenVersion');
  const tv = await getTokenVersion(payload.id);
  const access = generateToken(payload.id, { tv });
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
  try {
    const { bumpTokenVersion } = require('./tokenVersion');
    await bumpTokenVersion(userId);
  } catch (err) {
    console.warn('[AUTH] token version bump skipped', err.message);
  }
  try {
    const { invalidateUserSession } = require('../middleware/authMiddleware');
    await invalidateUserSession(userId);
  } catch (err) {
    console.warn('[AUTH] session cache invalidate skipped', err.message);
  }
};

const verifyAccessToken = (token) =>
  jwt.verify(token, getJwtSecret(), VERIFY_OPTS);

module.exports = generateToken;
module.exports.generateToken = generateToken;
module.exports.generateRefreshToken = generateRefreshToken;
module.exports.rotateRefreshToken = rotateRefreshToken;
module.exports.revokeRefreshToken = revokeRefreshToken;
module.exports.revokeAllForUser = revokeAllForUser;
module.exports.getJwtSecret = getJwtSecret;
module.exports.getRefreshSecret = getRefreshSecret;
module.exports.assertSecretStrength = assertSecretStrength;
module.exports.verifyAccessToken = verifyAccessToken;
module.exports.VERIFY_OPTS = VERIFY_OPTS;
