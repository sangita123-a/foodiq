const { pool } = require('../config/db');

const attachOrderItems = async (orders) => {
  if (!orders?.length) return orders;
  const ids = orders.map((o) => o.id);
  const { rows: items } = await pool.query(
    `SELECT oi.*, m.name
     FROM order_items oi
     JOIN menu_items m ON oi.menu_item_id = m.id
     WHERE oi.order_id = ANY($1::uuid[])`,
    [ids]
  );
  const byOrder = new Map();
  for (const item of items) {
    const list = byOrder.get(item.order_id) || [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }
  for (const order of orders) {
    order.items = byOrder.get(order.id) || [];
  }
  return orders;
};

const getOrders = async (userId, role, { limit = 50, offset = 0 } = {}) => {
  let query = `
    SELECT o.*, r.name as restaurant_name, a.street, a.city
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    LEFT JOIN addresses a ON o.delivery_address_id = a.id
  `;
  const values = [];

  if (role === 'customer') {
    query += ' WHERE o.user_id = $1';
    values.push(userId);
  } else if (role === 'restaurant_owner') {
    query += ' WHERE r.owner_id = $1';
    values.push(userId);
  } else if (role === 'delivery_partner') {
    query += ` WHERE o.delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = $1
    )`;
    values.push(userId);
  } else if (role === 'admin') {
    // full list for admins via this endpoint (prefer /api/admin/orders)
  } else {
    query += ' WHERE o.user_id = $1';
    values.push(userId);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  values.push(safeLimit, safeOffset);
  query += ` ORDER BY o.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;

  const { rows } = await pool.query(query, values);
  return attachOrderItems(rows);
};

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', statuses: ['Pending', 'pending', 'Accepted', 'confirmed'] },
  { key: 'preparing', label: 'Preparing', statuses: ['Preparing', 'Ready for Pickup'] },
  { key: 'picked_up', label: 'Picked Up', statuses: ['Picked Up'] },
  { key: 'out_for_delivery', label: 'Out For Delivery', statuses: ['On The Way'] },
  { key: 'delivered', label: 'Delivered', statuses: ['Delivered'] },
];

const buildTimeline = (status) => {
  const s = String(status || 'Pending');
  if (/cancel/i.test(s)) {
    return TIMELINE_STEPS.map((step, idx) => ({
      ...step,
      state: idx === 0 ? 'completed' : 'cancelled',
    }));
  }
  let activeIdx = 0;
  for (let i = 0; i < TIMELINE_STEPS.length; i += 1) {
    if (TIMELINE_STEPS[i].statuses.includes(s)) activeIdx = i;
  }
  // Advance through earlier steps when later statuses match
  const orderRank = {
    Pending: 0,
    pending: 0,
    Accepted: 0,
    confirmed: 0,
    Preparing: 1,
    'Ready for Pickup': 1,
    'Picked Up': 2,
    'On The Way': 3,
    Delivered: 4,
  };
  activeIdx = orderRank[s] ?? activeIdx;

  return TIMELINE_STEPS.map((step, idx) => ({
    key: step.key,
    label: step.label,
    state: idx < activeIdx ? 'completed' : idx === activeIdx ? (s === 'Delivered' ? 'completed' : 'current') : 'upcoming',
  }));
};

const formatDeliveryAddress = (order) => {
  const parts = [
    order.house_no,
    order.street,
    order.landmark,
    order.city,
    order.state,
    order.zip_code,
  ].filter(Boolean);
  return parts.join(', ') || null;
};

const getOrderById = async (orderId) => {
  const query = `
    SELECT
      o.*,
      r.name as restaurant_name,
      r.owner_id as restaurant_owner_id,
      r.estimated_delivery_time,
      a.street,
      a.city,
      a.state,
      a.zip_code,
      a.house_no,
      a.landmark,
      a.full_name,
      a.phone_number,
      a.address_type
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    LEFT JOIN addresses a ON o.delivery_address_id = a.id
    WHERE o.id = $1
  `;
  const [{ rows }, itemsRes, paymentRes, trackingRes] = await Promise.all([
    pool.query(query, [orderId]),
    pool.query(
      `SELECT oi.*, m.name, m.image_url
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       WHERE oi.order_id = $1`,
      [orderId]
    ),
    pool.query(
      `SELECT id, method, status, amount, razorpay_payment_id, razorpay_order_id,
              provider_transaction_id, transaction_time, created_at
       FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [orderId]
    ),
    pool.query(
      `SELECT ot.current_status, ot.estimated_delivery_time AS tracking_eta,
              ot.delivery_partner_id, u.full_name AS delivery_partner_name,
              dp.vehicle_type, dp.vehicle_details, dp.rating AS partner_rating
       FROM order_tracking ot
       LEFT JOIN delivery_partners dp ON dp.id = ot.delivery_partner_id
       LEFT JOIN users u ON u.id = dp.user_id
       WHERE ot.order_id = $1
       LIMIT 1`,
      [orderId]
    ).catch(() => ({ rows: [] })),
  ]);

  if (rows.length === 0) return null;

  const order = rows[0];
  order.items = itemsRes.rows;
  order.ordered_items = itemsRes.rows.map((i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    price: i.price_at_time,
    image_url: i.image_url,
  }));
  order.delivery_address = formatDeliveryAddress(order);
  order.order_date = order.created_at;
  order.timeline = buildTimeline(order.status);

  if (paymentRes.rows[0]) {
    const payment = paymentRes.rows[0];
    order.payment_id = payment.id;
    order.payment_method = payment.method;
    order.payment_status = payment.status;
    order.payment_amount = payment.amount;
    order.razorpay_payment_id = payment.razorpay_payment_id;
    order.razorpay_order_id = payment.razorpay_order_id;
    order.transaction_time = payment.transaction_time || payment.created_at;
  }

  const tracking = trackingRes.rows[0];
  if (tracking) {
    order.delivery_partner =
      tracking.delivery_partner_name ||
      (tracking.delivery_partner_id ? 'Assigned partner' : null);
    order.delivery_partner_details = tracking.delivery_partner_id
      ? {
          id: tracking.delivery_partner_id,
          name: tracking.delivery_partner_name,
          vehicle_type: tracking.vehicle_type,
          vehicle_details: tracking.vehicle_details,
          rating: tracking.partner_rating,
        }
      : null;
    order.estimated_delivery_at =
      tracking.tracking_eta || order.estimated_delivery_time || null;
  } else {
    order.delivery_partner = null;
    order.delivery_partner_details = null;
    order.estimated_delivery_at = order.estimated_delivery_time || null;
  }

  return order;
};

const updateOrderStatus = async (orderId, status) => {
  const { rows } = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, orderId]);
  return rows[0];
};

module.exports = { getOrders, getOrderById, updateOrderStatus };
