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
const dns = require('dns');
const net = require('net');
const { promisify } = require('util');
const { pool } = require('../config/db');
const { log } = require('../utils/logger');

// Force Node to prefer IPv4 globally for DNS resolution
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (_) {}
}

const resolve4 = promisify(dns.resolve4);

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
  if (user && (user.includes('gmail.com') || user.includes('googlemail.com'))) {
    return 'smtp.gmail.com';
  }
  return user ? 'smtp.gmail.com' : null;
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
  if (configured && configured !== 'auto') return configured;

  if (getSmtpUser() && getSmtpPass()) return 'smtp';
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (process.env.MAILGUN_API_KEY) return 'mailgun';

  return 'mock';
};

const isMock = () => {
  const currentProvider = provider();
  if (currentProvider === 'smtp') {
    return !getSmtpUser() || !getSmtpPass();
  }
  return currentProvider === 'mock';
};

/**
 * Creates Nodemailer transport resolving IPv4 address first to bypass IPv6 ENETUNREACH issues.
 */
const createSmtpTransport = async (overridePort = null, overrideSecure = null, overrideRequireTLS = null) => {
  let addresses = [];
  try {
    addresses = await dns.promises.resolve4('smtp.gmail.com');
  } catch (err) {
    log.warn('[email:smtp] dns.resolve4("smtp.gmail.com") failed', { error: err.message });
  }

  if (!addresses || addresses.length === 0) {
    const configuredHost = getSmtpHost() || 'smtp.gmail.com';
    if (net.isIPv4(configuredHost)) {
      addresses = [configuredHost];
    } else {
      addresses = ['142.250.102.108', '142.250.102.109', '74.125.130.108', '173.194.76.108'];
    }
  }

  const primaryIp = addresses[0];
  const port = overridePort !== null ? overridePort : getSmtpPort();
  const user = getSmtpUser();
  const pass = getSmtpPass();
  const secure = overrideSecure !== null ? overrideSecure : (port === 465);
  const requireTLS = overrideRequireTLS !== null ? overrideRequireTLS : (port === 587);

  // Task 8: Log:
  // Resolved IPv4:
  // Transport host:
  // Transport port:
  console.log('==================================================');
  console.log('[SMTP CONFIG LOG]');
  console.log(`  Resolved IPv4 : ${primaryIp} (All resolved: ${addresses.join(', ')})`);
  console.log(`  Transport host: ${primaryIp}`);
  console.log(`  Transport port: ${port}`);
  console.log(`  Transport secure: ${secure}`);
  console.log(`  Transport requireTLS: ${requireTLS}`);
  console.log('==================================================');

  log.info('[email:smtp] Creating Nodemailer transport options', {
    resolvedIPv4: primaryIp,
    allResolvedIPv4: addresses,
    transportHost: primaryIp,
    transportPort: port,
    secure,
    requireTLS,
    user: user ? `${user.slice(0, 3)}***` : null,
  });

  // Task 5: Build transporter using host: ipv4 NOT smtp.gmail.com
  // Task 6: tls: { servername: "smtp.gmail.com" }
  // Task 7: Remove every custom lookup that still allows IPv6.
  const buildOptionsForIp = (ipAddr, p = port, s = secure, reqTls = requireTLS) => ({
    host: ipAddr,
    port: p,
    secure: s,
    ...(reqTls ? { requireTLS: true } : {}),
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false,
      servername: 'smtp.gmail.com',
    },
    family: 4, // Disable IPv6 completely
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });

  const transporterOptions = buildOptionsForIp(primaryIp);

  // Task 2: Log the exact transporter options before createTransport()
  console.log('[SMTP TRANSPORTER OPTIONS]:', JSON.stringify({ ...transporterOptions, auth: user ? { user, pass: '***' } : undefined }, null, 2));

  const transporter = nodemailer.createTransport(transporterOptions);

  return {
    transporter,
    hostIp: primaryIp,
    allIps: addresses,
    originalHost: 'smtp.gmail.com',
    port,
    secure,
    requireTLS,
    createForIp: (ip, p = port, s = secure, reqTls = requireTLS) => {
      const opts = buildOptionsForIp(ip, p, s, reqTls);
      console.log(`[SMTP TRANSPORTER OPTIONS for ${ip}:${p}]:`, JSON.stringify({ ...opts, auth: user ? { user, pass: '***' } : undefined }, null, 2));
      return nodemailer.createTransport(opts);
    },
  };
};

const getSmtpTransport = async (overridePort = null, overrideSecure = null, overrideRequireTLS = null) => {
  const { transporter } = await createSmtpTransport(overridePort, overrideSecure, overrideRequireTLS);
  return transporter;
};

/**
 * Standalone verification helper for SMTP and API email providers.
 */
const verifySmtp = async () => {
  const currentProvider = provider();
  const from = getFromAddress();

  console.log('==================================================');
  console.log('[OUTBOUND NETWORK DIAGNOSTIC] Testing Gmail SMTP connectivity...');
  try {
    const addresses = await dns.promises.resolve4('smtp.gmail.com').catch(() => []);
    const resolvedIp = addresses[0] || '142.250.102.108';
    console.log(`  Resolved Gmail SMTP IPv4: ${resolvedIp} (All: ${addresses.join(', ') || 'none'})`);

    for (const port of [465, 587]) {
      const probeRes = await new Promise((resolve) => {
        const start = Date.now();
        const socket = net.createConnection({ host: resolvedIp, port, timeout: 3000 }, () => {
          socket.end();
          resolve(`CONNECTED in ${Date.now() - start}ms`);
        });
        socket.on('error', (err) => resolve(`FAILED (${err.message})`));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(`TIMEOUT (3000ms)`);
        });
      });
      console.log(`  TCP Probe ${resolvedIp}:${port} => ${probeRes}`);
    }
  } catch (probeErr) {
    console.warn(`  Outbound probe error: ${probeErr.message}`);
  }
  console.log('==================================================');

  console.log('==================================================');
  console.log('[EMAIL SERVICE DIAGNOSTIC] Running verification...');
  console.log(`  EMAIL_PROVIDER setting : ${process.env.EMAIL_PROVIDER || 'auto'}`);
  console.log(`  Resolved Provider      : ${currentProvider}`);
  console.log(`  EMAIL_FROM             : ${from}`);
  console.log('==================================================');

  if (currentProvider === 'resend') {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      const err = new Error('Resend provider selected but RESEND_API_KEY is missing.');
      err.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
      throw err;
    }
    console.log('✅ [EMAIL SERVICE DIAGNOSTIC] Resend API provider configured and ready!');
    return {
      ok: true,
      provider: 'resend',
      user: from,
      from,
      verify_result: 'Resend API Key Configured',
    };
  }

  if (currentProvider === 'sendgrid') {
    const key = process.env.SENDGRID_API_KEY;
    if (!key) {
      const err = new Error('SendGrid provider selected but SENDGRID_API_KEY is missing.');
      err.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
      throw err;
    }
    console.log('✅ [EMAIL SERVICE DIAGNOSTIC] SendGrid API provider configured and ready!');
    return {
      ok: true,
      provider: 'sendgrid',
      user: from,
      from,
      verify_result: 'SendGrid API Key Configured',
    };
  }

  if (currentProvider === 'mailgun') {
    const key = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    if (!key || !domain) {
      const err = new Error('Mailgun provider selected but MAILGUN_API_KEY or MAILGUN_DOMAIN is missing.');
      err.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
      throw err;
    }
    console.log('✅ [EMAIL SERVICE DIAGNOSTIC] Mailgun API provider configured and ready!');
    return {
      ok: true,
      provider: 'mailgun',
      user: from,
      from,
      verify_result: 'Mailgun API Configured',
    };
  }

  if (currentProvider === 'mock') {
    const err = new Error('Email service not configured. Set EMAIL_PROVIDER (resend, sendgrid, mailgun, smtp) and required environment variables in Render dashboard.');
    err.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
    throw err;
  }

  // SMTP Verification
  const host = getSmtpHost() || 'smtp.gmail.com';
  const port = getSmtpPort();
  const user = getSmtpUser();
  const pass = getSmtpPass();
  const secure = getSmtpSecure();

  console.log(`  SMTP_HOST      : ${host}`);
  console.log(`  SMTP_PORT      : ${port}`);
  console.log(`  SMTP_SECURE    : ${secure}`);
  console.log(`  EMAIL_USER     : ${user || '(NOT SET)'}`);
  console.log(`  EMAIL_PASSWORD : ${pass ? '******** (Length: ' + pass.length + ')' : '(NOT SET)'}`);

  if (!user || !pass) {
    const missing = [];
    if (!user) missing.push('SMTP_USER/EMAIL_USER');
    if (!pass) missing.push('SMTP_PASS/EMAIL_PASSWORD');
    const msg = `SMTP configuration incomplete. Missing required environment variables: ${missing.join(', ')}`;
    console.error(`❌ [SMTP DIAGNOSTIC] FAILED: ${msg}`);
    const err = new Error(msg);
    err.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
    err.missing = missing;
    throw err;
  }

  const primary = await createSmtpTransport();
  const ipsToTry = primary.allIps && primary.allIps.length > 0 ? primary.allIps : [primary.hostIp];
  let lastErr = null;

  // Step 1: Try Port 465 (or default configured port) across all resolved IPv4 addresses
  for (const targetIp of ipsToTry) {
    console.log(`[SMTP DIAGNOSTIC] Testing connection to IPv4 host: ${targetIp}, port: ${primary.port}, secure: ${primary.secure}...`);
    const t = primary.createForIp(targetIp, primary.port, primary.secure, primary.requireTLS);
    try {
      const verified = await t.verify();
      console.log(`✅ [SMTP DIAGNOSTIC] Primary transporter.verify() SUCCESSFUL on IPv4 ${targetIp}:${primary.port}!`, verified);
      return {
        ok: true,
        provider: 'smtp',
        resolvedIPv4: targetIp,
        host: targetIp,
        originalHost: primary.originalHost,
        ipUsed: targetIp,
        port: primary.port,
        secure: primary.secure,
        requireTLS: primary.requireTLS || false,
        user,
        from,
        verify_result: verified,
      };
    } catch (err) {
      console.warn(`⚠️ [SMTP DIAGNOSTIC] Connection to IPv4 ${targetIp}:${primary.port} failed: ${err.message} (${err.code || 'NO_CODE'})`);
      lastErr = err;
    }
  }

  // Step 2: Try Port 587 (secure: false, requireTLS: true) across all resolved IPv4 addresses
  console.log('🔄 [SMTP DIAGNOSTIC] Retrying all resolved IPv4 addresses on Port 587 (secure: false, requireTLS: true)...');
  for (const targetIp of ipsToTry) {
    console.log(`[SMTP DIAGNOSTIC] Testing connection to IPv4 host: ${targetIp}, port: 587 (secure: false, requireTLS: true)...`);
    const tAlt = primary.createForIp(targetIp, 587, false, true);
    try {
      const fallbackVerified = await tAlt.verify();
      console.log(`✅ [SMTP DIAGNOSTIC] Fallback port 587 transporter.verify() SUCCESSFUL on IPv4 ${targetIp}:587!`, fallbackVerified);
      return {
        ok: true,
        provider: 'smtp',
        resolvedIPv4: targetIp,
        host: targetIp,
        originalHost: primary.originalHost,
        ipUsed: targetIp,
        port: 587,
        secure: false,
        requireTLS: true,
        user,
        from,
        verify_result: fallbackVerified,
      };
    } catch (err) {
      console.warn(`⚠️ [SMTP DIAGNOSTIC] Connection to IPv4 ${targetIp}:587 failed: ${err.message} (${err.code || 'NO_CODE'})`);
      lastErr = err;
    }
  }

  console.error('❌ [SMTP DIAGNOSTIC] transporter.verify() FAILED on all IPv4 addresses!');
  const enhancedErr = new Error(`SMTP Verification failed on all IPv4 addresses (${ipsToTry.join(', ')}): ${lastErr?.message}. (Outbound network port 465/587 blocked by cloud host. Switch EMAIL_PROVIDER to resend, sendgrid, or mailgun).`);
  enhancedErr.code = lastErr?.code || 'SMTP_VERIFICATION_FAILED';
  enhancedErr.command = lastErr?.command || null;
  enhancedErr.response = lastErr?.response || null;
  enhancedErr.stack = lastErr?.stack;
  enhancedErr.resolvedIPv4 = ipsToTry[0];
  enhancedErr.host = ipsToTry[0];
  enhancedErr.originalHost = primary.originalHost;
  enhancedErr.ipUsed = ipsToTry[0];
  enhancedErr.port = 587;
  enhancedErr.secure = false;
  enhancedErr.user = user;
  throw enhancedErr;
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
  log.info('[email:resend] Provider request', { provider: 'resend', recipient: to, subject, from });

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
    log.error('[email:resend] Provider response: FAILED', {
      provider: 'resend',
      recipient: to,
      status: res.status,
      providerResponse: data,
    });
    throw new Error(data.message || `Resend HTTP ${res.status}`);
  }
  log.info('[email:resend] Provider response: OK', {
    provider: 'resend',
    recipient: to,
    messageId: data.id,
    providerResponse: data,
  });
  return { id: data.id };
};

const sendViaSendgrid = async ({ to, subject, html, text, attachments }) => {
  const from = getFromAddress();
  log.info('[email:sendgrid] Provider request', { provider: 'sendgrid', recipient: to, subject, from });

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
    log.error('[email:sendgrid] Provider response: FAILED', {
      provider: 'sendgrid',
      recipient: to,
      status: res.status,
      providerResponse: body,
    });
    throw new Error(`SendGrid HTTP ${res.status}: ${body}`);
  }
  const msgId = res.headers.get('x-message-id') || `sendgrid_${Date.now()}`;
  log.info('[email:sendgrid] Provider response: OK', {
    provider: 'sendgrid',
    recipient: to,
    messageId: msgId,
    status: res.status,
  });
  return { id: msgId };
};

const sendViaMailgun = async ({ to, subject, html, text, attachments }) => {
  const from = getFromAddress();
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_API_KEY;

  if (!domain || !apiKey) {
    throw new Error('Mailgun credentials incomplete. MAILGUN_DOMAIN and MAILGUN_API_KEY environment variables are required.');
  }

  log.info('[email:mailgun] Provider request', { provider: 'mailgun', recipient: to, subject, from, domain });

  const formData = new URLSearchParams();
  formData.append('from', from);
  formData.append('to', to);
  formData.append('subject', subject);
  if (html) formData.append('html', html);
  if (text) formData.append('text', text || subject);

  const authHeader = 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64');
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    log.error('[email:mailgun] Provider response: FAILED', {
      provider: 'mailgun',
      recipient: to,
      status: res.status,
      providerResponse: data,
    });
    throw new Error(data.message || `Mailgun HTTP ${res.status}`);
  }
  const msgId = data.id || `mailgun_${Date.now()}`;
  log.info('[email:mailgun] Provider response: OK', {
    provider: 'mailgun',
    recipient: to,
    messageId: msgId,
    providerResponse: data,
  });
  return { id: msgId };
};

/**
 * Send an email message via configured provider (SMTP / Resend / SendGrid / Mailgun / Mock).
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
      if (process.env.NODE_ENV === 'production') {
        const err = new Error(`Email service not configured for provider '${currentProvider}'. Please set required environment variables in Render dashboard.`);
        err.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
        log.error('[email] Delivery failed: Email service not configured', {
          to,
          subject,
          template,
          provider: currentProvider,
        });
        void logEmail({
          ...baseLog,
          status: 'failed',
          provider: 'none',
          error: err.message,
        });
        throw err;
      }

      console.log('==================================================');
      console.log('[MOCK EMAIL DELIVERY]');
      console.log(`  To      : ${to}`);
      console.log(`  Subject : ${subject}`);
      console.log(`  Text    : ${text || subject}`);
      console.log('==================================================');
      log.info('[email:mock] Mock email dispatched in development', { to, subject });
      await logEmail({
        ...baseLog,
        status: 'sent',
        provider: 'mock',
        provider_message_id: `mock_${Date.now()}`,
      });
      return { ok: true, mock: true, id: `mock_${Date.now()}` };
    }

    let result;
    if (currentProvider === 'resend') {
      result = await sendViaResend({ to, subject, html, text, attachments });
    } else if (currentProvider === 'sendgrid') {
      result = await sendViaSendgrid({ to, subject, html, text, attachments });
    } else if (currentProvider === 'mailgun') {
      result = await sendViaMailgun({ to, subject, html, text, attachments });
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

      const doSendOnIp = async (targetIp, overridePort = null, overrideSecure = null, overrideRequireTLS = null) => {
        const targetPort = overridePort !== null ? overridePort : port;
        const targetSecure = overrideSecure !== null ? overrideSecure : (targetPort === 465);
        const targetRequireTLS = overrideRequireTLS !== null ? overrideRequireTLS : (targetPort === 587);

        log.info('[email:smtp] SMTP connection attempt', {
          provider: 'smtp',
          recipient: to,
          host: targetIp,
          port: targetPort,
          secure: targetSecure,
          authUser: `${user.slice(0, 3)}***`,
        });

        const transport = nodemailer.createTransport({
          host: targetIp,
          port: targetPort,
          secure: targetSecure,
          ...(targetRequireTLS ? { requireTLS: true } : {}),
          auth: user && pass ? { user, pass } : undefined,
          tls: {
            rejectUnauthorized: false,
            servername: 'smtp.gmail.com',
          },
          family: 4,
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
        });

        const sendPromise = transport.sendMail({
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
            const tErr = new Error(`Connection timeout (ETIMEDOUT) after 8000ms while connecting to ${targetIp}:${targetPort}`);
            tErr.code = 'ETIMEDOUT';
            reject(tErr);
          }, 8000);
        });

        return await Promise.race([sendPromise, timeoutPromise]);
      };

      try {
        const primaryMeta = await createSmtpTransport();
        const ipsToTry = primaryMeta.allIps && primaryMeta.allIps.length > 0 ? primaryMeta.allIps : [primaryMeta.hostIp];
        let info = null;
        let lastSmtpErr = null;

        // Try primary port (465) across IPv4 addresses
        for (const targetIp of ipsToTry) {
          try {
            info = await doSendOnIp(targetIp);
            if (info) break;
          } catch (err) {
            lastSmtpErr = err;
          }
        }

        // If primary port failed on all IPv4 addresses, try port 587 across IPv4 addresses
        if (!info) {
          log.info('[email:smtp] Primary port send failed across IPv4 addresses. Retrying over port 587 (secure: false, requireTLS: true)...');
          for (const targetIp of ipsToTry) {
            try {
              info = await doSendOnIp(targetIp, 587, false, true);
              if (info) break;
            } catch (err) {
              lastSmtpErr = err;
            }
          }
        }

        if (!info) {
          throw lastSmtpErr || new Error('SMTP email delivery failed across all resolved IPv4 addresses.');
        }

        log.info('[email:smtp] Authentication succeeded, provider response: OK', {
          provider: 'smtp',
          recipient: to,
          messageId: info.messageId,
          providerResponse: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
        });
        result = { id: info.messageId };
      } catch (smtpErr) {
        log.error('[email:smtp] Provider response: FAILED', {
          provider: 'smtp',
          recipient: to,
          code: smtpErr.code || null,
          command: smtpErr.command || null,
          providerResponse: smtpErr.response || null,
          responseCode: smtpErr.responseCode || null,
          message: smtpErr.message,
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
  createSmtpTransport,
  isMock,
  provider,
  logEmail,
};
