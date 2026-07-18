/**
 * In-process notification push queue with retries.
 * Production can swap for Redis/Bull without changing notify() API.
 */
const { pool } = require('../config/db');
const { sendToTokens } = require('./fcmService');
const { getActiveTokensForUser, deactivateDeviceToken } = require('../models/notificationModel');

const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 600_000];

let processing = false;
let timer = null;

const enqueuePush = async ({
  userId,
  notificationId = null,
  title,
  body,
  data = {},
}) => {
  const { rows } = await pool.query(
    `INSERT INTO notification_queue (
       user_id, notification_id, title, body, payload, status, attempts, next_attempt_at
     ) VALUES ($1, $2, $3, $4, $5::jsonb, 'pending', 0, CURRENT_TIMESTAMP)
     RETURNING *`,
    [userId, notificationId, title, body, JSON.stringify(data)]
  );
  scheduleProcess(500);
  return rows[0];
};

const scheduleProcess = (delayMs = 2000) => {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    processQueue().catch((err) => console.error('[notif-queue]', err.message));
  }, delayMs);
  timer.unref?.();
};

const processQueue = async () => {
  if (processing) return;
  processing = true;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notification_queue
       WHERE status IN ('pending', 'failed')
         AND attempts < $1
         AND next_attempt_at <= CURRENT_TIMESTAMP
       ORDER BY created_at ASC
       LIMIT 25`,
      [MAX_ATTEMPTS]
    );

    for (const job of rows) {
      await processJob(job);
    }

    const pending = await pool.query(
      `SELECT COUNT(*)::int AS c FROM notification_queue
       WHERE status IN ('pending', 'failed') AND attempts < $1`,
      [MAX_ATTEMPTS]
    );
    if (pending.rows[0].c > 0) {
      scheduleProcess(RETRY_DELAYS_MS[0]);
    }
  } finally {
    processing = false;
  }
};

const processJob = async (job) => {
  try {
    await pool.query(
      `UPDATE notification_queue SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [job.id]
    );

    const tokens = await getActiveTokensForUser(job.user_id);
    if (tokens.length === 0) {
      await pool.query(
        `UPDATE notification_queue
         SET status = 'skipped', last_error = 'no_device_tokens', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [job.id]
      );
      return;
    }

    const result = await sendToTokens({
      tokens: tokens.map((t) => t.token),
      title: job.title,
      body: job.body,
      data: job.payload || {},
    });

    for (const bad of result.invalidTokens || []) {
      await deactivateDeviceToken(bad);
    }

    if (result.failureCount > 0 && result.successCount === 0) {
      throw new Error(result.error || `All ${result.failureCount} FCM sends failed`);
    }

    await pool.query(
      `UPDATE notification_queue
       SET status = 'sent', attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [job.id]
    );
  } catch (err) {
    const attempts = Number(job.attempts || 0) + 1;
    const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
    const status = attempts >= MAX_ATTEMPTS ? 'dead' : 'failed';
    await pool.query(
      `UPDATE notification_queue
       SET status = $1,
           attempts = $2,
           last_error = $3,
           next_attempt_at = CURRENT_TIMESTAMP + make_interval(secs => $4::int),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [status, attempts, err.message, Math.round(delay / 1000), job.id]
    );
    console.warn('[notif-queue] retry', job.id, status, err.message);
  }
};

// Kick off periodic sweep
setInterval(() => {
  processQueue().catch(() => {});
}, 30_000).unref?.();

module.exports = {
  enqueuePush,
  processQueue,
  scheduleProcess,
};
