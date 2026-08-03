const crypto = require('crypto');
const { pool } = require('../config/db');
const { sendEmail } = require('./emailService');
const { sendSms } = require('./smsService');
const { templates } = require('./emailTemplates');
const { log } = require('../utils/logger');

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 5);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RATE_WINDOW_MIN = Number(process.env.OTP_RATE_WINDOW_MIN || 60);
const OTP_RATE_MAX = Number(process.env.OTP_RATE_MAX || 5);

const generateCode = (len = 6) => {
  const n = crypto.randomInt(0, 10 ** len);
  return String(n).padStart(len, '0');
};

const hashCode = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

/**
 * Rate-limit OTP requests per destination + purpose.
 * Max OTP_RATE_MAX requests in OTP_RATE_WINDOW_MIN minutes (default 5 per hour).
 */
const assertRateLimit = async (destination, purpose) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM otp_codes
     WHERE destination = $1 AND purpose = $2
       AND created_at > NOW() - ($3 * INTERVAL '1 minute')`,
    [destination, purpose, OTP_RATE_WINDOW_MIN]
  );
  log.info('[otp] rate-limit check', {
    destination,
    purpose,
    count: rows[0].c,
    max: OTP_RATE_MAX,
    window_min: OTP_RATE_WINDOW_MIN,
  });
  if (rows[0].c >= OTP_RATE_MAX) {
    log.warn('[otp] rate limit exceeded', { destination, purpose, count: rows[0].c });
    const err = new Error('Too many OTP requests. Please try again later.');
    err.status = 429;
    throw err;
  }
};

/**
 * Create + deliver OTP via email and/or SMS.
 *
 * @param {object} opts
 * @param {string|null} opts.userId
 * @param {string} opts.destination  - E.164 phone (+91xxxxxxxxxx) or email
 * @param {'email'|'sms'|'both'} opts.channel
 * @param {string} opts.purpose      - phone_login | email_login | password_reset | verification
 * @param {string|null} opts.name
 * @returns {{ otp_id, expires_at, channel, sms_sent, email_sent, debug_code? }}
 */
const issueOtp = async ({
  userId = null,
  destination,
  channel = 'email',
  purpose = 'verification',
  name = null,
  ttlMinutes = null,
}) => {
  if (!destination) {
    const err = new Error('destination is required');
    err.status = 400;
    throw err;
  }

  log.info('[otp] issueOtp called', { userId, destination, channel, purpose });

  await assertRateLimit(destination, purpose);

  const code = generateCode(6);
  const codeHash = hashCode(code);
  const effectiveTtl = Number(ttlMinutes || process.env.OTP_TTL_MINUTES || 10);
  const expiresAt = new Date(Date.now() + effectiveTtl * 60_000);

  log.info('[otp] code generated', {
    destination,
    purpose,
    expiresAt,
    ttl_minutes: effectiveTtl,
  });

  // Invalidate previous unused codes for this destination+purpose
  const invalidated = await pool.query(
    `UPDATE otp_codes SET consumed_at = CURRENT_TIMESTAMP
     WHERE destination = $1 AND purpose = $2 AND consumed_at IS NULL
     RETURNING id`,
    [destination, purpose]
  );
  if (invalidated.rowCount > 0) {
    log.info('[otp] invalidated previous OTPs', {
      destination,
      purpose,
      count: invalidated.rowCount,
    });
  }

  const { rows } = await pool.query(
    `INSERT INTO otp_codes (
       user_id, destination, channel, purpose, code_hash, expires_at
     ) VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, expires_at`,
    [userId, destination, channel, purpose, codeHash, expiresAt]
  );

  const otpId = rows[0].id;
  log.info('[otp] OTP saved to database', { otp_id: otpId, destination, purpose });

  const isEmailDest = destination.includes('@');
  const resolvedChannel = channel === 'auto' ? (isEmailDest ? 'email' : 'sms') : channel;
  const channels = resolvedChannel === 'both' ? ['email', 'sms'] : [resolvedChannel];

  let emailSent = false;
  let emailFailed = false;
  let emailError = null;
  let smsSent = false;
  let smsFailed = false;
  let smsError = null;

  // ── Email channel ───────────────────────────────────────────────────────────
  if (channels.includes('email')) {
    let emailTo = isEmailDest ? destination : null;
    if (!emailTo && userId) {
      const u = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
      emailTo = u.rows[0]?.email || null;
    }

    if (emailTo) {
      const tpl = purpose.includes('reset')
        ? templates.passwordReset({ name, code })
        : templates.otp({ code, purpose });
      log.info('[otp] dispatching email', { to: emailTo, purpose, otp_id: otpId });

      try {
        const emailResult = await sendEmail({
          to: emailTo,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
          userId,
          template: purpose,
          meta: { otp_id: otpId },
        });
        emailSent = true;
        log.info('[otp] Email dispatched successfully', {
          to: emailTo,
          provider_id: emailResult.id,
          mock: emailResult.mock,
        });
      } catch (err) {
        emailFailed = true;
        emailError = err.message;
        log.error('[otp] Email dispatch failed', {
          to: emailTo,
          purpose,
          otp_id: otpId,
          error: err.message,
        });
      }
    } else {
      emailFailed = true;
      emailError = 'No email address found for this account.';
      log.warn('[otp] Email channel requested but no email address resolved', {
        destination,
        userId,
      });
    }
  }

  // ── SMS channel ─────────────────────────────────────────────────────────────
  if (channels.includes('sms')) {
    let smsTo = !isEmailDest ? destination : null;
    if (!smsTo && userId) {
      const u = await pool.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
      smsTo = u.rows[0]?.phone_number || null;
    }

    if (smsTo) {
      const smsBody = `[Foodiq] Your OTP is ${code}. Valid for ${OTP_TTL_MINUTES} minutes. Do not share with anyone.`;
      log.info('[otp] dispatching SMS', { to: smsTo, purpose, otp_id: otpId });

      try {
        const smsResult = await sendSms({
          to: smsTo,
          body: smsBody,
          userId,
          template: purpose,
          meta: { otp_id: otpId },
        });
        smsSent = true;
        log.info('[otp] SMS dispatched successfully', {
          to: smsTo,
          provider_id: smsResult.id,
          mock: smsResult.mock,
        });
      } catch (err) {
        smsFailed = true;
        smsError = err.message;
        log.error('[otp] SMS dispatch failed', {
          to: smsTo,
          purpose,
          otp_id: otpId,
          error: err.message,
        });
      }
    } else {
      log.warn('[otp] SMS channel requested but no phone resolved', {
        destination,
        userId,
      });
    }
  }

  // Email OTP is only meaningful if it actually reached the provider — a
  // 200-looking response that silently dropped the email (e.g. Resend's
  // sandbox rejecting the recipient) must never be reported as success.
  if (channels.includes('email') && !emailSent) {
    log.error('[otp] OTP request failed: email channel required but not delivered', {
      destination,
      purpose,
      otp_id: otpId,
      error: emailError,
    });
    const err = new Error('Failed to send OTP email.');
    err.status = 500;
    err.code = 'OTP_EMAIL_DELIVERY_FAILED';
    err.detail = emailError;
    throw err;
  }

  const response = {
    otp_id: otpId,
    expires_at: rows[0].expires_at,
    channel: resolvedChannel,
    email_sent: emailSent,
    sms_sent: smsSent,
  };

  if (emailFailed) response.email_error = emailError;
  if (smsFailed) response.sms_error = smsError;

  // Expose OTP code in non-production + OTP_EXPOSE_CODE=true
  if (
    process.env.NODE_ENV !== 'production' &&
    String(process.env.OTP_EXPOSE_CODE || '').toLowerCase() === 'true'
  ) {
    response.debug_code = code;
    log.info('[otp] debug_code exposed (dev mode)', { otp_id: otpId, debug_code: code });
  }

  return response;
};

/**
 * Verify an OTP code against the stored hash.
 * Throws with .status set on any failure.
 *
 * @param {{ destination: string, purpose: string, code: string }}
 * @returns {{ ok: true, user_id: string|null }}
 */
const verifyOtp = async ({ destination, purpose, code }) => {
  if (!destination || !code) {
    const err = new Error('destination and code are required');
    err.status = 400;
    throw err;
  }

  log.info('[otp] verifyOtp called', { destination, purpose });

  const { rows } = await pool.query(
    `SELECT * FROM otp_codes
     WHERE destination = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [destination, purpose]
  );
  const row = rows[0];

  if (!row) {
    log.warn('[otp] no active OTP found', { destination, purpose });
    const err = new Error('No active OTP found. Request a new code.');
    err.status = 400;
    throw err;
  }

  if (new Date(row.expires_at) < new Date()) {
    log.warn('[otp] OTP expired', { destination, purpose, otp_id: row.id, expires_at: row.expires_at });
    const err = new Error('OTP expired. Request a new code.');
    err.status = 400;
    throw err;
  }

  if (Number(row.attempts) >= OTP_MAX_ATTEMPTS) {
    log.warn('[otp] too many failed attempts', {
      destination,
      purpose,
      otp_id: row.id,
      attempts: row.attempts,
    });
    const err = new Error('Too many invalid attempts. Request a new code.');
    err.status = 429;
    throw err;
  }

  const ok = hashCode(String(code).trim()) === row.code_hash;

  // Always increment attempt counter
  await pool.query(
    `UPDATE otp_codes SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [row.id]
  );

  if (!ok) {
    log.warn('[otp] invalid OTP code submitted', {
      destination,
      purpose,
      otp_id: row.id,
      attempts_after: Number(row.attempts) + 1,
    });
    const err = new Error('Invalid OTP code');
    err.status = 400;
    throw err;
  }

  // Mark as consumed
  await pool.query(
    `UPDATE otp_codes SET consumed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [row.id]
  );

  log.info('[otp] OTP verified and consumed', {
    destination,
    purpose,
    otp_id: row.id,
    user_id: row.user_id,
  });

  return { ok: true, user_id: row.user_id };
};

module.exports = {
  issueOtp,
  verifyOtp,
  generateCode,
};
