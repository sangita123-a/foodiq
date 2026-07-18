/**
 * Email provider layer: mock | smtp (Nodemailer) | resend | sendgrid
 */
const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

const provider = () => String(process.env.EMAIL_PROVIDER || 'mock').toLowerCase();

const isMock = () => {
  const p = provider();
  if (p === 'mock') return true;
  if (p === 'smtp' && !process.env.SMTP_HOST) return true;
  if (p === 'resend' && !process.env.RESEND_API_KEY) return true;
  if (p === 'sendgrid' && !process.env.SENDGRID_API_KEY) return true;
  return false;
};

let transporter = null;

const getSmtpTransport = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
};

const logEmail = async (row) => {
  try {
    await pool.query(
      `INSERT INTO email_logs (
         user_id, to_email, subject, template, status, provider, provider_message_id,
         error, attempts, meta, related_order_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)`,
      [
        row.user_id || null,
        row.to_email,
        row.subject,
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
    console.warn('[email] log failed', err.message);
  }
};

const sendViaResend = async ({ to, subject, html, text, attachments }) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Foodiq <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      text,
      attachments: (attachments || []).map((a) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content)
          ? a.content.toString('base64')
          : a.content,
      })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Resend HTTP ${res.status}`);
  return { id: data.id };
};

const sendViaSendgrid = async ({ to, subject, html, text, attachments }) => {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: process.env.EMAIL_FROM_ADDRESS || 'noreply@foodiq.com',
        name: process.env.EMAIL_FROM_NAME || 'Foodiq',
      },
      subject,
      content: [
        { type: 'text/plain', value: text || subject },
        { type: 'text/html', value: html },
      ],
      attachments: (attachments || []).map((a) => ({
        filename: a.filename,
        type: a.contentType || 'application/pdf',
        content: Buffer.isBuffer(a.content)
          ? a.content.toString('base64')
          : a.content,
        disposition: 'attachment',
      })),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid HTTP ${res.status}: ${body}`);
  }
  return { id: res.headers.get('x-message-id') || null };
};

/**
 * @param {object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 * @param {Array<{filename, content, contentType?}>} [opts.attachments]
 * @param {string} [opts.userId]
 * @param {string} [opts.template]
 * @param {string} [opts.orderId]
 */
const sendEmail = async (opts) => {
  const {
    to,
    subject,
    html,
    text,
    attachments = [],
    userId = null,
    template = null,
    orderId = null,
    meta = {},
  } = opts;

  if (!to || !subject) {
    throw new Error('to and subject are required');
  }

  const baseLog = {
    user_id: userId,
    to_email: to,
    subject,
    template,
    related_order_id: orderId,
    meta,
  };

  try {
    if (isMock()) {
      console.log('[email:mock]', { to, subject, template, attachments: attachments.length });
      await logEmail({ ...baseLog, status: 'sent', provider: 'mock', provider_message_id: `mock_${Date.now()}` });
      return { ok: true, mock: true, id: `mock_${Date.now()}` };
    }

    let result;
    const p = provider();
    if (p === 'resend') {
      result = await sendViaResend({ to, subject, html, text, attachments });
    } else if (p === 'sendgrid') {
      result = await sendViaSendgrid({ to, subject, html, text, attachments });
    } else {
      const info = await getSmtpTransport().sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text: text || subject,
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      result = { id: info.messageId };
    }

    await logEmail({
      ...baseLog,
      status: 'sent',
      provider_message_id: result.id,
    });
    return { ok: true, mock: false, id: result.id };
  } catch (err) {
    console.error('[email] send failed', err.message);
    await logEmail({ ...baseLog, status: 'failed', error: err.message });
    throw err;
  }
};

module.exports = {
  sendEmail,
  isMock,
  provider,
  logEmail,
};
