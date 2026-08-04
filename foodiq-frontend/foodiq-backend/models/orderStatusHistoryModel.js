const { pool } = require('../config/db');

/** Human-readable label for a raw orders.status value (case-insensitive). */
const STATUS_LABELS = {
  pending: 'Order Placed',
  paid: 'Payment Confirmed',
  confirmed: 'Order Confirmed',
  accepted: 'Restaurant Accepted',
  preparing: 'Preparing',
  'ready for pickup': 'Ready for Pickup',
  'picked up': 'Picked Up',
  'on the way': 'Out for Delivery',
  'out for delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  'refund completed': 'Refund Completed',
  'refund initiated': 'Refund Initiated',
};

const describeStatus = (status) => {
  if (!status) return 'Unknown';
  const key = String(status).toLowerCase().trim();
  return STATUS_LABELS[key] || String(status);
};

/**
 * Manual insert for narrative events that have no orders.status diff for the
 * trigger to catch (reassignment, reschedule, refund markers).
 */
const recordStatusChange = async ({
  orderId,
  fromStatus = null,
  toStatus,
  changedBy = null,
  source = 'admin',
  reason = null,
  meta = {},
}) => {
  if (!orderId || !toStatus) return null;
  const { rows } = await pool.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, source, reason, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING *`,
    [orderId, fromStatus, toStatus, changedBy, source, reason, JSON.stringify(meta || {})]
  );
  return rows[0] || null;
};

const listRawForOrder = async (orderId) => {
  const { rows } = await pool.query(
    `SELECT osh.*, u.full_name AS changed_by_name, u.role, u.admin_role
     FROM order_status_history osh
     LEFT JOIN users u ON u.id = osh.changed_by
     WHERE osh.order_id = $1
     ORDER BY osh.created_at ASC`,
    [orderId]
  );
  return rows;
};

/**
 * Pure helper: merges the raw history rows with a synthesized "Order Placed"
 * event (the trigger only fires on UPDATE, so order creation itself never
 * gets a history row) into a single chronological timeline. Exported
 * separately so it can be unit-tested without a database.
 */
const buildTimeline = ({ created_at: createdAt, status } = {}, historyRows = []) => {
  const events = [
    {
      label: 'Order Placed',
      status: 'placed',
      from_status: null,
      source: 'system',
      changed_by_name: null,
      reason: null,
      created_at: createdAt || null,
    },
    ...historyRows.map((row) => ({
      label: describeStatus(row.to_status),
      status: row.to_status,
      from_status: row.from_status,
      source: row.source,
      changed_by_name: row.changed_by_name || null,
      reason: row.reason || null,
      created_at: row.created_at,
    })),
  ];

  // Legacy orders whose status changed before this migration/trigger existed
  // have no history rows even though their current status isn't "placed" —
  // append a synthesized current-status entry (undated) so the UI isn't stuck
  // showing only "Order Placed" for an order that's actually Delivered.
  const currentKey = String(status || '').toLowerCase().trim();
  const hasRealHistory = historyRows.length > 0;
  if (!hasRealHistory && currentKey && currentKey !== 'pending') {
    events.push({
      label: describeStatus(status),
      status,
      from_status: null,
      source: 'system',
      changed_by_name: null,
      reason: null,
      created_at: null,
      derived: true,
    });
  }

  return events;
};

const listForOrder = async (orderId, order) => {
  const rows = await listRawForOrder(orderId);
  return buildTimeline(order, rows);
};

module.exports = {
  recordStatusChange,
  listRawForOrder,
  listForOrder,
  buildTimeline,
  describeStatus,
  STATUS_LABELS,
};
