/**
 * Channel dispatcher: email + SMS based on user preferences and event type.
 * Used by notificationService and transactional auth flows.
 */
const { pool } = require('../config/db');
const { sendEmail } = require('./emailService');
const { sendSms } = require('./smsService');
const { templates } = require('./emailTemplates');
const { typeToCategory } = require('./notificationTypes');

const getUserComms = async (userId) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone_number, u.role,
            COALESCE(s.email_notifications, TRUE) AS email_notifications,
            COALESCE(s.sms_notifications, TRUE) AS sms_notifications,
            COALESCE(s.marketing_emails, FALSE) AS marketing_emails,
            COALESCE(s.push_notifications, TRUE) AS push_notifications,
            COALESCE(s.notify_orders, TRUE) AS notify_orders,
            COALESCE(s.notify_offers, TRUE) AS notify_offers,
            COALESCE(s.notify_rewards, FALSE) AS notify_rewards,
            COALESCE(s.notify_order_updates, TRUE) AS notify_order_updates
     FROM users u
     LEFT JOIN user_settings s ON s.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const categoryAllowed = (prefs, type) => {
  if (!prefs) return true;
  const cat = typeToCategory(type);
  if (cat === 'Orders') return prefs.notify_orders !== false;
  if (cat === 'Offers') return prefs.notify_offers !== false;
  if (cat === 'Payments') return prefs.notify_orders !== false;
  if (cat === 'Account') return true;
  return true;
};

const isMarketingType = (type) => {
  const t = String(type || '').toLowerCase();
  return t.includes('offer') || t.includes('coupon') || t.includes('promo') || t.includes('marketing');
};

/**
 * Map notification type → email template + optional SMS body.
 */
const buildChannelPayload = ({ type, title, message, user, orderId, meta }) => {
  const name = user.full_name;
  const t = String(type || '').toLowerCase();

  let emailTpl = templates.generic({ title, body: message, ctaHref: meta?.link });
  let smsBody = null;

  if (t.includes('welcome')) {
    emailTpl = templates.welcome({ name });
  } else if (t.includes('payment_success') || t === 'payment_received') {
    emailTpl = templates.paymentSuccess({
      name,
      orderId,
      amount: meta?.amount,
    });
  } else if (t.includes('payment_failed') || t.includes('failed_payment')) {
    emailTpl = templates.paymentFailed({ name, reason: message });
  } else if (t.includes('refund')) {
    emailTpl = templates.refund({ name, orderId, amount: meta?.amount });
    smsBody = `Foodiq: Refund of ₹${Number(meta?.amount || 0).toFixed(0)} processed for order #${String(orderId || '').slice(0, 8)}.`;
  } else if (t === 'new_order' || t === 'order_placed') {
    if (user.role === 'restaurant_owner') {
      emailTpl = templates.restaurantNewOrder({
        restaurantName: meta?.restaurant_name,
        orderId,
        total: meta?.amount || meta?.total,
      });
      smsBody = `Foodiq: New order #${String(orderId || '').slice(0, 8)} for ₹${Number(meta?.amount || meta?.total || 0).toFixed(0)}. Open partner app.`;
    } else {
      emailTpl = templates.orderConfirmation({
        name,
        orderId,
        total: meta?.amount || meta?.total,
        restaurant: meta?.restaurant_name,
      });
      smsBody = `Foodiq: Order #${String(orderId || '').slice(0, 8)} confirmed. Track in app.`;
    }
  } else if (
    t.includes('order_') ||
    t.includes('out_for_delivery') ||
    t.includes('delivery') ||
    t.includes('preparing') ||
    t.includes('ready') ||
    t.includes('picked') ||
    t.includes('cancelled') ||
    t.includes('accepted')
  ) {
    emailTpl = templates.orderStatus({
      name,
      orderId,
      status: meta?.status || title || message,
    });
    if (t.includes('out_for_delivery') || t.includes('on the way')) {
      smsBody = `Foodiq: Order #${String(orderId || '').slice(0, 8)} is out for delivery.`;
    } else if (t.includes('delivered') || t.includes('delivery_completed')) {
      smsBody = `Foodiq: Order #${String(orderId || '').slice(0, 8)} delivered. Enjoy!`;
    } else if (t.includes('new_delivery_request')) {
      smsBody = `Foodiq: New delivery request #${String(orderId || '').slice(0, 8)}. Open delivery app.`;
    } else if (t.includes('pickup_reminder')) {
      smsBody = `Foodiq: Pickup reminder for order #${String(orderId || '').slice(0, 8)}.`;
    }
  } else if (isMarketingType(t)) {
    emailTpl = templates.promotion({
      title,
      body: message,
      ctaHref: meta?.link,
    });
  }

  if (!smsBody && (t.includes('order') || t.includes('delivery') || t.includes('payment'))) {
    smsBody = `Foodiq: ${title}. ${message}`.slice(0, 160);
  }

  return { emailTpl, smsBody };
};

/** Skip duplicate channel sends for the same user/type/order within a short window. */
const wasRecentlySent = async (table, userId, template, orderId, minutes = 5) => {
  try {
    const col = table === 'email_logs' ? 'to_email' : 'to_phone';
    void col;
    const { rows } = await pool.query(
      `SELECT id FROM ${table}
       WHERE user_id = $1
         AND template = $2
         AND ($3::uuid IS NULL OR related_order_id = $3)
         AND status IN ('sent', 'submitted', 'queued')
         AND created_at > NOW() - ($4 * INTERVAL '1 minute')
       LIMIT 1`,
      [userId, template, orderId || null, minutes]
    );
    return Boolean(rows[0]);
  } catch {
    return false;
  }
};

/**
 * Send email/SMS for a notification event (non-blocking safe).
 */
const dispatchEmailSms = async ({
  userId,
  type,
  title,
  message,
  orderId = null,
  meta = {},
  forceEmail = false,
  forceSms = false,
  transactional = false,
  attachments = [],
}) => {
  try {
    const user = await getUserComms(userId);
    if (!user) return;

    if (!transactional && !categoryAllowed(user, type)) return;

    const marketing = isMarketingType(type);
    if (!transactional && marketing && !user.marketing_emails && !forceEmail) {
      // Skip marketing email/SMS; in-app already delivered
      return;
    }

    // Respect order-update preference for order/delivery emails & SMS
    if (
      !transactional &&
      user.notify_order_updates === false &&
      (String(type || '').includes('order') ||
        String(type || '').includes('delivery') ||
        String(type || '').includes('pickup'))
    ) {
      return;
    }

    const { emailTpl, smsBody } = buildChannelPayload({
      type,
      title,
      message,
      user,
      orderId,
      meta,
    });

    const wantEmail =
      forceEmail ||
      (user.email_notifications &&
        (transactional || !marketing || user.marketing_emails));

    const wantSms =
      forceSms ||
      (user.sms_notifications &&
        (transactional ||
          String(type || '').includes('order') ||
          String(type || '').includes('delivery') ||
          String(type || '').includes('otp') ||
          String(type || '').includes('payment') ||
          String(type || '').includes('refund')));

    if (wantEmail && user.email) {
      const dup = await wasRecentlySent('email_logs', userId, type, orderId);
      if (!dup) {
        await sendEmail({
          to: user.email,
          subject: emailTpl.subject,
          html: emailTpl.html,
          text: emailTpl.text,
          userId,
          template: type,
          orderId,
          attachments,
          meta: { title },
        }).catch((err) => console.warn('[comms] email skip', err.message));
      }
    }

    if (wantSms && user.phone_number && smsBody) {
      const dup = await wasRecentlySent('sms_logs', userId, type, orderId);
      if (!dup) {
        await sendSms({
          to: user.phone_number,
          body: smsBody,
          userId,
          template: type,
          orderId,
          meta: { title },
        }).catch((err) => console.warn('[comms] sms skip', err.message));
      }
    }
  } catch (err) {
    console.warn('[comms] dispatch failed', err.message);
  }
};

module.exports = {
  dispatchEmailSms,
  getUserComms,
  categoryAllowed,
};
