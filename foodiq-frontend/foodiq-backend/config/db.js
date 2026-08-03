const { Pool } = require('pg');
require('dotenv').config();

/**
 * Ensures special characters in DATABASE_URL password are properly URL-encoded.
 * Example: @ -> %40, # -> %23, & -> %26
 */
function sanitizeDatabaseUrl(urlStr) {
  if (!urlStr) return '';
  let str = urlStr.trim();
  const match = str.match(/^(postgresql?:\/\/)([^/?#]+)(.*)$/i);
  if (!match) return str;

  const scheme = match[1];
  const userHost = match[2];
  const rest = match[3];

  const lastAtIdx = userHost.lastIndexOf('@');
  if (lastAtIdx === -1) return str; // No user/pass delimiter

  const authPart = userHost.substring(0, lastAtIdx);
  const hostPart = userHost.substring(lastAtIdx + 1);

  const colonIdx = authPart.indexOf(':');
  if (colonIdx === -1) return str; // Username only

  const user = authPart.substring(0, colonIdx);
  const pass = authPart.substring(colonIdx + 1);

  let decodedPass = pass;
  try {
    decodedPass = decodeURIComponent(pass);
  } catch {
    decodedPass = pass;
  }
  const encodedPass = encodeURIComponent(decodedPass);

  return `${scheme}${user}:${encodedPass}@${hostPart}${rest}`;
}

/**
 * Classify if an error is a database connection, authentication, or circuit breaker failure.
 */
function isDatabaseError(err) {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  const code = String(err.code || '').toUpperCase();

  return (
    code === 'ECIRCUITBREAKER' ||
    code === '28P01' || // invalid_password
    code === '28000' || // invalid_authorization_specification
    code === '57P01' || // admin_shutdown
    code === '57P03' || // cannot_connect_now
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    msg.includes('ecircuitbreaker') ||
    msg.includes('authentication failure') ||
    msg.includes('too many authentication failures') ||
    msg.includes('password authentication failed') ||
    msg.includes('connection temporarily blocked') ||
    msg.includes('connection refused') ||
    msg.includes('connect etimedout')
  );
}

/**
 * Returns a clean client-facing error message, masking raw database/ECIRCUITBREAKER errors.
 */
function getClientDatabaseErrorMessage(err) {
  if (isDatabaseError(err)) {
    return 'Database service is temporarily unavailable. Please try again in a few moments.';
  }
  return err?.message || 'Database error occurred.';
}

let firstDbErrorLogged = false;

function logFirstDbError(err, context = 'Database') {
  if (!firstDbErrorLogged && isDatabaseError(err)) {
    firstDbErrorLogged = true;
    console.error(`[CRITICAL DATABASE AUTH/CONNECTION FAILURE] (${context}):`, {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
  }
}

function buildPoolConfig() {
  const max = Number(process.env.DB_POOL_MAX || 20);
  const idleTimeoutMillis = Number(process.env.DB_POOL_IDLE_MS || 30000);
  const connectionTimeoutMillis = Number(process.env.DB_POOL_CONNECT_MS || 10000);

  // Empty DATABASE_URL (e.g. CI override) must fall through to discrete DB_* vars.
  const rawDatabaseUrl = String(process.env.DATABASE_URL || '').trim();
  if (rawDatabaseUrl) {
    const databaseUrl = sanitizeDatabaseUrl(rawDatabaseUrl);
    const isProd = process.env.NODE_ENV === 'production';
    const needsSsl =
      process.env.DB_SSL === 'true' ||
      (process.env.DB_SSL !== 'false' &&
        (isProd ||
          /supabase\.co|render\.com|neon\.tech|sslmode=require/i.test(databaseUrl)));

    return {
      connectionString: databaseUrl,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
      application_name: 'foodiq-api',
    };
  }

  const password = process.env.DB_PASSWORD;
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    database: process.env.DB_NAME || 'foodiq',
    max,
    idleTimeoutMillis,
    connectionTimeoutMillis,
    application_name: 'foodiq-api',
  };

  if (password !== undefined) {
    config.password = String(password);
  } else {
    config.password = 'postgres';
  }

  if (process.env.DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

const pool = new Pool(buildPoolConfig());

const stmtTimeout = Math.max(
  0,
  Math.floor(
    Number(
      process.env.DB_STATEMENT_TIMEOUT_MS ||
        (process.env.NODE_ENV === 'production' ? 15000 : 0)
    ) || 0
  )
);
if (stmtTimeout > 0 && Number.isFinite(stmtTimeout)) {
  pool.on('connect', (client) => {
    client.query(`SET statement_timeout TO ${stmtTimeout}`).catch(() => {});
  });
}

pool.on('error', (err) => {
  logFirstDbError(err, 'Pool Idle Client');
  console.error('Unexpected idle client error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  sanitizeDatabaseUrl,
  isDatabaseError,
  getClientDatabaseErrorMessage,
  logFirstDbError,
  getPoolStats: () => ({
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  }),
};

