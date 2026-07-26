/**
 * SMS provider layer: mock | twilio | msg91 | fast2sms | auto
 *
 * Automatically detects configured credentials or uses SMS_PROVIDER setting.
 * Supports standard environment variables and aliases:
 * - FAST2SMS: FAST2SMS_API_KEY || SMS_API_KEY
 * - MSG91: MSG91_AUTH_KEY || SMS_API_KEY, MSG91_SENDER_ID || SMS_SENDER_ID, MSG91_TEMPLATE_ID
 * - TWILIO: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN || SMS_API_SECRET, TWILIO_FROM_NUMBER || TWILIO_PHONE_NUMBER
 *
 * In development (mock), the OTP is printed to the structured log.
 * Set OTP_EXPOSE_CODE=true in .env to also see it in the API response toast.
 */
const { pool } = require('../config/db');
const { log } = require('../utils/logger');

// Environment variable resolution with aliases
const getFast2SmsKey = () => process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
const getMsg91AuthKey = () => process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY;
const getMsg91SenderId = () => process.env.MSG91_SENDER_ID || process.env.SMS_SENDER_ID || 'FOODIQ';
const getTwilioSid = () => process.env.TWILIO_ACCOUNT_SID;
const getTwilioToken = () => process.env.TWILIO_AUTH_TOKEN || process.env.SMS_API_SECRET;
const getTwilioFrom = () => process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;

/**
 * Detect provider from process.env or auto-detect based on present API keys
 */
const provider = () => {
  const configured = String(process.env.SMS_PROVIDER || '').toLowerCase().trim();
  if (configured && configured !== 'auto') return configured;

  // Auto-detect based on configured credentials
  if (getFast2SmsKey()) return 'fast2sms';
  if (getTwilioSid() && getTwilioToken() && getTwilioFrom()) return 'twilio';
  if (getMsg91AuthKey()) return 'msg91';

  return 'mock';
};

const isMock = () => {
  const p = provider();
  if (p === 'mock') return true;

  if (p === 'twilio' && (!getTwilioSid() || !getTwilioToken() || !getTwilioFrom())) {
    log.warn('[sms] SMS_PROVIDER=twilio but required credentials missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN/SMS_API_SECRET, TWILIO_FROM_NUMBER/TWILIO_PHONE_NUMBER) — falling back to mock');
    return true;
  }
  if (p === 'msg91' && !getMsg91AuthKey()) {
    log.warn('[sms] SMS_PROVIDER=msg91 but MSG91_AUTH_KEY/SMS_API_KEY missing — falling back to mock');
    return true;
  }
  if (p === 'fast2sms' && !getFast2SmsKey()) {
    log.warn('[sms] SMS_PROVIDER=fast2sms but FAST2SMS_API_KEY/SMS_API_KEY missing — falling back to mock');
    return true;
  }
  return false;
};

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const logSms = async (row) => {
  try {
    await pool.query(
      `INSERT INTO sms_logs (
         user_id, to_phone, body, template, status, provider, provider_message_id,
         error, attempts, meta, related_order_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)`,
      [
        row.user_id || null,
        row.to_phone,
        row.body,
        row.template || null,
        row.status,
        row.provider || provider(),
        row.provider_message_id || null,
        row.error || null,
        row.attempts || 1,
        JSON.stringify(row.meta || {}),
        row.related_order_id || null,
      ]
    );
  } catch (err) {
    log.warn('[sms] DB log failed (sms_logs)', { error: err.message });
  }
};

// ── Provider implementations ────────────────────────────────────────────────

const sendViaTwilio = async (to, body) => {
  const sid = getTwilioSid();
  const token = getTwilioToken();
  const from = getTwilioFrom();

  if (!sid || !token || !from) {
    throw new Error('Twilio credentials incomplete: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN (or SMS_API_SECRET), and TWILIO_FROM_NUMBER (or TWILIO_PHONE_NUMBER) are required');
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({
    To: to.startsWith('+') ? to : `+${to}`,
    From: from.startsWith('+') ? from : `+${from}`,
    Body: body,
  });

  log.info('[sms:twilio] sending message', { to, from });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    }
  );
  const data = await res.json();
  if (!res.ok) {
    log.error('[sms:twilio] API error', { status: res.status, message: data.message, code: data.code });
    throw new Error(data.message || `Twilio HTTP ${res.status}`);
  }
  log.info('[sms:twilio] message sent', { sid: data.sid, status: data.status, to });
  return { id: data.sid, status: data.status };
};

const sendViaMsg91 = async (to, body) => {
  const authKey = getMsg91AuthKey();
  const senderId = getMsg91SenderId();

  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY or SMS_API_KEY environment variable is required for msg91 provider');
  }

  log.info('[sms:msg91] sending message', { to, senderId });

  // Legacy sendhttp API (works without DLT template for transactional)
  if (!process.env.MSG91_TEMPLATE_ID) {
    const legacy = await fetch(
      `https://api.msg91.com/api/sendhttp.php?authkey=${encodeURIComponent(
        authKey
      )}&mobiles=${encodeURIComponent(to)}&message=${encodeURIComponent(
        body
      )}&sender=${encodeURIComponent(
        senderId
      )}&route=4&country=91`
    );
    const text = await legacy.text();
    log.info('[sms:msg91] legacy API response', { to, response: text });
    return { id: text.trim(), status: 'submitted' };
  }

  // Flow API
  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      authkey: authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      short_url: '0',
      recipients: [{ mobiles: to, VAR1: body }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    log.error('[sms:msg91] flow API error', { status: res.status, data });
    throw new Error(data.message || `MSG91 HTTP ${res.status}`);
  }
  log.info('[sms:msg91] flow message sent', { request_id: data.request_id, to });
  return { id: data.request_id || data.type, status: 'submitted' };
};

const sendViaFast2Sms = async (to, body) => {
  const apiKey = getFast2SmsKey();
  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY or SMS_API_KEY environment variable is required for fast2sms provider');
  }

  log.info('[sms:fast2sms] sending message', { to });

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message: body,
      language: 'english',
      flash: 0,
      numbers: to.replace(/^91/, ''),
    }),
  });
  const data = await res.json();
  if (!res.ok || data.return === false) {
    log.error('[sms:fast2sms] API error', { status: res.status, data });
    throw new Error(data.message || `Fast2SMS HTTP ${res.status}`);
  }
  log.info('[sms:fast2sms] message sent', { request_id: data.request_id, to });
  return { id: data.request_id, status: 'submitted' };
};

// ── Main sendSms function ───────────────────────────────────────────────────

/**
 * Send an SMS message via the configured provider.
 *
 * @param {object} opts
 * @param {string} opts.to       - phone number (10-digit, 91xxxxxxxx, or +91xxxxxxxx)
 * @param {string} opts.body     - message text
 * @param {string} [opts.userId]
 * @param {string} [opts.template]
 * @param {string} [opts.orderId]
 * @param {object} [opts.meta]
 * @returns {{ ok: boolean, mock: boolean, id: string, status?: string }}
 */
const sendSms = async (opts) => {
  const {
    to,
    body,
    userId = null,
    template = null,
    orderId = null,
    meta = {},
  } = opts;

  if (!to || !body) throw new Error('to and body are required');

  const phone = normalizePhone(to);
  const currentProvider = provider();
  const mockMode = isMock();

  const baseLog = {
    user_id: userId,
    to_phone: phone,
    body,
    template,
    related_order_id: orderId,
    meta,
  };

  log.info('[sms] sendSms called', {
    to: phone,
    provider: currentProvider,
    mock: mockMode,
    template,
  });

  try {
    if (mockMode) {
      log.info('[sms:mock] SMS not sent — mock mode active', {
        to: phone,
        body,
        template,
        hint: 'Set OTP_EXPOSE_CODE=true in .env to see the OTP code in the API response or configure an SMS provider',
      });
      await logSms({
        ...baseLog,
        status: 'sent',
        provider: 'mock',
        provider_message_id: `mock_sms_${Date.now()}`,
      });
      return { ok: true, mock: true, id: `mock_sms_${Date.now()}` };
    }

    let result;
    if (currentProvider === 'twilio') result = await sendViaTwilio(phone, body);
    else if (currentProvider === 'msg91') result = await sendViaMsg91(phone, body);
    else if (currentProvider === 'fast2sms') result = await sendViaFast2Sms(phone, body);
    else throw new Error(`Unknown SMS_PROVIDER: "${currentProvider}". Must be mock | twilio | msg91 | fast2sms | auto`);

    await logSms({
      ...baseLog,
      status: result.status || 'sent',
      provider: currentProvider,
      provider_message_id: result.id,
    });
    log.info('[sms] message sent successfully', {
      to: phone,
      provider: currentProvider,
      id: result.id,
      status: result.status,
    });
    return { ok: true, mock: false, id: result.id, status: result.status };
  } catch (err) {
    log.error('[sms] send failed', {
      to: phone,
      provider: currentProvider,
      error: err.message,
    });
    await logSms({ ...baseLog, status: 'failed', provider: currentProvider, error: err.message });
    throw err;
  }
};

module.exports = {
  sendSms,
  isMock,
  provider,
  normalizePhone,
  logSms,
};
