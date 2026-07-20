/**
 * Canonical Socket.IO event names for Foodiq real-time tracking.
 * Keep in sync with frontend `lib/socketEvents.ts`.
 */
module.exports = {
  // Server → Client
  ORDER_CREATED: 'orderCreated',
  ORDER_ACCEPTED: 'orderAccepted',
  ORDER_PREPARING: 'orderPreparing',
  ORDER_READY: 'orderReady',
  PICKUP_COMPLETED: 'pickupCompleted',
  OUT_FOR_DELIVERY: 'outForDelivery',
  ORDER_DELIVERED: 'orderDelivered',
  ORDER_CANCELLED: 'orderCancelled',
  ORDER_STATUS: 'orderStatus',
  LOCATION_UPDATED: 'locationUpdated',
  PAYMENT_COMPLETED: 'paymentCompleted',
  NOTIFICATION: 'notification',
  ADMIN_LIVE: 'adminLive',
  RIDER_PRESENCE: 'riderPresence',

  // Client → Server
  JOIN_ORDER: 'joinOrder',
  LEAVE_ORDER: 'leaveOrder',
  UPDATE_LOCATION: 'updateLocation',
  PING: 'ping',

  // Support live chat
  SUPPORT_MESSAGE: 'supportMessage',
  SUPPORT_TYPING: 'supportTyping',
  SUPPORT_AGENT_STATUS: 'supportAgentStatus',
  JOIN_SUPPORT: 'joinSupport',
  LEAVE_SUPPORT: 'leaveSupport',
};
