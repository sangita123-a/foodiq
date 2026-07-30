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

// Environment variable resolution with aliases & Gmail defaults
const getSmtpUser = () => (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();

const getSmtpPass = () => {
  const raw = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || '';
  // Gmail App Passwords are 16 characters (strip spaces if user included them)
  return raw.trim().replace(/\s+/g, '');
};

const getSmtpHost = () => {
  if (process.env.SMTP_HOST) return process.env.SMTP_HOST.trim();
  if (process.env.EMAIL_HOST) return process.env.EMAIL_HOST.trim();
  const user = getSmtpUser();
  if (user.includes('gmail.com') || user.includes('googlemail.com')) {
    return 'smtp.gmail.com';
  }
  return undefined;
};

const getSmtpPort = () => {
  if (process.env.SMTP_PORT) return Number(process.env.SMTP_PORT);
  if (process.env.EMAIL_PORT) return Number(process.env.EMAIL_PORT);
  const host = getSmtpHost();
  if (host === 'smtp.gmail.com') return 465;
  return 587;
};

const getSmtpSecure = () => {
  if (process.env.SMTP_SECURE !== undefined) {
    return String(process.env.SMTP_SECURE).toLowerCase() === 'true';
  }
  return getSmtpPort() === 465;
};

const getFromAddress = () => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS;
  if (from && from.trim()) return from.trim();
  const user = getSmtpUser();
  if (user) return `Foodiq <${user}>`;
  return 'Foodiq <noreply@foodiq.com>';
};

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
  return false;
};

let transporter = null;

const createSmtpTransport = () => {
  const host = getSmtpHost();
  const port = getSmtpPort();
  const user = getSmtpUser();
  const pass = getSmtpPass();
  const secure = getSmtpSecure();

  log.info('[email:smtp] Creating Nodemailer transport', {
    host,
    port,
    secure,
    user: user ? `${user.slice(0, 3)}***` : null,
    passLength: pass ? pass.length : 0,
  });

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: false },
    family: 4, // Force IPv4 to prevent IPv6 socket timeout on cloud hosts
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 12000,
  });
};

const getSmtpTransport = () => {
  return createSmtpTransport();
};

/**
 * Standalone SMTP verification helper using transporter.verify()
 */
const verifySmtp = async () => {
  const host = getSmtpHost();
  const port = getSmtpPort();
  const user = getSmtpUser();
  const pass = getSmtpPass();
  const secure = getSmtpSecure();
  const from = getFromAddress();
  const currentProvider = provider();

  console.log('==================================================');
  console.log('[SMTP DIAGNOSTIC] Running transporter.verify()...');
  console.log(`  EMAIL_PROVIDER : ${process.env.EMAIL_PROVIDER || 'auto'} (Resolved: ${currentProvider})`);
  console.log(`  SMTP_HOST      : ${host || '(NOT SET)'}`);
  console.log(`  SMTP_PORT      : ${port}`);
  console.log(`  SMTP_SECURE    : ${secure}`);
  console.log(`  EMAIL_USER     : ${user || '(NOT SET)'}`);
  console.log(`  EMAIL_PASSWORD : ${pass ? '******** (Length: ' + pass.length + ')' : '(NOT SET)'}`);
  console.log(`  EMAIL_FROM     : ${from}`);
  console.log('==================================================');

  if (!host || !user || !pass) {
    const missing = [];
    if (!host) missing.push('SMTP_HOST/EMAIL_HOST');
    if (!user) missing.push('SMTP_USER/EMAIL_USER');
    if (!pass) missing.push('SMTP_PASS/EMAIL_PASSWORD');
    const msg = `SMTP configuration incomplete. Missing required environment variables: ${missing.join(', ')}`;
    console.error(`❌ [SMTP DIAGNOSTIC] FAILED: ${msg}`);
    const err = new Error(msg);
    err.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
    err.missing = missing;
    throw err;
  }

  const t = createSmtpTransport();

  try {
    const verified = await t.verify();
    console.log('✅ [SMTP DIAGNOSTIC] transporter.verify() SUCCESSFUL!', verified);
    return { ok: true, provider: currentProvider, host, port, secure, user, from, verify_result: verified };
  } catch (err) {
    console.error('❌ [SMTP DIAGNOSTIC] transporter.verify() FAILED!');
    console.error('  Error Code    :', err.code || null);
    console.error('  Error Command :', err.command || null);
    console.error('  Error Response:', err.response || null);
    console.error('  Error Message :', err.message);
    console.error('  Full Error    :', err);

    if (err.message.includes('Invalid login') || err.code === 'EAUTH' || (err.response && err.response.includes('535'))) {
      console.error('\n💡 Gmail Authentication Help:');
      console.error('   1. Ensure 2-Step Verification is ENABLED on your Google Account.');
      console.error('   2. Generate a 16-character App Password at: https://myaccount.google.com/apppasswords');
      console.error('   3. Set EMAIL_USER=<your-gmail> and EMAIL_PASSWORD=<16-char-app-password> in Render environment variables.');
    }
    const enhancedErr = new Error(err.message);
    enhancedErr.code = err.code || 'SMTP_VERIFICATION_FAILED';
    enhancedErr.command = err.command || null;
    enhancedErr.response = err.response || null;
    enhancedErr.stack = err.stack;
    enhancedErr.host = host;
    enhancedErr.port = port;
    enhancedErr.secure = secure;
    enhancedErr.user = user;
    throw enhancedErr;
  }
};

const logEmail = async (row) => {
  try {
    if (!row || !row.to_email) return;
    await pool.query(
      `INSERT INTO email_logs (
         user_id, to_email, subject, template, status, provider, provider_message_id,
         error, attempts, meta, related_order_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)`,
      [
        row.user_id || null,
        row.to_email,
        row.subject || '',
        row.template || null,
        row.status || 'unknown',
        row.provider || 'none',
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
      const err = new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD (Gmail App Password) in Render environment variables.');
      err.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
      log.error('[email] Delivery failed: Email service not configured (missing EMAIL_USER or EMAIL_PASSWORD)', {
        to,
        subject,
        template,
      });
      void logEmail({
        ...baseLog,
        status: 'failed',
        provider: 'none',
        error: err.message,
      });
      throw err;
    }

    let result;
    if (currentProvider === 'resend') {
      result = await sendViaResend({ to, subject, html, text, attachments });
    } else if (currentProvider === 'sendgrid') {
      result = await sendViaSendgrid({ to, subject, html, text, attachments });
    } else {
      const from = getFromAddress();
      const host = getSmtpHost();
      const port = getSmtpPort();
      const user = getSmtpUser();
      const pass = getSmtpPass();

      if (!user || !pass) {
        const missing = [];
        if (!user) missing.push('EMAIL_USER');
        if (!pass) missing.push('EMAIL_PASSWORD');
        const err = new Error(`Email service not configured. Missing required env vars: ${missing.join(', ')}. Set EMAIL_USER and EMAIL_PASSWORD in Render dashboard.`);
        err.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
        console.error('❌ [email:smtp] Delivery failed:', err.message);
        throw err;
      }

      log.info('[email:smtp] Attempting SMTP email delivery...', {
        to,
        subject,
        from,
        host,
        port,
        user: `${user.slice(0, 3)}***`,
      });

      try {
        const sendPromise = getSmtpTransport().sendMail({
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

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            const tErr = new Error(`Connection timeout (ETIMEDOUT) after 15000ms while connecting to ${host}:${port}`);
            tErr.code = 'ETIMEDOUT';
            reject(tErr);
          }, 15000);
        });

        const info = await Promise.race([sendPromise, timeoutPromise]);

        log.info('[email:smtp] SMTP mail sent successfully', { messageId: info.messageId, to });
        console.log(`✅ [email:smtp] Mail delivered successfully to ${to}. MessageId: ${info.messageId}`);
        result = { id: info.messageId };
      } catch (smtpErr) {
        console.error('❌ [email:smtp] Nodemailer sendMail ERROR:', {
          code: smtpErr.code || null,
          command: smtpErr.command || null,
          response: smtpErr.response || null,
          responseCode: smtpErr.responseCode || null,
          message: smtpErr.message,
          stack: smtpErr.stack,
        });

        const detailMsg = smtpErr.response
          ? `${smtpErr.message} (${smtpErr.response})`
          : smtpErr.message;
        const errToThrow = new Error(detailMsg);
        errToThrow.code = smtpErr.code || 'SMTP_ERROR';
        errToThrow.response = smtpErr.response;
        throw errToThrow;
      }
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
      code: err.code || null,
    });
    logEmail({ ...baseLog, status: 'failed', provider: currentProvider, error: err.message }).catch(() => {});
    throw err;
  }
};

module.exports = {
  sendEmail,
  verifySmtp,
  isMock,
  provider,
  logEmail,
};
