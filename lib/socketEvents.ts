/** Keep in sync with backend `socket/events.js`. */
export const SOCKET_EVENTS = {
  ORDER_CREATED: "orderCreated",
  ORDER_ACCEPTED: "orderAccepted",
  ORDER_PREPARING: "orderPreparing",
  ORDER_READY: "orderReady",
  PICKUP_COMPLETED: "pickupCompleted",
  OUT_FOR_DELIVERY: "outForDelivery",
  ORDER_DELIVERED: "orderDelivered",
  ORDER_CANCELLED: "orderCancelled",
  ORDER_STATUS: "orderStatus",
  LOCATION_UPDATED: "locationUpdated",
  PAYMENT_COMPLETED: "paymentCompleted",
  NOTIFICATION: "notification",
  ADMIN_LIVE: "adminLive",
  RIDER_PRESENCE: "riderPresence",
  JOIN_ORDER: "joinOrder",
  LEAVE_ORDER: "leaveOrder",
  UPDATE_LOCATION: "updateLocation",
  PING: "ping",
  CONNECTED: "connected",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
