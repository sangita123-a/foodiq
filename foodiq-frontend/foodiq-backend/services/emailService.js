/**
 * Email provider layer: mock | smtp (Nodemailer) | resend | sendgrid | auto
 *
 * Automatically detects configured credentials or uses EMAIL_PROVIDER setting.
 * Supports environment variables and aliases:
 * - SMTP: SMTP_HOST/EMAIL_HOST, SMTP_PORT/EMAIL_PORT, SMTP_USER/EMAIL_USER, SMTP_PASS/EMAIL_PASS, SMTP_SECURE
 * - Resend: RESEND_API_KEY, EMAIL_FROM
 * - SendGrid: SENDGRID_API_KEY, EMAIL_FROM_ADDRESS
 */
const nodemailer = require('nodemailer');
const { pool } = require('../config/db');
const { log } = require('../utils/logger');

// Environment variable resolution with aliases
const getSmtpHost = () => process.env.SMTP_HOST || process.env.EMAIL_HOST;
const getSmtpPort = () => Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
const getSmtpUser = () => process.env.SMTP_USER || process.env.EMAIL_USER;
const getSmtpPass = () => process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
const getSmtpSecure = () =>
  String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || getSmtpPort() === 465;
const getFromAddress = () =>
  process.env.EMAIL_FROM ||
  process.env.EMAIL_FROM_ADDRESS ||
  getSmtpUser() ||
  'Foodiq <noreply@foodiq.com>';

/**
 * Detect provider from process.env or auto-detect based on present keys
 */
const provider = () => {
  const configured = String(process.env.EMAIL_PROVIDER || '').toLowerCase().trim();

  // If SMTP or service keys exist and EMAIL_PROVIDER is auto, empty, or default mock, auto-upgrade
  if (!configured || configured === 'auto' || configured === 'mock') {
    if (getSmtpHost() || getSmtpUser()) return 'smtp';
    if (process.env.RESEND_API_KEY) return 'resend';
    if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  }

  if (configured && configured !== 'auto') return configured;

  return 'mock';
};

const isMock = () => {
  const p = provider();
  if (p === 'mock') return true;

  if (p === 'smtp' && !getSmtpHost()) {
    log.warn('[email] EMAIL_PROVIDER=smtp but SMTP_HOST/EMAIL_HOST is missing — falling back to mock');
    return true;
  }
  if (p === 'resend' && !process.env.RESEND_API_KEY) {
    log.warn('[email] EMAIL_PROVIDER=resend but RESEND_API_KEY is missing — falling back to mock');
    return true;
  }
  if (p === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
    log.warn('[email] EMAIL_PROVIDER=sendgrid but SENDGRID_API_KEY is missing — falling back to mock');
    return true;
  }
  return false;
};

let transporter = null;

const getSmtpTransport = () => {
  if (transporter) return transporter;
  const host = getSmtpHost();
  const port = getSmtpPort();
  const user = getSmtpUser();
  const pass = getSmtpPass();
  const secure = getSmtpSecure();

  log.info('[email:smtp] creating nodemailer transport', {
    host,
    port,
    secure,
    user: user ? `${user.slice(0, 3)}***` : null,
  });

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: false }, // Prevent self-signed cert errors in cloud
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
    log.warn('[email] DB log failed (email_logs)', { error: err.message });
  }
};

const sendViaResend = async ({ to, subject, html, text, attachments }) => {
  const from = getFromAddress();
  log.info('[email:resend] sending email', { to, subject, from });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
      attachments: (attachments || []).map((a) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
      })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    log.error('[email:resend] API error', { status: res.status, data });
    throw new Error(data.message || `Resend HTTP ${res.status}`);
  }
  log.info('[email:resend] message sent', { id: data.id, to });
  return { id: data.id };
};

const sendViaSendgrid = async ({ to, subject, html, text, attachments }) => {
  const from = getFromAddress();
  log.info('[email:sendgrid] sending email', { to, subject, from });

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: process.env.EMAIL_FROM_ADDRESS || getSmtpUser() || 'noreply@foodiq.com',
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
        content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
        disposition: 'attachment',
      })),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    log.error('[email:sendgrid] API error', { status: res.status, body });
    throw new Error(`SendGrid HTTP ${res.status}: ${body}`);
  }
  const msgId = res.headers.get('x-message-id') || `sendgrid_${Date.now()}`;
  log.info('[email:sendgrid] message sent', { id: msgId, to });
  return { id: msgId };
};

/**
 * Send an email message via configured provider (SMTP / Resend / SendGrid / Mock).
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

  const currentProvider = provider();
  const mockMode = isMock();

  const baseLog = {
    user_id: userId,
    to_email: to,
    subject,
    template,
    related_order_id: orderId,
    meta,
  };

  log.info('[email] sendEmail called', {
    to,
    subject,
    provider: currentProvider,
    mock: mockMode,
    template,
  });

  try {
    if (mockMode) {
      log.info('[email:mock] Email not sent — mock mode active', {
        to,
        subject,
        template,
        hint: 'Configure SMTP_HOST/SMTP_USER/SMTP_PASS, RESEND_API_KEY, or SENDGRID_API_KEY in .env',
      });
      await logEmail({
        ...baseLog,
        status: 'sent',
        provider: 'mock',
        provider_message_id: `mock_email_${Date.now()}`,
      });
      return { ok: true, mock: true, id: `mock_email_${Date.now()}` };
    }

    let result;
    if (currentProvider === 'resend') {
      result = await sendViaResend({ to, subject, html, text, attachments });
    } else if (currentProvider === 'sendgrid') {
      result = await sendViaSendgrid({ to, subject, html, text, attachments });
    } else {
      const from = getFromAddress();
      log.info('[email:smtp] sending mail via Nodemailer SMTP', { to, subject, from });
      const info = await getSmtpTransport().sendMail({
        from,
        to,
        subject,
        html,
        text: text || subject,
        attachments: (attachments || []).map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      log.info('[email:smtp] mail sent successfully', { messageId: info.messageId, to });
      result = { id: info.messageId };
    }

    await logEmail({
      ...baseLog,
      status: 'sent',
      provider: currentProvider,
      provider_message_id: result.id,
    });
    return { ok: true, mock: false, id: result.id };
  } catch (err) {
    log.error('[email] send failed', {
      to,
      provider: currentProvider,
      error: err.message,
    });
    await logEmail({ ...baseLog, status: 'failed', provider: currentProvider, error: err.message });
    throw err;
  }
};

module.exports = {
  sendEmail,
  isMock,
  provider,
  logEmail,
};
