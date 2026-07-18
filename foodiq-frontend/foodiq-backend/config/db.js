const { Pool } = require('pg');
require('dotenv').config();

function buildPoolConfig() {
  const max = Number(process.env.DB_POOL_MAX || 20);
  const idleTimeoutMillis = Number(process.env.DB_POOL_IDLE_MS || 30000);
  const connectionTimeoutMillis = Number(process.env.DB_POOL_CONNECT_MS || 10000);

  if (process.env.DATABASE_URL) {
    const isProd = process.env.NODE_ENV === 'production';
    const needsSsl =
      process.env.DB_SSL === 'true' ||
      (process.env.DB_SSL !== 'false' &&
        (isProd ||
          /supabase\.co|render\.com|neon\.tech|sslmode=require/i.test(
            process.env.DATABASE_URL
          )));

    return {
      connectionString: process.env.DATABASE_URL,
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

  if (password !== undefined && password !== '') {
    config.password = String(password);
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
  console.error('Unexpected idle client error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  getPoolStats: () => ({
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  }),
};
