/**
 * Admin push targeting + bulk send via notificationService.
 */
const { pool } = require('../config/db');
const { notify } = require('./notificationService');
const TYPES = require('./notificationTypes');

const MARKETING_TYPES = {
  new_offer: TYPES.NEW_OFFER,
  festival_discount: TYPES.FESTIVAL_DISCOUNT,
  flash_sale: TYPES.FLASH_SALE,
  coupon_alert: TYPES.COUPON_ALERT,
};

const resolveAudienceUsers = async ({
  audience = 'all',
  user_ids = [],
  city = null,
  restaurant_id = null,
}) => {
  if (Array.isArray(user_ids) && user_ids.length > 0) {
    const { rows } = await pool.query(
      `SELECT id, role FROM users WHERE id = ANY($1::uuid[])`,
      [user_ids]
    );
    return rows;
  }

  if (restaurant_id) {
    const { rows } = await pool.query(
      `SELECT DISTINCT u.id, u.role
       FROM (
         SELECT owner_id AS id, 'restaurant_owner'::text AS role
         FROM restaurants WHERE id = $1 AND owner_id IS NOT NULL
         UNION
         SELECT DISTINCT user_id AS id, 'customer'::text AS role
         FROM orders WHERE restaurant_id = $1
       ) u
       JOIN users usr ON usr.id = u.id`,
      [restaurant_id]
    );
    return rows;
  }

  if (city) {
    const { rows } = await pool.query(
      `SELECT DISTINCT u.id, u.role
       FROM users u
       JOIN addresses a ON a.user_id = u.id
       WHERE LOWER(TRIM(a.city)) = LOWER(TRIM($1))`,
      [city]
    );
    return rows;
  }

  let userQuery = `SELECT id, role FROM users WHERE 1=1`;
  if (audience === 'customers') userQuery += ` AND role = 'customer'`;
  else if (audience === 'restaurants') userQuery += ` AND role = 'restaurant_owner'`;
  else if (audience === 'delivery') userQuery += ` AND role = 'delivery_partner'`;
  else if (audience === 'admins') userQuery += ` AND role = 'admin'`;
  else userQuery += ` AND role IN ('customer', 'restaurant_owner', 'delivery_partner', 'admin')`;

  const { rows } = await pool.query(userQuery);
  return rows;
};

const sendPushCampaign = async ({
  audience = 'all',
  user_ids = [],
  city = null,
  restaurant_id = null,
  title,
  message,
  type = 'coupon_alert',
  link = '/notifications',
  created_by = null,
  schedule_at = null,
  meta = {},
  skip_log = false,
}) => {
  if (!title || !message) {
    throw new Error('title and message are required');
  }

  const notificationType = MARKETING_TYPES[type] || type || TYPES.COUPON_ALERT;

  if (schedule_at && new Date(schedule_at) > new Date()) {
    const { rows } = await pool.query(
      `INSERT INTO marketing_campaigns
         (name, channel, audience, subject, message, status, scheduled_at, meta, created_by)
       VALUES ($1, 'push', $2, $3, $4, 'scheduled', $5, $6, $7)
       RETURNING *`,
      [
        title.slice(0, 160),
        audience,
        title,
        message,
        new Date(schedule_at),
        JSON.stringify({
          ...meta,
          user_ids,
          city,
          restaurant_id,
          notification_type: notificationType,
          link,
        }),
        created_by,
      ]
    );
    return { scheduled: true, campaign: rows[0], sent: 0 };
  }

  const users = await resolveAudienceUsers({ audience, user_ids, city, restaurant_id });
  let sent = 0;

  for (const u of users) {
    await notify({
      userId: u.id,
      type: notificationType,
      title,
      message,
      role: u.role,
      link,
      meta: { ...meta, audience, city, restaurant_id },
      dedupeKey: `campaign:${u.id}:${notificationType}:${Date.now()}`,
    });
    sent += 1;
  }

  if (created_by && !skip_log) {
    await pool.query(
      `INSERT INTO marketing_campaigns
         (name, channel, audience, subject, message, status, sent_count, meta, created_by)
       VALUES ($1, 'push', $2, $3, $4, 'sent', $5, $6, $7)`,
      [
        title.slice(0, 160),
        audience,
        title,
        message,
        sent,
        JSON.stringify({ ...meta, user_ids, city, restaurant_id, notification_type: notificationType }),
        created_by,
      ]
    );
  }

  return { scheduled: false, sent };
};

const sendMarketingByType = async (type, { title, message, link = '/offers' }) => {
  return sendPushCampaign({
    audience: 'customers',
    title,
    message,
    type,
    link,
  });
};

module.exports = {
  resolveAudienceUsers,
  sendPushCampaign,
  sendMarketingByType,
  MARKETING_TYPES,
};
