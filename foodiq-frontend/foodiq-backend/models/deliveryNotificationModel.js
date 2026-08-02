const { pool } = require('../config/db');

/** Canonical delivery notification types (mirrors the DB CHECK constraint). */
const NOTIFICATION_TYPES = [
  'new_order',
  'order_assigned',
  'order_cancelled',
  'order_updated',
  'delivery_completed',
  'wallet_credit',
  'withdrawal_approved',
  'withdrawal_rejected',
  'kyc_approved',
  'kyc_rejected',
  'admin_message',
  'support_ticket_reply',
  'support_ticket_resolved',
  'referral_registered',
  'reward_credited',
  'referral_expired',
  'first_delivery_completed',
];

/** Type → filter-tab category, used by the frontend "All / Orders / Wallet / KYC / System / Support" tabs. */
const CATEGORY_BY_TYPE = {
  new_order: 'Orders',
  order_assigned: 'Orders',
  order_cancelled: 'Orders',
  order_updated: 'Orders',
  delivery_completed: 'Orders',
  wallet_credit: 'Wallet',
  withdrawal_approved: 'Wallet',
  withdrawal_rejected: 'Wallet',
  kyc_approved: 'KYC',
  kyc_rejected: 'KYC',
  admin_message: 'System',
  support_ticket_reply: 'Support',
  support_ticket_resolved: 'Support',
  referral_registered: 'Wallet',
  reward_credited: 'Wallet',
  referral_expired: 'System',
  first_delivery_completed: 'Orders',
};

const CATEGORIES = ['Orders', 'Wallet', 'KYC', 'System', 'Support'];

const getCategory = (type) => CATEGORY_BY_TYPE[type] || 'Admin';

const typesForCategory = (category) =>
  NOTIFICATION_TYPES.filter((t) => CATEGORY_BY_TYPE[t] === category);

/**
 * Insert a delivery notification and broadcast it over Socket.IO in real time.
 * This is the single entry point every auto-create trigger (order lifecycle,
 * wallet, KYC, admin) should call.
 */
const createNotification = async ({
  partnerId,
  type,
  title,
  message,
  relatedOrderId = null,
  actionUrl = null,
}) => {
  if (!partnerId) return null;
  if (!NOTIFICATION_TYPES.includes(type)) {
    throw Object.assign(new Error(`Invalid notification type: ${type}`), { status: 400 });
  }
  if (!title || !message) {
    throw Object.assign(new Error('title and message are required'), { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO delivery_notifications (partner_id, title, message, type, related_order_id, action_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [partnerId, title, message, type, relatedOrderId, actionUrl]
  );
  const notification = rows[0];

  try {
    const { emitDeliveryNotification } = require('../socket/emitters');
    emitDeliveryNotification(partnerId, notification);
  } catch (err) {
    console.warn('[deliveryNotificationModel] socket emit skipped:', err.message);
  }

  return notification;
};

const listForPartner = async (
  partnerId,
  { page = 1, limit = 20, unreadOnly = false, type = '', category = '' } = {}
) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * pageSize;

  const conditions = ['partner_id = $1'];
  const params = [partnerId];

  if (unreadOnly) {
    conditions.push('is_read = FALSE');
  }
  if (type && NOTIFICATION_TYPES.includes(type)) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  } else if (category && CATEGORIES.includes(category)) {
    const types = typesForCategory(category);
    params.push(types);
    conditions.push(`type = ANY($${params.length})`);
  }

  const where = conditions.join(' AND ');

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM delivery_notifications WHERE ${where}`,
    params
  );

  const rowsRes = await pool.query(
    `SELECT * FROM delivery_notifications
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset]
  );

  const unreadRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM delivery_notifications WHERE partner_id = $1 AND is_read = FALSE`,
    [partnerId]
  );

  const total = countRes.rows[0].total;
  return {
    notifications: rowsRes.rows.map((n) => ({ ...n, category: getCategory(n.type) })),
    unread_count: unreadRes.rows[0].total,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
};

const getUnreadCount = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM delivery_notifications WHERE partner_id = $1 AND is_read = FALSE`,
    [partnerId]
  );
  return rows[0].total;
};

const markRead = async (id, partnerId) => {
  const { rows } = await pool.query(
    `UPDATE delivery_notifications
     SET is_read = TRUE
     WHERE id = $1 AND partner_id = $2
     RETURNING *`,
    [id, partnerId]
  );
  return rows[0] || null;
};

const markAllRead = async (partnerId) => {
  const { rows } = await pool.query(
    `UPDATE delivery_notifications
     SET is_read = TRUE
     WHERE partner_id = $1 AND is_read = FALSE
     RETURNING id`,
    [partnerId]
  );
  return rows.length;
};

const deleteNotification = async (id, partnerId) => {
  const { rows } = await pool.query(
    `DELETE FROM delivery_notifications WHERE id = $1 AND partner_id = $2 RETURNING id`,
    [id, partnerId]
  );
  return rows[0] || null;
};

module.exports = {
  NOTIFICATION_TYPES,
  CATEGORY_BY_TYPE,
  CATEGORIES,
  getCategory,
  createNotification,
  listForPartner,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
};
