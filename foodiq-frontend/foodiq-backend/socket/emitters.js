const EVENTS = require('./events');
const { userRoom, roleRoom, orderRoom, restaurantRoom, deliveryRoom } = require('./rooms');
const { listOnlineRiders, onlineRiderCount } = require('./presence');

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => ioInstance;

/** Map DB / UI status → primary socket event (+ always emit orderStatus). */
const statusToEvent = (status) => {
  const s = String(status || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim();

  if (s === 'pending' || s === 'confirmed') return EVENTS.ORDER_CREATED;
  if (s === 'accepted') return EVENTS.ORDER_ACCEPTED;
  if (s === 'preparing') return EVENTS.ORDER_PREPARING;
  if (s === 'ready for pickup' || s === 'reached restaurant') return EVENTS.ORDER_READY;
  if (s === 'picked up' || s === 'pickup completed') return EVENTS.PICKUP_COMPLETED;
  if (s === 'on the way' || s === 'out for delivery') return EVENTS.OUT_FOR_DELIVERY;
  if (s === 'delivered') return EVENTS.ORDER_DELIVERED;
  if (s === 'cancelled' || s === 'rejected') return EVENTS.ORDER_CANCELLED;
  return EVENTS.ORDER_STATUS;
};

/**
 * Build a compact payload for order status broadcasts.
 */
const buildOrderPayload = (order = {}, extras = {}) => ({
  order_id: order.id || order.order_id || extras.order_id,
  status: order.status || extras.status,
  restaurant_id: order.restaurant_id || extras.restaurant_id || null,
  user_id: order.user_id || extras.user_id || null,
  total_amount: order.total_amount != null ? Number(order.total_amount) : extras.total_amount,
  updated_at: new Date().toISOString(),
  ...extras,
});

/**
 * Emit order lifecycle update to order room + customer + restaurant + admin.
 * Avoid broadcasting to all connected clients.
 */
const emitOrderStatus = (order, extras = {}) => {
  const io = getIO();
  if (!io) return;

  const payload = buildOrderPayload(order, extras);
  if (!payload.order_id) return;

  const event = statusToEvent(payload.status);
  const targets = [orderRoom(payload.order_id), roleRoom('admin')];

  if (payload.user_id) targets.push(userRoom(payload.user_id));
  if (payload.restaurant_id) targets.push(restaurantRoom(payload.restaurant_id));
  if (extras.delivery_partner_user_id) {
    targets.push(userRoom(extras.delivery_partner_user_id));
  }
  if (extras.delivery_partner_id) {
    targets.push(deliveryRoom(extras.delivery_partner_id));
  }

  const unique = [...new Set(targets)];
  unique.forEach((room) => {
    io.to(room).emit(event, payload);
    io.to(room).emit(EVENTS.ORDER_STATUS, { ...payload, event });
  });

  // Lightweight admin live tick (no full dashboard dump)
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, {
    type: 'order_status',
    order_id: payload.order_id,
    status: payload.status,
    event,
    total_amount: payload.total_amount,
    at: payload.updated_at,
  });

  console.log('[socket:emit]', event, payload.order_id, payload.status);
};

const emitOrderCreated = (order, extras = {}) => {
  emitOrderStatus({ ...order, status: order.status || 'Pending' }, {
    ...extras,
    event_hint: EVENTS.ORDER_CREATED,
  });

  const io = getIO();
  if (!io) return;
  const payload = buildOrderPayload(order, { ...extras, status: order.status || 'Pending' });
  if (payload.restaurant_id) {
    io.to(restaurantRoom(payload.restaurant_id)).emit(EVENTS.ORDER_CREATED, payload);
  }
  io.to(roleRoom('admin')).emit(EVENTS.ORDER_CREATED, payload);
  io.to(roleRoom('delivery_partner')).emit(EVENTS.NOTIFICATION, {
    type: 'new_order_ready_soon',
    order_id: payload.order_id,
    message: 'A new order was placed on the platform.',
  });
};

const emitPaymentCompleted = ({ order_id, user_id, restaurant_id, amount, payment_id }) => {
  const io = getIO();
  if (!io) return;
  const payload = {
    order_id,
    user_id,
    restaurant_id,
    amount,
    payment_id,
    at: new Date().toISOString(),
  };
  const targets = [roleRoom('admin')];
  if (order_id) targets.push(orderRoom(order_id));
  if (user_id) targets.push(userRoom(user_id));
  if (restaurant_id) targets.push(restaurantRoom(restaurant_id));
  [...new Set(targets)].forEach((room) => {
    io.to(room).emit(EVENTS.PAYMENT_COMPLETED, payload);
  });
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, {
    type: 'payment',
    ...payload,
  });
};

/**
 * Live rider GPS update → order watchers + restaurant + admin.
 */
const emitLocationUpdated = ({
  order_id,
  user_id,
  restaurant_id,
  delivery_partner_id,
  lat,
  lng,
  eta_minutes,
  distance_km,
  heading,
}) => {
  const io = getIO();
  if (!io) return;
  if (lat == null || lng == null) return;

  const payload = {
    order_id,
    delivery_partner_id,
    lat: Number(lat),
    lng: Number(lng),
    eta_minutes: eta_minutes != null ? Number(eta_minutes) : null,
    distance_km: distance_km != null ? Number(distance_km) : null,
    heading: heading != null ? Number(heading) : null,
    at: new Date().toISOString(),
  };

  const targets = [roleRoom('admin')];
  if (order_id) targets.push(orderRoom(order_id));
  if (user_id) targets.push(userRoom(user_id));
  if (restaurant_id) targets.push(restaurantRoom(restaurant_id));
  if (delivery_partner_id) targets.push(deliveryRoom(delivery_partner_id));

  [...new Set(targets)].forEach((room) => {
    io.to(room).emit(EVENTS.LOCATION_UPDATED, payload);
  });
};

const emitRiderPresence = () => {
  const io = getIO();
  if (!io) return;
  io.to(roleRoom('admin')).emit(EVENTS.RIDER_PRESENCE, {
    online_count: onlineRiderCount(),
    riders: listOnlineRiders(),
    at: new Date().toISOString(),
  });
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, {
    type: 'rider_presence',
    online_count: onlineRiderCount(),
    at: new Date().toISOString(),
  });
};

const emitNotification = (userId, payload) => {
  const io = getIO();
  if (!io || !userId) return;
  io.to(userRoom(userId)).emit(EVENTS.NOTIFICATION, {
    ...payload,
    at: new Date().toISOString(),
  });
};

module.exports = {
  setIO,
  getIO,
  statusToEvent,
  emitOrderStatus,
  emitOrderCreated,
  emitPaymentCompleted,
  emitLocationUpdated,
  emitRiderPresence,
  emitNotification,
  EVENTS,
};
