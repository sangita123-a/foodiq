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

  // Live Delivery Tracking (namespaced, bidirectional unless noted)
  DELIVERY_LOCATION: 'delivery:location',
  DELIVERY_TRACKING_START: 'delivery:tracking:start',
  DELIVERY_TRACKING_STOP: 'delivery:tracking:stop',
  DELIVERY_ETA_UPDATE: 'delivery:eta:update',

  // Delivery Partner Notification System
  DELIVERY_NOTIFICATION: 'delivery:notification',
  DELIVERY_NOTIFICATION_READ: 'delivery:notification-read',
  DELIVERY_NOTIFICATION_ALL_READ: 'delivery:notification-all-read',

  // Shift Scheduling & Attendance Module
  DELIVERY_SHIFT_START: 'shift:checkedin',
  DELIVERY_SHIFT_END: 'shift:checkout',
  DELIVERY_LATE: 'shift:late',
  DELIVERY_ATTENDANCE_UPDATE: 'attendance:update',
  SHIFT_ASSIGNED: 'shift:assigned',
  SHIFT_UPDATED: 'shift:updated',
  SHIFT_BREAK_START: 'shift:break:start',
  SHIFT_BREAK_END: 'shift:break:end',

  // SOS Emergency Module System
  EMERGENCY_NEW: 'delivery:emergency:new',
  EMERGENCY_UPDATE: 'delivery:emergency:update',
  EMERGENCY_RESOLVED: 'delivery:emergency:resolved',
  EMERGENCY_CANCELLED: 'delivery:emergency:cancelled',

  // Geo-fencing & Delivery Zones System
  DELIVERY_ZONE_ENTER: 'delivery:zone-enter',
  DELIVERY_ZONE_EXIT: 'delivery:zone-exit',
  DELIVERY_ZONE_WARNING: 'delivery:zone-warning',
  DELIVERY_ZONE_CHANGED: 'delivery:zone-changed',
  DELIVERY_ZONE_GPS_UPDATE: 'delivery:gps-update',
  ADMIN_ZONE_ALERT: 'admin:zone-alert',

  // Fraud Detection & Risk Monitoring System
  DELIVERY_FRAUD_WARNING: 'delivery:fraud:warning',
  DELIVERY_FRAUD_BLOCKED: 'delivery:fraud:blocked',
  ADMIN_FRAUD_NEW: 'admin:fraud:new',
  ADMIN_FRAUD_UPDATE: 'admin:fraud:update',

  // Analytics & Reports System
  DELIVERY_ANALYTICS_UPDATE: 'delivery:analytics:update',
  DELIVERY_PERFORMANCE_UPDATE: 'delivery:performance:update',
  ADMIN_ANALYTICS_UPDATE: 'admin:analytics:update',

  // Referral Program Module System
  DELIVERY_REFERRAL_UPDATE: 'delivery:referral:update',
  DELIVERY_REWARD_CREDITED: 'delivery:reward:credited',
  ADMIN_REFERRAL_NEW: 'admin:referral:new',

  // Driver Support Chat Module System
  SUPPORT_NEW_TICKET: 'support:new-ticket',
  SUPPORT_NEW_MESSAGE: 'support:new-message',
  SUPPORT_TYPING_EVENT: 'support:typing',
  SUPPORT_READ_EVENT: 'support:read',
  SUPPORT_STATUS_CHANGE: 'support:status-change',

  // Offline Mode & Auto Sync System
  DELIVERY_SYNC_START: 'delivery:sync:start',
  DELIVERY_SYNC_PROGRESS: 'delivery:sync:progress',
  DELIVERY_SYNC_COMPLETED: 'delivery:sync:completed',
  DELIVERY_SYNC_FAILED: 'delivery:sync:failed',

  // AI Dispatch & Smart Order Assignment System
  DISPATCH_NEW_ORDER: 'dispatch:new-order',
  DISPATCH_ASSIGNED: 'dispatch:assigned',
  DISPATCH_REASSIGNED: 'dispatch:reassigned',

  // AI Route Optimization System
  DELIVERY_ROUTE_UPDATE: 'delivery:route:update',
  DELIVERY_ROUTE_OPTIMIZED: 'delivery:route:optimized',
  DELIVERY_ROUTE_REROUTED: 'delivery:route:rerouted',
  DELIVERY_ETA_CHANGED: 'delivery:eta:changed',

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

