const EVENTS = require('./events');
const { userRoom, roleRoom, orderRoom, restaurantRoom, deliveryRoom } = require('./rooms');
const { listOnlineRiders, onlineRiderCount } = require('./presence');

// Available Orders board: an order at/above this value is nudged to partners as "priority".
// Kept in sync with the same threshold used by deliveryModel's listAvailableOrders scoring.
const AVAILABLE_ORDERS_PRIORITY_VALUE = Number(process.env.PRIORITY_ORDER_VALUE_THRESHOLD || 500);

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

  // Available Orders board: a "Ready for Pickup" order just became visible to every
  // online, unassigned delivery partner — nudge them to refetch (and flag if it also
  // qualifies as a priority order by order value, matching deliveryModel's own threshold).
  if (event === EVENTS.ORDER_READY && !order.delivery_partner_id) {
    io.to(roleRoom('delivery_partner')).emit(EVENTS.DELIVERY_NEW_ORDER, payload);
    if (payload.total_amount != null && Number(payload.total_amount) >= AVAILABLE_ORDERS_PRIORITY_VALUE) {
      io.to(roleRoom('delivery_partner')).emit(EVENTS.DELIVERY_PRIORITY_ORDER, payload);
    }
  }

  // An order was cancelled or otherwise updated while still sitting unassigned on the
  // Available Orders board — tell every partner watching the board to drop/refresh it.
  if (!order.delivery_partner_id && !extras.delivery_partner_id) {
    if (event === EVENTS.ORDER_CANCELLED) {
      io.to(roleRoom('delivery_partner')).emit(EVENTS.DELIVERY_ORDER_CANCELLED, payload);
    } else if (event !== EVENTS.ORDER_READY) {
      io.to(roleRoom('delivery_partner')).emit(EVENTS.DELIVERY_ORDER_UPDATED, payload);
    }
  }

  // Trigger Analytics auto-update if delivery partner is involved
  const partnerId = extras.delivery_partner_id || order.delivery_partner_id || order.driver_id;
  if (partnerId) {
    try {
      const AnalyticsService = require('../services/analyticsService');
      AnalyticsService.triggerAnalyticsUpdate(partnerId, `order_${payload.status || 'updated'}`);
    } catch (e) {
      /* ignore circular dependency / optional */
    }
  }
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

/** Customer or delivery-partner wallet balance changed (credit/debit/refund). */
const emitWalletUpdated = ({ wallet_type, user_id, partner_id, balance, reason }) => {
  const io = getIO();
  if (!io) return;
  const payload = { wallet_type, balance, reason, at: new Date().toISOString() };
  if (user_id) io.to(userRoom(user_id)).emit(EVENTS.WALLET_UPDATED, { ...payload, user_id });
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.WALLET_UPDATED, { ...payload, partner_id });
  io.to(roleRoom('admin')).emit(EVENTS.WALLET_UPDATED, { ...payload, user_id, partner_id });
};

/** A refund request was created (pending or auto-approved). */
const emitRefundInitiated = ({ order_id, user_id, amount, refund_id }) => {
  const io = getIO();
  if (!io) return;
  const payload = { order_id, user_id, amount, refund_id, at: new Date().toISOString() };
  const targets = [roleRoom('admin')];
  if (order_id) targets.push(orderRoom(order_id));
  if (user_id) targets.push(userRoom(user_id));
  [...new Set(targets)].forEach((room) => io.to(room).emit(EVENTS.REFUND_INITIATED, payload));
};

/** A refund finished processing (money actually moved to wallet/Razorpay). */
const emitRefundCompleted = ({ order_id, user_id, amount, refund_id, method }) => {
  const io = getIO();
  if (!io) return;
  const payload = { order_id, user_id, amount, refund_id, method, at: new Date().toISOString() };
  const targets = [roleRoom('admin')];
  if (order_id) targets.push(orderRoom(order_id));
  if (user_id) targets.push(userRoom(user_id));
  [...new Set(targets)].forEach((room) => io.to(room).emit(EVENTS.REFUND_COMPLETED, payload));
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'refund_completed', ...payload });
};

/** A restaurant settlement batch was marked paid. */
const emitSettlementCompleted = ({ settlement_id, restaurant_id, net_payout }) => {
  const io = getIO();
  if (!io) return;
  const payload = { settlement_id, restaurant_id, net_payout, at: new Date().toISOString() };
  if (restaurant_id) io.to(restaurantRoom(restaurant_id)).emit(EVENTS.SETTLEMENT_COMPLETED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SETTLEMENT_COMPLETED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'settlement_completed', ...payload });
};

/** A payout (restaurant settlement or delivery withdrawal) was approved. */
const emitPayoutApproved = ({ type, id, restaurant_id, partner_id, amount }) => {
  const io = getIO();
  if (!io) return;
  const payload = { type, id, restaurant_id, partner_id, amount, at: new Date().toISOString() };
  if (restaurant_id) io.to(restaurantRoom(restaurant_id)).emit(EVENTS.PAYOUT_APPROVED, payload);
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.PAYOUT_APPROVED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.PAYOUT_APPROVED, payload);
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
    io.to(room).emit(EVENTS.DELIVERY_LOCATION, payload);
    if (payload.eta_minutes != null) {
      io.to(room).emit(EVENTS.DELIVERY_ETA_UPDATE, {
        order_id,
        delivery_partner_id,
        eta_minutes: payload.eta_minutes,
        distance_km: payload.distance_km,
        at: payload.at,
      });
    }
  });
};

/** Notify order watchers that a delivery partner has started/stopped live tracking for an order. */
const emitDeliveryTracking = (event, { order_id, delivery_partner_id, user_id, restaurant_id }) => {
  const io = getIO();
  if (!io || !order_id) return;

  const targets = [roleRoom('admin'), orderRoom(order_id)];
  if (user_id) targets.push(userRoom(user_id));
  if (restaurant_id) targets.push(restaurantRoom(restaurant_id));
  if (delivery_partner_id) targets.push(deliveryRoom(delivery_partner_id));

  const payload = { order_id, delivery_partner_id, at: new Date().toISOString() };
  [...new Set(targets)].forEach((room) => io.to(room).emit(event, payload));
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

/** Push a new delivery-partner notification in real time (bell popup + sound + unread badge). */
const emitDeliveryNotification = (partnerId, notification) => {
  const io = getIO();
  if (!io || !partnerId) return;
  io.to(deliveryRoom(partnerId)).emit(EVENTS.DELIVERY_NOTIFICATION, notification);
};

/** Sync "marked as read" across the partner's other open tabs/devices. */
const emitDeliveryNotificationRead = (partnerId, notificationId) => {
  const io = getIO();
  if (!io || !partnerId) return;
  io.to(deliveryRoom(partnerId)).emit(EVENTS.DELIVERY_NOTIFICATION_READ, {
    id: notificationId,
    at: new Date().toISOString(),
  });
};

/** Sync "mark all read" across the partner's other open tabs/devices. */
const emitDeliveryNotificationAllRead = (partnerId) => {
  const io = getIO();
  if (!io || !partnerId) return;
  io.to(deliveryRoom(partnerId)).emit(EVENTS.DELIVERY_NOTIFICATION_ALL_READ, {
    at: new Date().toISOString(),
  });
};

/** Emit real-time shift event updates to delivery partner and admin rooms. */
const emitShiftStart = ({ shift_id, partner_id, check_in }) => {
  const io = getIO();
  if (!io) return;
  const payload = { shift_id, partner_id, check_in, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.DELIVERY_SHIFT_START, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_SHIFT_START, payload);
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'shift_start', ...payload });
};

const emitShiftEnd = ({ shift_id, partner_id, check_out, total_hours }) => {
  const io = getIO();
  if (!io) return;
  const payload = { shift_id, partner_id, check_out, total_hours, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.DELIVERY_SHIFT_END, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_SHIFT_END, payload);
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'shift_end', ...payload });
};

const emitShiftLate = ({ shift_id, partner_id, late_minutes }) => {
  const io = getIO();
  if (!io) return;
  const payload = { shift_id, partner_id, late_minutes, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.DELIVERY_LATE, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_LATE, payload);
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'shift_late', ...payload });
};

const emitAttendanceUpdate = (data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...data, at: new Date().toISOString() };
  if (data.partner_id) io.to(deliveryRoom(data.partner_id)).emit(EVENTS.DELIVERY_ATTENDANCE_UPDATE, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_ATTENDANCE_UPDATE, payload);
};

/** Emitted when an admin creates/assigns a shift to a partner. */
const emitShiftAssigned = ({ shift_id, partner_id, shift_name, start_time, end_time }) => {
  const io = getIO();
  if (!io) return;
  const payload = { shift_id, partner_id, shift_name, start_time, end_time, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.SHIFT_ASSIGNED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SHIFT_ASSIGNED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'shift_assigned', ...payload });
};

/** Emitted when an admin edits a shift's schedule. */
const emitShiftUpdated = (shift = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...shift, at: new Date().toISOString() };
  if (shift.partner_id) io.to(deliveryRoom(shift.partner_id)).emit(EVENTS.SHIFT_UPDATED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SHIFT_UPDATED, payload);
};

/** Emitted when a partner starts/ends a break on an active shift. */
const emitShiftBreakStart = ({ shift_log_id, partner_id, break_start }) => {
  const io = getIO();
  if (!io) return;
  const payload = { shift_log_id, partner_id, break_start, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.SHIFT_BREAK_START, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SHIFT_BREAK_START, payload);
};

const emitShiftBreakEnd = ({ shift_log_id, partner_id, break_end, duration_minutes }) => {
  const io = getIO();
  if (!io) return;
  const payload = { shift_log_id, partner_id, break_end, duration_minutes, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.SHIFT_BREAK_END, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SHIFT_BREAK_END, payload);
};

/** Rider enters an assigned zone (including "returning" after a prior exit). */
const emitZoneEnter = ({ partner_id, zone, partner_name }) => {
  const io = getIO();
  if (!io) return;
  const payload = { partner_id, zone, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.DELIVERY_ZONE_ENTER, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_ZONE_ENTER, { ...payload, partner_name });
};

/** Rider exits all assigned zones. */
const emitZoneExit = ({ partner_id, distance_meters, nearest_zone, partner_name }) => {
  const io = getIO();
  if (!io) return;
  const payload = { partner_id, distance_meters, nearest_zone, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.DELIVERY_ZONE_EXIT, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_ZONE_EXIT, { ...payload, partner_name });
};

/** 100m/300m boundary warning while outside an assigned zone. */
const emitZoneWarning = ({ partner_id, warning_level, distance_meters, nearest_zone }) => {
  const io = getIO();
  if (!io) return;
  const payload = { partner_id, warning_level, distance_meters, nearest_zone, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.DELIVERY_ZONE_WARNING, payload);
};

/** Admin CRUD (create/update/delete) or an auto zone-switch for a rider. */
const emitZoneChanged = ({ action, zone, zone_id, partner_id }) => {
  const io = getIO();
  if (!io) return;
  const payload = { action, zone, zone_id, partner_id, at: new Date().toISOString() };
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_ZONE_CHANGED, payload);
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.DELIVERY_ZONE_CHANGED, payload);
};

/** Zone-scoped GPS tick — coordinates plus live geo-fencing status. */
const emitZoneGpsUpdate = ({ partner_id, lat, lng, heading, accuracy, in_zone, current_zone_id, distance_to_boundary_meters, orders_eligible }) => {
  const io = getIO();
  if (!io) return;
  const payload = {
    partner_id, lat, lng, heading, accuracy,
    in_zone, current_zone_id, distance_to_boundary_meters, orders_eligible,
    at: new Date().toISOString(),
  };
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_ZONE_GPS_UPDATE, payload);
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.DELIVERY_ZONE_GPS_UPDATE, payload);
};

/** Admin-only alert for zone violations (confirmed exit / suspected GPS spoofing). */
const emitAdminZoneAlert = ({ partner_id, partner_name, alert_type, zone, distance_meters, message }) => {
  const io = getIO();
  if (!io) return;
  const payload = {
    partner_id, partner_name, alert_type, zone, distance_meters, message,
    at: new Date().toISOString(),
  };
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_ZONE_ALERT, payload);
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'zone_alert', ...payload });
};

const emitEmergencyNew = (emergency = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...emergency, at: new Date().toISOString() };
  if (emergency.partner_id) io.to(deliveryRoom(emergency.partner_id)).emit(EVENTS.EMERGENCY_NEW, payload);
  io.to(roleRoom('admin')).emit(EVENTS.EMERGENCY_NEW, payload);
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'emergency_new', ...payload });
};

const emitEmergencyUpdate = (emergency = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...emergency, at: new Date().toISOString() };
  if (emergency.partner_id) io.to(deliveryRoom(emergency.partner_id)).emit(EVENTS.EMERGENCY_UPDATE, payload);
  io.to(roleRoom('admin')).emit(EVENTS.EMERGENCY_UPDATE, payload);
};

const emitEmergencyResolved = (emergency = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...emergency, at: new Date().toISOString() };
  if (emergency.partner_id) io.to(deliveryRoom(emergency.partner_id)).emit(EVENTS.EMERGENCY_RESOLVED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.EMERGENCY_RESOLVED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'emergency_resolved', ...payload });
};

const emitEmergencyCancelled = (emergency = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...emergency, at: new Date().toISOString() };
  if (emergency.partner_id) io.to(deliveryRoom(emergency.partner_id)).emit(EVENTS.EMERGENCY_CANCELLED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.EMERGENCY_CANCELLED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, { type: 'emergency_cancelled', ...payload });
};

const emitReferralUpdate = (partnerId, data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...data, at: new Date().toISOString() };
  if (partnerId) io.to(deliveryRoom(partnerId)).emit(EVENTS.DELIVERY_REFERRAL_UPDATE, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_REFERRAL_UPDATE, payload);
};

const emitRewardCredited = (partnerId, data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...data, at: new Date().toISOString() };
  if (partnerId) io.to(deliveryRoom(partnerId)).emit(EVENTS.DELIVERY_REWARD_CREDITED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_REWARD_CREDITED, payload);
};

const emitAdminReferralNew = (data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...data, at: new Date().toISOString() };
  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_REFERRAL_NEW, payload);
};

const emitSupportNewTicket = (ticket = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...ticket, at: new Date().toISOString() };
  if (ticket.partner_id) io.to(deliveryRoom(ticket.partner_id)).emit(EVENTS.SUPPORT_NEW_TICKET, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SUPPORT_NEW_TICKET, payload);
};

const emitSupportNewMessage = (message = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...message, at: new Date().toISOString() };
  if (message.ticket_id) io.to(`support:${message.ticket_id}`).emit(EVENTS.SUPPORT_NEW_MESSAGE, payload);
  if (message.partner_id) io.to(deliveryRoom(message.partner_id)).emit(EVENTS.SUPPORT_NEW_MESSAGE, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SUPPORT_NEW_MESSAGE, payload);
};

const emitSupportTyping = (data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...data, at: new Date().toISOString() };
  if (data.ticket_id) io.to(`support:${data.ticket_id}`).emit(EVENTS.SUPPORT_TYPING_EVENT, payload);
  if (data.partner_id) io.to(deliveryRoom(data.partner_id)).emit(EVENTS.SUPPORT_TYPING_EVENT, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SUPPORT_TYPING_EVENT, payload);
};

const emitSupportRead = (data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...data, at: new Date().toISOString() };
  if (data.ticket_id) io.to(`support:${data.ticket_id}`).emit(EVENTS.SUPPORT_READ_EVENT, payload);
  if (data.partner_id) io.to(deliveryRoom(data.partner_id)).emit(EVENTS.SUPPORT_READ_EVENT, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SUPPORT_READ_EVENT, payload);
};

const emitSupportStatusChange = (ticket = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...ticket, at: new Date().toISOString() };
  if (ticket.ticket_id) io.to(`support:${ticket.ticket_id}`).emit(EVENTS.SUPPORT_STATUS_CHANGE, payload);
  if (ticket.partner_id) io.to(deliveryRoom(ticket.partner_id)).emit(EVENTS.SUPPORT_STATUS_CHANGE, payload);
  io.to(roleRoom('admin')).emit(EVENTS.SUPPORT_STATUS_CHANGE, payload);
};

/** Offline Sync Emitters */
const emitSyncStart = (partnerId, data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { partner_id: partnerId, ...data, at: new Date().toISOString() };
  io.to(deliveryRoom(partnerId)).emit(EVENTS.DELIVERY_SYNC_START, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_SYNC_START, payload);
};

const emitSyncProgress = (partnerId, data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { partner_id: partnerId, ...data, at: new Date().toISOString() };
  io.to(deliveryRoom(partnerId)).emit(EVENTS.DELIVERY_SYNC_PROGRESS, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_SYNC_PROGRESS, payload);
};

const emitSyncCompleted = (partnerId, data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { partner_id: partnerId, ...data, at: new Date().toISOString() };
  io.to(deliveryRoom(partnerId)).emit(EVENTS.DELIVERY_SYNC_COMPLETED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_SYNC_COMPLETED, payload);
};

const emitSyncFailed = (partnerId, data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { partner_id: partnerId, ...data, at: new Date().toISOString() };
  io.to(deliveryRoom(partnerId)).emit(EVENTS.DELIVERY_SYNC_FAILED, payload);
  io.to(roleRoom('admin')).emit(EVENTS.DELIVERY_SYNC_FAILED, payload);
};

/** Available Orders board: order was claimed — tell every other browsing partner to drop it. */
const emitDeliveryOrderAccepted = ({ order_id, delivery_partner_id }) => {
  const io = getIO();
  if (!io || !order_id) return;
  const payload = { order_id, delivery_partner_id, at: new Date().toISOString() };
  io.to(roleRoom('delivery_partner')).emit(EVENTS.DELIVERY_ORDER_ACCEPTED, payload);
};

/** Available Orders board: an offered assignment auto-timed-out — tell the offered partner to drop it. */
const emitDeliveryOrderExpired = ({ order_id, partner_id }) => {
  const io = getIO();
  if (!io || !order_id) return;
  const payload = { order_id, partner_id, at: new Date().toISOString() };
  if (partner_id) io.to(deliveryRoom(partner_id)).emit(EVENTS.DELIVERY_ORDER_EXPIRED, payload);
  io.to(roleRoom('delivery_partner')).emit(EVENTS.DELIVERY_ORDER_EXPIRED, payload);
};

const emitDispatchNewOrder = (data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...data, at: new Date().toISOString() };
  io.to(roleRoom('admin')).emit(EVENTS.DISPATCH_NEW_ORDER, payload);
};

const emitDispatchAssigned = (data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...data, at: new Date().toISOString() };
  io.to(roleRoom('admin')).emit(EVENTS.DISPATCH_ASSIGNED, payload);
  if (data.partner?.id) {
    io.to(deliveryRoom(data.partner.id)).emit(EVENTS.DISPATCH_ASSIGNED, payload);
  }
};

const emitDispatchReassigned = (data = {}) => {
  const io = getIO();
  if (!io) return;
  const payload = { ...data, at: new Date().toISOString() };
  io.to(roleRoom('admin')).emit(EVENTS.DISPATCH_REASSIGNED, payload);
  if (data.partner?.id) {
    io.to(deliveryRoom(data.partner.id)).emit(EVENTS.DISPATCH_REASSIGNED, payload);
  }
};

/**
 * Lightweight admin live tick for restaurant verification/status changes
 * (approve/reject/suspend/activate), mirroring the order_status ADMIN_LIVE
 * tick in emitOrderStatus. Also nudges the restaurant's own room so a
 * restaurant-portal session reflects an admin-driven status change live.
 */
const emitRestaurantStatus = (restaurant = {}, extras = {}) => {
  const io = getIO();
  if (!io) return;
  const restaurantId = restaurant.id || extras.restaurant_id;
  if (!restaurantId) return;

  const payload = {
    type: 'restaurant_status',
    restaurant_id: restaurantId,
    approval_status: restaurant.approval_status ?? extras.approval_status ?? null,
    is_active: restaurant.is_active ?? extras.is_active ?? null,
    action: extras.action || null,
    at: new Date().toISOString(),
  };

  io.to(roleRoom('admin')).emit(EVENTS.ADMIN_LIVE, payload);
  io.to(restaurantRoom(restaurantId)).emit(EVENTS.ADMIN_LIVE, payload);
};

module.exports = {
  setIO,
  getIO,
  statusToEvent,
  emitOrderStatus,
  emitOrderCreated,
  emitPaymentCompleted,
  emitWalletUpdated,
  emitRefundInitiated,
  emitRefundCompleted,
  emitSettlementCompleted,
  emitPayoutApproved,
  emitLocationUpdated,
  emitDeliveryTracking,
  emitRiderPresence,
  emitNotification,
  emitDeliveryNotification,
  emitDeliveryNotificationRead,
  emitDeliveryNotificationAllRead,
  emitShiftStart,
  emitShiftEnd,
  emitShiftLate,
  emitAttendanceUpdate,
  emitShiftAssigned,
  emitShiftUpdated,
  emitShiftBreakStart,
  emitShiftBreakEnd,
  emitZoneEnter,
  emitZoneExit,
  emitZoneWarning,
  emitZoneChanged,
  emitZoneGpsUpdate,
  emitAdminZoneAlert,
  emitEmergencyNew,
  emitEmergencyUpdate,
  emitEmergencyResolved,
  emitEmergencyCancelled,
  emitReferralUpdate,
  emitRewardCredited,
  emitAdminReferralNew,
  emitSupportNewTicket,
  emitSupportNewMessage,
  emitSupportTyping,
  emitSupportRead,
  emitSupportStatusChange,
  emitSyncStart,
  emitSyncProgress,
  emitSyncCompleted,
  emitSyncFailed,
  emitDispatchNewOrder,
  emitDispatchAssigned,
  emitDispatchReassigned,
  emitDeliveryOrderAccepted,
  emitDeliveryOrderExpired,
  EVENTS,
};


