/**
 * Customer-facing order status notification copy.
 */
const TYPES = require('./notificationTypes');

const customerOrderNotification = (status, orderId, restaurantName = '') => {
  const s = String(status || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim();
  const shortId = String(orderId || '').slice(0, 8);
  const from = restaurantName ? ` from ${restaurantName}` : '';

  const map = {
    pending: {
      type: TYPES.ORDER_PLACED,
      title: 'Order Confirmed',
      message: `Your order #${shortId}${from} is confirmed.`,
    },
    confirmed: {
      type: TYPES.ORDER_PLACED,
      title: 'Order Confirmed',
      message: `Your order #${shortId}${from} is confirmed.`,
    },
    accepted: {
      type: TYPES.ORDER_ACCEPTED,
      title: 'Restaurant Accepted',
      message: `${restaurantName || 'The restaurant'} accepted your order #${shortId}.`,
    },
    preparing: {
      type: TYPES.ORDER_PREPARING,
      title: 'Preparing Food',
      message: `Your order #${shortId} is being prepared.`,
    },
    'ready for pickup': {
      type: TYPES.ORDER_READY,
      title: 'Order Ready',
      message: `Your order #${shortId} is ready for pickup.`,
    },
    'picked up': {
      type: TYPES.ORDER_PICKED_UP,
      title: 'Order Picked Up',
      message: `Your order #${shortId} has been picked up.`,
    },
    'on the way': {
      type: TYPES.OUT_FOR_DELIVERY,
      title: 'Out for Delivery',
      message: `Your order #${shortId} is out for delivery.`,
    },
    'out for delivery': {
      type: TYPES.OUT_FOR_DELIVERY,
      title: 'Out for Delivery',
      message: `Your order #${shortId} is out for delivery.`,
    },
    delivered: {
      type: TYPES.ORDER_DELIVERED,
      title: 'Delivered',
      message: `Your order #${shortId} has been delivered. Enjoy your meal!`,
    },
    cancelled: {
      type: TYPES.ORDER_CANCELLED,
      title: 'Order Cancelled',
      message: `Your order #${shortId} was cancelled.`,
    },
    rejected: {
      type: TYPES.ORDER_CANCELLED,
      title: 'Order Cancelled',
      message: `Your order #${shortId} was cancelled by the restaurant.`,
    },
  };

  if (map[s]) return map[s];

  return {
    type: TYPES.statusToCustomerType(status),
    title: 'Order Update',
    message: `Your order #${shortId} is now ${status}.`,
  };
};

module.exports = { customerOrderNotification };
