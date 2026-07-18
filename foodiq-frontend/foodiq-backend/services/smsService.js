/**
 * SMS provider layer: mock | twilio | msg91 | fast2sms
 */
const { pool } = require('../config/db');

const provider = () => String(process.env.SMS_PROVIDER || 'mock').toLowerCase();

const isMock = () => {
  const p = provider();
  if (p === 'mock') return true;
  if (p === 'twilio' && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN)) {
    return true;
  }
  if (p === 'msg91' && !process.env.MSG91_AUTH_KEY) return true;
  if (p === 'fast2sms' && !process.env.FAST2SMS_API_KEY) return true;
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
    console.warn('[sms] log failed', err.message);
  }
};

const sendViaTwilio = async (to, body) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({
    To: to.startsWith('+') ? to : `+${to}`,
    From: from,
    Body: body,
  });
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
  if (!res.ok) throw new Error(data.message || `Twilio HTTP ${res.status}`);
  return { id: data.sid, status: data.status };
};

const sendViaMsg91 = async (to, body) => {
  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      authkey: process.env.MSG91_AUTH_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      short_url: '0',
      recipients: [{ mobiles: to, VAR1: body }],
      // Fallback simple SMS when flow template not set
      ...(process.env.MSG91_TEMPLATE_ID
        ? {}
        : { route: '4', sender: process.env.MSG91_SENDER_ID || 'FOODIQ', message: body }),
    }),
  });
  // Also support legacy sendhttp
  if (!process.env.MSG91_TEMPLATE_ID) {
    const legacy = await fetch(
      `https://api.msg91.com/api/sendhttp.php?authkey=${encodeURIComponent(
        process.env.MSG91_AUTH_KEY
      )}&mobiles=${encodeURIComponent(to)}&message=${encodeURIComponent(
        body
      )}&sender=${encodeURIComponent(
        process.env.MSG91_SENDER_ID || 'FOODIQ'
      )}&route=4&country=91`
    );
    const text = await legacy.text();
    return { id: text, status: 'submitted' };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `MSG91 HTTP ${res.status}`);
  return { id: data.request_id || data.type, status: 'submitted' };
};

const sendViaFast2Sms = async (to, body) => {
  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
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
    throw new Error(data.message || `Fast2SMS HTTP ${res.status}`);
  }
  return { id: data.request_id, status: 'submitted' };
};

/**
 * @param {object} opts
 * @param {string} opts.to phone
 * @param {string} opts.body
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
  const baseLog = {
    user_id: userId,
    to_phone: phone,
    body,
    template,
    related_order_id: orderId,
    meta,
  };

  try {
    if (isMock()) {
      console.log('[sms:mock]', { to: phone, body, template });
      await logSms({
        ...baseLog,
        status: 'sent',
        provider: 'mock',
        provider_message_id: `mock_sms_${Date.now()}`,
      });
      return { ok: true, mock: true, id: `mock_sms_${Date.now()}` };
    }

    let result;
    const p = provider();
    if (p === 'twilio') result = await sendViaTwilio(phone, body);
    else if (p === 'msg91') result = await sendViaMsg91(phone, body);
    else if (p === 'fast2sms') result = await sendViaFast2Sms(phone, body);
    else throw new Error(`Unknown SMS provider: ${p}`);

    await logSms({
      ...baseLog,
      status: result.status || 'sent',
      provider_message_id: result.id,
    });
    return { ok: true, mock: false, id: result.id, status: result.status };
  } catch (err) {
    console.error('[sms] send failed', err.message);
    await logSms({ ...baseLog, status: 'failed', error: err.message });
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
