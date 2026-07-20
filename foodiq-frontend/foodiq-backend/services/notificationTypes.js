/**
 * Canonical notification type codes used across Foodiq.
 * Keep in sync with frontend `lib/notificationTypes.ts`.
 */
module.exports = {
  // Customer
  ORDER_PLACED: 'order_placed',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_PREPARING: 'order_preparing',
  ORDER_READY: 'order_ready',
  ORDER_PICKED_UP: 'order_picked_up',
  DRIVER_ASSIGNED: 'driver_assigned',
  NEAR_YOU: 'near_you',
  ARRIVING_SOON: 'arriving_soon',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_INITIATED: 'refund_initiated',
  REFUND_COMPLETED: 'refund_completed',
  NEW_OFFER: 'new_offer',
  COUPON_ALERT: 'coupon_alert',
  FESTIVAL_DISCOUNT: 'festival_discount',
  FLASH_SALE: 'flash_sale',

  // Restaurant
  NEW_ORDER: 'new_order',
  PAYMENT_RECEIVED: 'payment_received',
  LOW_STOCK: 'low_stock',
  DELIVERY_ASSIGNED: 'delivery_assigned',
  PICKUP_COMPLETED: 'pickup_completed',
  CUSTOMER_REVIEW: 'customer_review',

  // Delivery
  NEW_DELIVERY_REQUEST: 'new_delivery_request',
  DELIVERY_ACCEPTED: 'delivery_accepted',
  PICKUP_REMINDER: 'pickup_reminder',
  CUSTOMER_NOT_REACHABLE: 'customer_not_reachable',
  CUSTOMER_CALLING: 'customer_calling',
  DELIVERY_COMPLETED: 'delivery_completed',
  DAILY_EARNINGS: 'daily_earnings',

  // Admin
  HIGH_ORDER_VOLUME: 'high_order_volume',
  FAILED_PAYMENT: 'failed_payment',
  REFUND_REQUEST: 'refund_request',
  RESTAURANT_REGISTRATION: 'restaurant_registration',
  DELIVERY_REGISTRATION: 'delivery_registration',
  CRITICAL_ERROR: 'critical_error',
  LOW_SERVER_HEALTH: 'low_server_health',

  // Generic
  ORDER: 'order',
  PAYMENT: 'payment',
  ALERT: 'alert',
  DELIVERY: 'delivery',
  STOCK: 'stock',
};

/** Map DB status → customer notification type */
const statusToCustomerType = (status) => {
  const s = String(status || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim();
  if (s === 'pending' || s === 'confirmed') return module.exports.ORDER_PLACED;
  if (s === 'accepted') return module.exports.ORDER_ACCEPTED;
  if (s === 'preparing') return module.exports.ORDER_PREPARING;
  if (s === 'ready for pickup' || s === 'reached restaurant') return module.exports.ORDER_READY;
  if (s === 'assigned' || s === 'delivery partner assigned') return module.exports.DRIVER_ASSIGNED;
  if (s === 'picked up') return module.exports.ORDER_PICKED_UP;
  if (s === 'arriving soon') return module.exports.ARRIVING_SOON;
  if (s === 'near you') return module.exports.NEAR_YOU;
  if (s === 'on the way' || s === 'out for delivery') return module.exports.OUT_FOR_DELIVERY;
  if (s === 'delivered') return module.exports.ORDER_DELIVERED;
  if (s === 'cancelled' || s === 'rejected') return module.exports.ORDER_CANCELLED;
  return module.exports.ORDER;
};

/** UI category for filters */
const typeToCategory = (type) => {
  const t = String(type || '').toLowerCase();
  if (t.includes('offer') || t.includes('coupon') || t.includes('flash') || t.includes('festival')) return 'Offers';
  if (t.includes('payment') || t.includes('refund') || t.includes('earning')) return 'Payments';
  if (
    t.includes('order') ||
    t.includes('delivery') ||
    t.includes('pickup') ||
    t.includes('preparing') ||
    t.includes('ready') ||
    t.includes('accepted')
  ) {
    return 'Orders';
  }
  if (t.includes('registration') || t.includes('account') || t.includes('review')) return 'Account';
  if (t.includes('admin') || t.includes('critical') || t.includes('health') || t.includes('volume')) {
    return 'Account';
  }
  return 'Orders';
};

module.exports.statusToCustomerType = statusToCustomerType;
module.exports.typeToCategory = typeToCategory;
