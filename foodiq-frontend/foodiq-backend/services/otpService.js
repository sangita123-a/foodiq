const crypto = require('crypto');
const { pool } = require('../config/db');
const { sendEmail } = require('./emailService');
const { sendSms } = require('./smsService');
const { templates } = require('./emailTemplates');

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RATE_WINDOW_MIN = Number(process.env.OTP_RATE_WINDOW_MIN || 15);
const OTP_RATE_MAX = Number(process.env.OTP_RATE_MAX || 5);

const generateCode = (len = 6) => {
  const n = crypto.randomInt(0, 10 ** len);
  return String(n).padStart(len, '0');
};

const hashCode = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

/**
 * Rate-limit OTP requests per destination + purpose.
 */
const assertRateLimit = async (destination, purpose) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM otp_codes
     WHERE destination = $1 AND purpose = $2
       AND created_at > NOW() - ($3 * INTERVAL '1 minute')`,
    [destination, purpose, OTP_RATE_WINDOW_MIN]
  );
  if (rows[0].c >= OTP_RATE_MAX) {
    const err = new Error('Too many OTP requests. Please try again later.');
    err.status = 429;
    throw err;
  }
};

/**
 * Create + deliver OTP via email and/or SMS.
 */
const issueOtp = async ({
  userId = null,
  destination,
  channel = 'email', // email | sms | both
  purpose = 'verification',
  name = null,
}) => {
  if (!destination) {
    const err = new Error('destination is required');
    err.status = 400;
    throw err;
  }

  await assertRateLimit(destination, purpose);

  const code = generateCode(6);
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  // Invalidate previous unused codes
  await pool.query(
    `UPDATE otp_codes SET consumed_at = CURRENT_TIMESTAMP
     WHERE destination = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [destination, purpose]
  );

  const { rows } = await pool.query(
    `INSERT INTO otp_codes (
       user_id, destination, channel, purpose, code_hash, expires_at
     ) VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, expires_at`,
    [userId, destination, channel, purpose, codeHash, expiresAt]
  );

  const channels = channel === 'both' ? ['email', 'sms'] : [channel];

  if (channels.includes('email') && destination.includes('@')) {
    const tpl = purpose.includes('reset')
      ? templates.passwordReset({ name, code })
      : templates.otp({ code, purpose });
    await sendEmail({
      to: destination,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      userId,
      template: purpose,
      meta: { otp_id: rows[0].id },
    }).catch((err) => console.warn('[otp] email failed', err.message));
  }

  if (channels.includes('sms')) {
    const phone = destination.includes('@') ? null : destination;
    // If email destination but both, need phone from user
    let smsTo = phone;
    if (!smsTo && userId) {
      const u = await pool.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
      smsTo = u.rows[0]?.phone_number;
    }
    if (smsTo) {
      await sendSms({
        to: smsTo,
        body: `Foodiq ${purpose} code: ${code}. Valid for ${OTP_TTL_MINUTES} minutes.`,
        userId,
        template: purpose,
        meta: { otp_id: rows[0].id },
      }).catch((err) => console.warn('[otp] sms failed', err.message));
    }
  }

  const response = {
    otp_id: rows[0].id,
    expires_at: rows[0].expires_at,
    channel,
  };

  // Expose code only in mock/dev for easier testing
  if (process.env.OTP_EXPOSE_CODE === 'true' || process.env.EMAIL_PROVIDER === 'mock') {
    response.debug_code = code;
  }

  return response;
};

const verifyOtp = async ({ destination, purpose, code }) => {
  if (!destination || !code) {
    const err = new Error('destination and code are required');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `SELECT * FROM otp_codes
     WHERE destination = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [destination, purpose]
  );
  const row = rows[0];
  if (!row) {
    const err = new Error('No active OTP found. Request a new code.');
    err.status = 400;
    throw err;
  }
  if (new Date(row.expires_at) < new Date()) {
    const err = new Error('OTP expired. Request a new code.');
    err.status = 400;
    throw err;
  }
  if (Number(row.attempts) >= OTP_MAX_ATTEMPTS) {
    const err = new Error('Too many invalid attempts. Request a new code.');
    err.status = 429;
    throw err;
  }

  const ok = hashCode(String(code).trim()) === row.code_hash;
  await pool.query(
    `UPDATE otp_codes SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [row.id]
  );

  if (!ok) {
    const err = new Error('Invalid OTP code');
    err.status = 400;
    throw err;
  }

  await pool.query(
    `UPDATE otp_codes SET consumed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [row.id]
  );

  return { ok: true, user_id: row.user_id };
};

module.exports = {
  issueOtp,
  verifyOtp,
  generateCode,
};
