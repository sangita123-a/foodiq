const { Pool } = require('pg');
require('dotenv').config();

function buildPoolConfig() {
  if (process.env.DATABASE_URL) {
    const needsSsl =
      process.env.DB_SSL === 'true' ||
      /supabase\.co|sslmode=require/i.test(process.env.DATABASE_URL);

    return {
      connectionString: process.env.DATABASE_URL,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  const password = process.env.DB_PASSWORD;
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    database: process.env.DB_NAME || 'foodiq',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  // Only set password when provided (supports local trust auth)
  if (password !== undefined && password !== '') {
    config.password = String(password);
  }

  if (process.env.DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected idle client error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
