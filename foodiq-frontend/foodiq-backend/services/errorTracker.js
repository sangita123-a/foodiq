/**
 * Central error event tracker (DB + file logs).
 */
const { pool } = require('../config/db');
const { log } = require('../utils/logger');
const { bump } = require('./metricsService');

const trackError = async ({
  source = 'backend',
  type = 'exception',
  message,
  stack = null,
  statusCode = null,
  path = null,
  method = null,
  userId = null,
  requestId = null,
  meta = {},
}) => {
  bump('errors');
  log.error(message || 'error', {
    source,
    type,
    statusCode,
    path,
    method,
    userId,
    requestId,
    stack: stack ? String(stack).slice(0, 4000) : undefined,
    ...meta,
  });

  try {
    const { rows } = await pool.query(
      `INSERT INTO error_events (
         source, type, message, stack, status_code, path, method,
         user_id, request_id, meta
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
       RETURNING id, created_at`,
      [
        source,
        type,
        String(message || 'Unknown error').slice(0, 2000),
        stack ? String(stack).slice(0, 8000) : null,
        statusCode,
        path,
        method,
        userId,
        requestId,
        JSON.stringify(meta || {}),
      ]
    );
    return rows[0];
  } catch (err) {
    log.warn('error_events insert failed', { error: err.message });
    return null;
  }
};

const listErrors = async ({
  source = '',
  type = '',
  q = '',
  limit = 100,
  offset = 0,
} = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM error_events
     WHERE ($1 = '' OR source = $1)
       AND ($2 = '' OR type = $2)
       AND ($3 = '' OR message ILIKE '%' || $3 || '%' OR path ILIKE '%' || $3 || '%')
     ORDER BY created_at DESC
     LIMIT $4 OFFSET $5`,
    [source, type, q.trim(), Math.min(Number(limit) || 100, 500), Number(offset) || 0]
  );
  return rows;
};

module.exports = {
  trackError,
  listErrors,
};
