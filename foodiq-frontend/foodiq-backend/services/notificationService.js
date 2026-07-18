/**
 * Unified notification dispatcher:
 * 1. Persist in DB
 * 2. Socket.IO if user is online
 * 3. Queue FCM push (especially when offline / always for reliability)
 */
const {
  insertNotification,
  getActiveTokensForUser,
  getAdminUserIds,
} = require('../models/notificationModel');
const { enqueuePush } = require('./notificationQueue');
const { pool } = require('../config/db');

const isUserOnline = (userId) => {
  try {
    const { getIO } = require('../socket/emitters');
    const io = getIO();
    if (!io) return false;
    const room = io.sockets.adapter.rooms.get(`user:${userId}`);
    return Boolean(room && room.size > 0);
  } catch {
    return false;
  }
};

const pushEnabledForUser = async (userId) => {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(push_notifications, TRUE) AS push_notifications
       FROM user_settings WHERE user_id = $1`,
      [userId]
    );
    if (!rows[0]) return true;
    return Boolean(rows[0].push_notifications);
  } catch {
    return true;
  }
};

/**
 * @param {object} opts
 */
const notify = async ({
  userId,
  type,
  title,
  message,
  meta = {},
  role = null,
  orderId = null,
  link = null,
  push = true,
  socket = true,
  dedupeKey = null,
}) => {
  if (!userId || !title || !message) {
    console.warn('[notify] skipped — missing userId/title/message');
    return null;
  }

  const resolvedLink =
    link ||
    (orderId ? `/track-order?id=${orderId}` : null) ||
    meta?.link ||
    '/notifications';

  const record = await insertNotification(
    userId,
    type,
    title,
    message,
    {
      ...meta,
      order_id: orderId || meta.order_id || null,
      link: resolvedLink,
    },
    {
      role,
      order_id: orderId || meta.order_id || null,
      dedupe_key:
        dedupeKey ||
        (orderId && type ? `${userId}:${type}:${orderId}` : null),
    }
  );

  if (record?._duplicate) {
    return record;
  }

  const online = isUserOnline(userId);

  if (socket) {
    try {
      const { emitNotification } = require('../socket/emitters');
      emitNotification(userId, {
        id: record.id,
        type,
        title,
        message,
        order_id: orderId || meta.order_id || null,
        link: resolvedLink,
        category: record.category,
        is_read: false,
      });
    } catch (err) {
      console.warn('[notify] socket emit skipped:', err.message);
    }
  }

  const shouldPush = push && (await pushEnabledForUser(userId));
  if (shouldPush) {
    const tokens = await getActiveTokensForUser(userId);
    if (!online || tokens.length > 0) {
      try {
        await enqueuePush({
          userId,
          notificationId: record.id,
          title,
          body: message,
          data: {
            type: type || '',
            notification_id: record.id,
            order_id: orderId || meta.order_id || '',
            link: resolvedLink,
            online: online ? '1' : '0',
          },
        });
      } catch (err) {
        console.warn('[notify] enqueue push failed:', err.message);
      }
    }
  }

  // Email + SMS (preference-aware). Failures never break the caller.
  try {
    const { dispatchEmailSms } = require('./commsService');
    await dispatchEmailSms({
      userId,
      type,
      title,
      message,
      orderId: orderId || meta.order_id || null,
      meta: { ...meta, link: resolvedLink, status: meta.status },
    });
  } catch (err) {
    console.warn('[notify] email/sms skipped:', err.message);
  }

  return record;
};

const notifyAdmins = async (payload) => {
  const ids = await getAdminUserIds();
  const results = [];
  for (const id of ids) {
    results.push(
      await notify({
        ...payload,
        userId: id,
        role: 'admin',
        dedupeKey: payload.dedupeKey
          ? `admin:${payload.dedupeKey}`
          : payload.orderId
            ? `admin:${payload.type}:${payload.orderId}`
            : null,
      })
    );
  }
  return results;
};

module.exports = {
  notify,
  notifyAdmins,
  isUserOnline,
};
