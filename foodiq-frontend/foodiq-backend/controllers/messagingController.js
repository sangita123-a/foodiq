/**
 * Messaging APIs: send email/SMS, OTP, preferences, invoice PDF, report triggers.
 */
const { pool } = require('../config/db');
const { sendEmail } = require('../services/emailService');
const { sendSms } = require('../services/smsService');
const { templates } = require('../services/emailTemplates');
const { issueOtp, verifyOtp } = require('../services/otpService');
const { buildInvoicePdfBuffer } = require('../services/invoiceService');
const { dispatchEmailSms } = require('../services/commsService');
const {
  sendDailyPlatformReport,
  sendRestaurantDailySales,
  sendRestaurantWeeklySales,
  sendDeliveryWeeklyEarnings,
  sendDeliveryMonthlyEarnings,
} = require('../services/reportEmailService');

const ok = (res, message, data = {}) =>
  res.json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({
    success: false,
    message,
    error: typeof error === 'string' ? { detail: error } : error,
  });

/** POST /api/messaging/email — admin or self */
const postSendEmail = async (req, res) => {
  try {
    const { to, subject, html, text, template, user_id, order_id, meta } = req.body;
    const isAdmin = req.user.role === 'admin';

    let recipient = to;
    let userId = user_id || null;

    if (!recipient && user_id) {
      const u = await pool.query('SELECT email FROM users WHERE id = $1', [user_id]);
      recipient = u.rows[0]?.email;
    }
    if (!recipient && !isAdmin) {
      recipient = req.user.email;
      userId = req.user.id;
    }
    if (!recipient) return fail(res, 400, 'Recipient email (to) is required');

    if (!isAdmin && recipient !== req.user.email) {
      return fail(res, 403, 'You can only send test emails to yourself');
    }

    let subjectFinal = subject;
    let htmlFinal = html;
    let textFinal = text;

    if (template && templates[template]) {
      const tpl = templates[template](meta || {});
      subjectFinal = subjectFinal || tpl.subject;
      htmlFinal = htmlFinal || tpl.html;
      textFinal = textFinal || tpl.text;
    }

    if (!subjectFinal || !htmlFinal) {
      return fail(res, 400, 'subject and html (or a valid template) are required');
    }

    const result = await sendEmail({
      to: recipient,
      subject: subjectFinal,
      html: htmlFinal,
      text: textFinal,
      userId,
      template: template || 'manual',
      orderId: order_id || null,
      meta: meta || {},
    });

    return ok(res, 'Email queued/sent', result);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to send email');
  }
};

/** POST /api/messaging/sms */
const postSendSms = async (req, res) => {
  try {
    const { to, body, user_id, order_id, template, meta } = req.body;
    const isAdmin = req.user.role === 'admin';

    let phone = to;
    let userId = user_id || null;

    if (!phone && user_id) {
      const u = await pool.query('SELECT phone_number FROM users WHERE id = $1', [user_id]);
      phone = u.rows[0]?.phone_number;
    }
    if (!phone && !isAdmin) {
      phone = req.user.phone_number;
      userId = req.user.id;
    }
    if (!phone || !body) return fail(res, 400, 'to (phone) and body are required');

    if (!isAdmin && phone !== req.user.phone_number) {
      return fail(res, 403, 'You can only send test SMS to your own number');
    }

    const result = await sendSms({
      to: phone,
      body,
      userId,
      template: template || 'manual',
      orderId: order_id || null,
      meta: meta || {},
    });
    return ok(res, 'SMS queued/sent', result);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to send SMS');
  }
};

/** POST /api/messaging/otp/send */
const postSendOtp = async (req, res) => {
  try {
    const destination =
      req.body.destination ||
      req.body.email ||
      req.body.phone ||
      req.user?.email;
    const channel = req.body.channel || (String(destination).includes('@') ? 'email' : 'sms');
    const purpose = req.body.purpose || 'verification';

    const result = await issueOtp({
      userId: req.user?.id || null,
      destination,
      channel,
      purpose,
      name: req.user?.full_name || req.body.name || null,
    });
    return ok(res, 'OTP sent', result);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to send OTP');
  }
};

/** POST /api/messaging/otp/verify */
const postVerifyOtp = async (req, res) => {
  try {
    const destination = req.body.destination || req.body.email || req.body.phone;
    const purpose = req.body.purpose || 'verification';
    const code = req.body.code || req.body.otp;
    const result = await verifyOtp({ destination, purpose, code });
    return ok(res, 'OTP verified', result);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'OTP verification failed');
  }
};

/** GET/PUT preferences — aliases to settings with messaging focus */
const getPreferences = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT email_notifications, sms_notifications, marketing_emails,
              notify_orders, notify_offers, notify_rewards, notify_order_updates,
              push_notifications
       FROM user_settings WHERE user_id = $1`,
      [req.user.id]
    );
    if (!rows[0]) {
      await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [req.user.id]
      );
      return ok(res, 'Preferences', {
        email_notifications: true,
        sms_notifications: true,
        marketing_emails: false,
        notify_orders: true,
        notify_offers: true,
        notify_rewards: false,
        notify_order_updates: true,
        push_notifications: true,
      });
    }
    return ok(res, 'Preferences', rows[0]);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const putPreferences = async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [req.user.id]
    );
    const b = req.body;
    const { rows } = await pool.query(
      `UPDATE user_settings SET
        email_notifications = COALESCE($1, email_notifications),
        sms_notifications = COALESCE($2, sms_notifications),
        marketing_emails = COALESCE($3, marketing_emails),
        notify_orders = COALESCE($4, notify_orders),
        notify_offers = COALESCE($5, notify_offers),
        notify_rewards = COALESCE($6, notify_rewards),
        notify_order_updates = COALESCE($7, notify_order_updates),
        push_notifications = COALESCE($8, push_notifications),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $9
       RETURNING email_notifications, sms_notifications, marketing_emails,
                 notify_orders, notify_offers, notify_rewards, notify_order_updates,
                 push_notifications`,
      [
        typeof b.email_notifications === 'boolean' ? b.email_notifications : null,
        typeof b.sms_notifications === 'boolean' ? b.sms_notifications : null,
        typeof b.marketing_emails === 'boolean' ? b.marketing_emails : null,
        typeof b.notify_orders === 'boolean' ? b.notify_orders : null,
        typeof b.notify_offers === 'boolean' ? b.notify_offers : null,
        typeof b.notify_rewards === 'boolean' ? b.notify_rewards : null,
        typeof b.notify_order_updates === 'boolean' ? b.notify_order_updates : null,
        typeof b.push_notifications === 'boolean' ? b.push_notifications : null,
        req.user.id,
      ]
    );
    return ok(res, 'Preferences updated', rows[0]);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/** POST /api/messaging/invoice — generate PDF for a payment */
const postGenerateInvoice = async (req, res) => {
  try {
    const paymentId = req.body.payment_id || req.params.id;
    if (!paymentId) return fail(res, 400, 'payment_id is required');

    const isAdmin = req.user.role === 'admin';
    const pdf = await buildInvoicePdfBuffer({
      paymentId,
      userId: isAdmin ? null : req.user.id,
    });

    // Optionally email
    if (req.body.send_email) {
      const user = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [
        req.user.id,
      ]);
      const payment = await pool.query('SELECT order_id FROM payments WHERE id = $1', [
        paymentId,
      ]);
      const tpl = templates.invoice({
        name: user.rows[0]?.full_name,
        orderId: payment.rows[0]?.order_id,
      });
      await sendEmail({
        to: req.body.to || user.rows[0]?.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        userId: req.user.id,
        template: 'invoice',
        orderId: payment.rows[0]?.order_id,
        attachments: [
          {
            filename: `foodiq-invoice-${String(paymentId).slice(0, 8)}.pdf`,
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      });
    }

    if (req.body.download === false) {
      return ok(res, 'Invoice generated', { payment_id: paymentId, emailed: !!req.body.send_email });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="foodiq-invoice-${String(paymentId).slice(0, 8)}.pdf"`
    );
    return res.send(pdf);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Invoice generation failed');
  }
};

/** GET logs (admin) */
const getEmailLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const { rows } = await pool.query(
      `SELECT id, user_id, to_email, subject, template, status, provider,
              provider_message_id, error, attempts, related_order_id, created_at
       FROM email_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return ok(res, 'Email logs', rows);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getSmsLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const { rows } = await pool.query(
      `SELECT id, user_id, to_phone, body, template, status, provider,
              provider_message_id, error, attempts, related_order_id, created_at
       FROM sms_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return ok(res, 'SMS logs', rows);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/** Admin report triggers */
const postRunReport = async (req, res) => {
  try {
    const type = req.body.type || req.query.type;
    let result;
    switch (type) {
      case 'daily_platform':
        result = await sendDailyPlatformReport();
        break;
      case 'restaurant_daily':
        result = await sendRestaurantDailySales(req.body.restaurant_id);
        break;
      case 'restaurant_weekly':
        result = await sendRestaurantWeeklySales(req.body.restaurant_id);
        break;
      case 'delivery_weekly':
        result = await sendDeliveryWeeklyEarnings(req.body.partner_user_id);
        break;
      case 'delivery_monthly':
        result = await sendDeliveryMonthlyEarnings(req.body.partner_user_id);
        break;
      default:
        return fail(res, 400, 'Unknown report type');
    }
    return ok(res, 'Report sent', result);
  } catch (error) {
    return fail(res, error.status || 500, error.message);
  }
};

/** Dispatch a typed notification email/sms without creating in-app (admin promo) */
const postPromo = async (req, res) => {
  try {
    const { user_id, title, message, link } = req.body;
    if (!user_id || !title || !message) {
      return fail(res, 400, 'user_id, title, message required');
    }
    await dispatchEmailSms({
      userId: user_id,
      type: 'promotion',
      title,
      message,
      meta: { link },
      forceEmail: false,
    });
    return ok(res, 'Promotional email dispatched (subject to preferences)');
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

module.exports = {
  postSendEmail,
  postSendSms,
  postSendOtp,
  postVerifyOtp,
  getPreferences,
  putPreferences,
  postGenerateInvoice,
  getEmailLogs,
  getSmsLogs,
  postRunReport,
  postPromo,
};
