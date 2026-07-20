const { getOrders, getOrderById, updateOrderStatus } = require('../models/orderModel');
const { checkout } = require('./checkoutController');
const { pool } = require('../config/db');
const { canManageOrder, canUpdateOrderStatus } = require('../utils/orderAuth');
const { fail, ok } = require('../utils/respond');

const placeOrder = checkout;

const getAllOrders = async (req, res) => {
  try {
    const orders = await getOrders(req.user.id, req.user.role);
    return ok(res, 'Orders retrieved', orders);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return fail(res, 404, 'Order not found');

    const allowed = await canManageOrder(req.user, order);
    if (!allowed) return fail(res, 403, 'Not authorized');

    return ok(res, 'Order retrieved', order);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return fail(res, 404, 'Order not found');

    const isCustomerOwner =
      req.user.role === 'customer' && order.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isRestaurantOwner =
      req.user.role === 'restaurant_owner' && (await canManageOrder(req.user, order));

    if (!isCustomerOwner && !isAdmin && !isRestaurantOwner) {
      return fail(res, 403, 'Not authorized');
    }

    if (order.status !== 'Pending' && order.status !== 'pending') {
      return fail(res, 400, 'Order cannot be cancelled at this stage');
    }

    const updated = await updateOrderStatus(req.params.id, 'Cancelled');
    return ok(res, 'Order cancelled', updated);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

const CUSTOMER_STATUSES = new Set([]); // customers cannot set status
const PARTNER_STATUSES = new Set([
  'Accepted',
  'Preparing',
  'Ready for Pickup',
  'Cancelled',
]);
const DELIVERY_STATUSES = new Set([
  'Picked Up',
  'On The Way',
  'Delivered',
]);
const ALL_STATUSES = [
  'Pending',
  'Accepted',
  'Preparing',
  'Ready for Pickup',
  'Picked Up',
  'On The Way',
  'Delivered',
  'Cancelled',
];

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALL_STATUSES.includes(status)) {
      return fail(res, 400, 'Invalid status');
    }

    const order = await getOrderById(req.params.id);
    if (!order) return fail(res, 404, 'Order not found');

    const allowed = await canUpdateOrderStatus(req.user, order);
    if (!allowed) return fail(res, 403, 'Not authorized');

    if (req.user.role === 'restaurant_owner' && !PARTNER_STATUSES.has(status)) {
      return fail(res, 403, 'Status not allowed for restaurant partners');
    }
    if (req.user.role === 'delivery_partner' && !DELIVERY_STATUSES.has(status)) {
      return fail(res, 403, 'Status not allowed for delivery partners');
    }
    if (req.user.role === 'customer') {
      return fail(res, 403, 'Not authorized');
    }

    const updated = await updateOrderStatus(req.params.id, status);

    if (status === 'Delivered') {
      try {
        const loyaltyEngine = require('../services/loyaltyEngine');
        await loyaltyEngine.creditForOrderDelivered(updated);
      } catch (loyaltyErr) {
        console.warn('[order] loyalty credit skipped:', loyaltyErr.message);
      }
    }

    return ok(res, 'Order status updated', updated);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

module.exports = { placeOrder, getAllOrders, getSingleOrder, cancelOrder, updateStatus };
