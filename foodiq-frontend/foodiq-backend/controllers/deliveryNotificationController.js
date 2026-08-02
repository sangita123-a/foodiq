const dn = require('../models/deliveryNotificationModel');
const { log } = require('../utils/logger');

const ok = (res, message, data = {}) =>
  res.status(200).json({ success: true, message, data });

const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const resolvePartnerId = (req) => req.deliveryPartner?.id || req.user?.id || null;

/**
 * GET /api/delivery/notifications
 * Query: page, limit, unread ("true"), type, category (Orders/Wallet/KYC/Admin)
 */
const getNotifications = async (req, res) => {
  try {
    const partnerId = resolvePartnerId(req);
    if (!partnerId) return fail(res, 401, 'Unauthorized access.');

    const unreadOnly = String(req.query.unread || '').toLowerCase() === 'true';
    const data = await dn.listForPartner(partnerId, {
      page: req.query.page,
      limit: req.query.limit,
      unreadOnly,
      type: req.query.type || '',
      category: req.query.category || '',
    });
    return ok(res, 'Notifications retrieved', data);
  } catch (error) {
    log.error('[deliveryNotificationController] getNotifications error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to retrieve notifications.');
  }
};

/**
 * POST /api/delivery/notifications/:id/read
 */
const markOneRead = async (req, res) => {
  try {
    const partnerId = resolvePartnerId(req);
    if (!partnerId) return fail(res, 401, 'Unauthorized access.');

    const row = await dn.markRead(req.params.id, partnerId);
    if (!row) return fail(res, 404, 'Notification not found.');

    try {
      const { emitDeliveryNotificationRead } = require('../socket/emitters');
      emitDeliveryNotificationRead(partnerId, row.id);
    } catch {
      /* non-blocking */
    }

    return ok(res, 'Notification marked as read', row);
  } catch (error) {
    log.error('[deliveryNotificationController] markOneRead error', { error: error.message });
    return fail(res, 500, 'Failed to mark notification as read.');
  }
};

/**
 * POST /api/delivery/notifications/read-all
 */
const markAllReadHandler = async (req, res) => {
  try {
    const partnerId = resolvePartnerId(req);
    if (!partnerId) return fail(res, 401, 'Unauthorized access.');

    const updated = await dn.markAllRead(partnerId);

    try {
      const { emitDeliveryNotificationAllRead } = require('../socket/emitters');
      emitDeliveryNotificationAllRead(partnerId);
    } catch {
      /* non-blocking */
    }

    return ok(res, 'All notifications marked as read', { updated });
  } catch (error) {
    log.error('[deliveryNotificationController] markAllReadHandler error', { error: error.message });
    return fail(res, 500, 'Failed to mark all notifications as read.');
  }
};

/**
 * DELETE /api/delivery/notifications/:id
 */
const deleteOne = async (req, res) => {
  try {
    const partnerId = resolvePartnerId(req);
    if (!partnerId) return fail(res, 401, 'Unauthorized access.');

    const row = await dn.deleteNotification(req.params.id, partnerId);
    if (!row) return fail(res, 404, 'Notification not found.');
    return ok(res, 'Notification deleted', {});
  } catch (error) {
    log.error('[deliveryNotificationController] deleteOne error', { error: error.message });
    return fail(res, 500, 'Failed to delete notification.');
  }
};

/**
 * POST /api/admin/delivery/notifications/send — Admin only.
 * Body: { partner_id, title, message, type }
 */
const adminSend = async (req, res) => {
  try {
    const { partner_id, title, message, type } = req.body || {};
    if (!partner_id || !title || !message) {
      return fail(res, 400, 'partner_id, title and message are required.');
    }

    const notification = await dn.createNotification({
      partnerId: partner_id,
      type: type || 'admin_message',
      title,
      message,
    });

    return res.status(201).json({
      success: true,
      message: 'Notification sent to delivery partner',
      data: notification,
    });
  } catch (error) {
    log.error('[deliveryNotificationController] adminSend error', { error: error.message });
    return fail(res, error.status || 500, error.message || 'Failed to send notification.');
  }
};

/**
 * GET /api/admin/delivery/notifications — Admin only. Recent sends across all partners.
 */
const adminList = async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const { rows } = await pool.query(
      `SELECT dn.*, u.full_name AS partner_name, u.email AS partner_email
       FROM delivery_notifications dn
       JOIN delivery_partners dp ON dp.id = dn.partner_id
       JOIN users u ON u.id = dp.user_id
       ORDER BY dn.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return ok(res, 'Recent notifications retrieved', { notifications: rows });
  } catch (error) {
    log.error('[deliveryNotificationController] adminList error', { error: error.message });
    return fail(res, 500, 'Failed to retrieve notifications.');
  }
};

module.exports = {
  getNotifications,
  markOneRead,
  markAllReadHandler,
  deleteOne,
  adminSend,
  adminList,
  NOTIFICATION_TYPES: dn.NOTIFICATION_TYPES,
};
