const {
  getNotificationsByUserId,
  getUnreadCount,
  markRead: markReadModel,
  markAllRead: markAllReadModel,
  deleteNotification,
  clearAll: clearAllModel,
  upsertDeviceToken,
  deactivateDeviceToken,
} = require('../models/notificationModel');
const { notify, notifyAdmins } = require('../services/notificationService');
const { initFirebase, isMockMode } = require('../services/fcmService');

const ok = (res, message, data, status = 200) =>
  res.status(status).json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const getAll = async (req, res) => {
  try {
    const data = await getNotificationsByUserId(req.user.id, {
      type: req.query.type || '',
      category: req.query.category || '',
      q: req.query.q || req.query.search || '',
      from: req.query.from || '',
      to: req.query.to || '',
      unread: req.query.unread || '',
      limit: req.query.limit || 100,
    });
    // Return array for backwards-compatible SWR consumers (Navbar, pages).
    return ok(res, 'Notifications retrieved', data);
  } catch (error) {
    return fail(res, 500, 'Server Error', error.message);
  }
};

const getUnread = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    return ok(res, 'Unread count', { unread_count: count });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const create = async (req, res) => {
  try {
    const { user_id, title, message, type, order_id, meta, link } = req.body;

    if (req.user.role !== 'admin' && req.user.id !== user_id) {
      return fail(res, 403, 'Not authorized');
    }

    const targetId = user_id || req.user.id;
    const record = await notify({
      userId: targetId,
      type: type || 'alert',
      title,
      message,
      meta: meta || {},
      orderId: order_id || null,
      link: link || null,
      role: req.user.role === 'admin' ? null : req.user.role,
    });

    return ok(res, 'Notification created', record, 201);
  } catch (error) {
    return fail(res, 500, 'Server Error', error.message);
  }
};

const markRead = async (req, res) => {
  try {
    const row = await markReadModel(req.params.id, req.user.id);
    if (!row) return fail(res, 404, 'Notification not found');
    return ok(res, 'Notification marked as read', row);
  } catch (error) {
    return fail(res, 500, 'Server Error', error.message);
  }
};

const markAllRead = async (req, res) => {
  try {
    const updated = await markAllReadModel(req.user.id);
    return ok(res, 'All notifications marked as read', { updated });
  } catch (error) {
    return fail(res, 500, 'Server Error', error.message);
  }
};

const clearAll = async (req, res) => {
  try {
    await clearAllModel(req.user.id);
    return ok(res, 'All notifications cleared', {});
  } catch (error) {
    return fail(res, 500, 'Server Error', error.message);
  }
};

const remove = async (req, res) => {
  try {
    const row = await deleteNotification(req.params.id, req.user.id);
    if (!row) return fail(res, 404, 'Notification not found');
    return ok(res, 'Notification deleted', {});
  } catch (error) {
    return fail(res, 500, 'Server Error', error.message);
  }
};

/** Register / refresh FCM device token */
const registerDevice = async (req, res) => {
  try {
    const { token, platform = 'web', device_info } = req.body;
    if (!token || typeof token !== 'string' || token.length < 20) {
      return fail(res, 400, 'Valid FCM token is required');
    }
    const allowed = ['web', 'android', 'ios'];
    if (!allowed.includes(String(platform).toLowerCase())) {
      return fail(res, 400, 'platform must be web, android, or ios');
    }

    const row = await upsertDeviceToken({
      userId: req.user.id,
      token: token.trim(),
      platform: String(platform).toLowerCase(),
      device_info: device_info || {
        userAgent: req.headers['user-agent'],
      },
    });

    return ok(res, 'Device token registered', {
      id: row.id,
      platform: row.platform,
      fcm_mock: isMockMode(),
    }, 201);
  } catch (error) {
    return fail(res, 500, 'Failed to register device', error.message);
  }
};

const unregisterDevice = async (req, res) => {
  try {
    const token = req.body.token || req.params.token;
    if (!token) return fail(res, 400, 'token is required');
    await deactivateDeviceToken(token, req.user.id);
    return ok(res, 'Device token removed', {});
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/** Public-ish config for frontend Firebase init (no secrets) */
const getPushConfig = async (req, res) => {
  try {
    initFirebase();
    return ok(res, 'Push config', {
      enabled: !isMockMode() || process.env.FCM_MOCK === 'true',
      mock: isMockMode(),
      vapid_key: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || null,
      firebase: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || null,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || null,
        projectId:
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || null,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || null,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || null,
      },
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/** Admin: send targeted or broadcast notification */
const adminSend = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return fail(res, 403, 'Admin only');
    const { user_id, title, message, type, order_id, broadcast } = req.body;
    if (!title || !message) return fail(res, 400, 'title and message required');

    if (broadcast) {
      const results = await notifyAdmins({
        type: type || 'alert',
        title,
        message,
        orderId: order_id || null,
      });
      // Also use existing broadcast for all users if requested
      if (req.body.all_users) {
        const { sendPushCampaign } = require('../services/pushNotificationService');
        await sendPushCampaign({
          audience: 'all',
          title,
          message,
          type: type || 'alert',
          created_by: req.user.id,
        });
      }
      return ok(res, 'Admin notification sent', { count: results.length });
    }

    if (!user_id) return fail(res, 400, 'user_id required unless broadcast');
    const record = await notify({
      userId: user_id,
      type: type || 'alert',
      title,
      message,
      orderId: order_id || null,
    });
    return ok(res, 'Notification sent', record, 201);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

module.exports = {
  getAll,
  getUnread,
  create,
  markRead,
  markAllRead,
  clearAll,
  remove,
  registerDevice,
  unregisterDevice,
  getPushConfig,
  adminSend,
};
