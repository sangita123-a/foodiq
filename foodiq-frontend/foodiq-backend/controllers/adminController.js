const admin = require('../models/adminModel');

const ok = (res, message, data) => res.json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const getDashboard = async (req, res) => {
  try {
    const data = await admin.getDashboardStats();
    ok(res, 'Dashboard stats retrieved', {
      totalUsers: data.total_users,
      totalRestaurants: data.total_restaurants,
      totalOrders: data.total_orders,
      totalRevenue: data.total_revenue,
      todaysOrders: data.todays_orders,
      todaysRevenue: data.todays_revenue,
      activeDeliveryPartners: data.active_delivery_partners,
      pendingRestaurantApprovals: data.pending_restaurant_approvals,
      pendingPartnerApprovals: data.pending_partner_approvals,
      activeOrders: data.active_orders,
      deliveredOrders: data.delivered_orders,
      cancelledOrders: data.cancelled_orders,
      weekly: data.weekly,
      monthly: data.monthly,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getRestaurants = async (req, res) => {
  try {
    const data = await admin.listRestaurants({
      search: req.query.search || '',
      status: req.query.status || '',
    });
    ok(res, 'Restaurants retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchRestaurant = async (req, res) => {
  try {
    const data = await admin.updateRestaurant(req.params.id, req.body);
    if (!data) return fail(res, 404, 'Restaurant not found');
    if (req.body.approval_status || typeof req.body.is_active === 'boolean') {
      try {
        const { sendRestaurantStatusEmail } = require('../services/reportEmailService');
        const status =
          req.body.approval_status ||
          (req.body.is_active === false ? 'suspended' : 'approved');
        await sendRestaurantStatusEmail(req.params.id, status);
      } catch (err) {
        console.warn('[admin] restaurant status email skipped', err.message);
      }
    }
    ok(res, 'Restaurant updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeRestaurant = async (req, res) => {
  try {
    const data = await admin.deleteRestaurant(req.params.id);
    if (!data) return fail(res, 404, 'Restaurant not found');
    ok(res, 'Restaurant deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const restaurantPerformance = async (req, res) => {
  try {
    const data = await admin.getRestaurantPerformance(req.params.id);
    ok(res, 'Restaurant performance retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getUsers = async (req, res) => {
  try {
    const data = await admin.listUsers({
      search: req.query.search || '',
      role: req.query.role || 'customer',
      suspended: req.query.suspended || '',
    });
    ok(res, 'Users retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchUser = async (req, res) => {
  try {
    const data = await admin.updateUser(req.params.id, req.body);
    if (!data) return fail(res, 404, 'User not found or cannot modify admin');
    ok(res, 'User updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeUser = async (req, res) => {
  try {
    const data = await admin.deleteUser(req.params.id);
    if (!data) return fail(res, 404, 'User not found or cannot delete admin');
    ok(res, 'User deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const userOrders = async (req, res) => {
  try {
    const data = await admin.getUserOrders(req.params.id);
    ok(res, 'User orders retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getPartners = async (req, res) => {
  try {
    const data = await admin.listDeliveryPartners({
      search: req.query.search || '',
      status: req.query.status || '',
    });
    ok(res, 'Delivery partners retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchPartner = async (req, res) => {
  try {
    const data = await admin.updateDeliveryPartner(req.params.id, req.body);
    if (!data) return fail(res, 404, 'Delivery partner not found');
    if (
      req.body.approval_status &&
      String(req.body.approval_status).toLowerCase() === 'approved'
    ) {
      try {
        const { sendDeliveryApprovalEmail } = require('../services/reportEmailService');
        await sendDeliveryApprovalEmail(data.user_id);
      } catch (err) {
        console.warn('[admin] delivery approval email skipped', err.message);
      }
    }
    ok(res, 'Delivery partner updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getOrders = async (req, res) => {
  try {
    const data = await admin.listOrders({
      search: req.query.search || '',
      status: req.query.status || '',
    });
    ok(res, 'Orders retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getOrder = async (req, res) => {
  try {
    const data = await admin.getOrderDetails(req.params.id);
    if (!data) return fail(res, 404, 'Order not found');
    ok(res, 'Order retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchOrder = async (req, res) => {
  try {
    const data = await admin.updateOrderAdmin(req.params.id, req.body);
    if (!data) return fail(res, 404, 'Order not found');

    if (req.body?.status) {
      try {
        const { emitOrderStatus } = require('../socket/emitters');
        emitOrderStatus(
          {
            id: data.id || req.params.id,
            status: req.body.status,
            user_id: data.user_id,
            restaurant_id: data.restaurant_id,
            total_amount: data.total_amount,
          },
          { source: 'admin' }
        );
      } catch (socketErr) {
        console.warn('[admin] socket emit skipped:', socketErr.message);
      }
    }

    ok(res, 'Order updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const refund = async (req, res) => {
  try {
    const { processRefund } = require('./paymentController');
    const data = await processRefund({
      orderId: req.params.id,
      amount: req.body?.amount,
      reason: req.body?.reason || 'Admin refund',
      initiatedBy: req.user.id,
      type: req.body?.type || (req.body?.amount ? 'partial' : 'full'),
      cancelOrder: req.body?.cancel_order !== false,
    });
    ok(res, 'Order refunded', data);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error');
  }
};

const getPaymentsOverview = async (req, res) => {
  try {
    const {
      adminPaymentOverview,
    } = require('./paymentController');
    return adminPaymentOverview(req, res);
  } catch (error) {
    fail(res, 500, error.message);
  }
};

const getPaymentTransactions = async (req, res) => {
  try {
    const { adminListTransactions } = require('./paymentController');
    return adminListTransactions(req, res);
  } catch (error) {
    fail(res, 500, error.message);
  }
};

const getRefunds = async (req, res) => {
  try {
    const { adminListRefunds } = require('./paymentController');
    return adminListRefunds(req, res);
  } catch (error) {
    fail(res, 500, error.message);
  }
};

const postRefund = async (req, res) => {
  try {
    const { adminCreateRefund } = require('./paymentController');
    return adminCreateRefund(req, res);
  } catch (error) {
    fail(res, 500, error.message);
  }
};

const getMenu = async (req, res) => {
  try {
    const data = await admin.listMenuItems({
      search: req.query.search || '',
      restaurant_id: req.query.restaurant_id || '',
    });
    ok(res, 'Menu items retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeMenuItem = async (req, res) => {
  try {
    const data = await admin.deleteMenuItem(req.params.id);
    if (!data) return fail(res, 404, 'Menu item not found');
    ok(res, 'Menu item deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getCategories = async (req, res) => {
  try {
    const data = await admin.listCategories();
    ok(res, 'Categories retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getCoupons = async (req, res) => {
  try {
    ok(res, 'Coupons retrieved', await admin.listCoupons());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postCoupon = async (req, res) => {
  try {
    if (!req.body.code || req.body.discount_amount == null) {
      return fail(res, 400, 'Code and discount_amount are required');
    }
    const data = await admin.createCoupon(req.body);
    res.status(201).json({ success: true, message: 'Coupon created', data });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchCoupon = async (req, res) => {
  try {
    const data = await admin.updateCoupon(req.params.id, req.body);
    if (!data) return fail(res, 404, 'Coupon not found');
    ok(res, 'Coupon updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeCoupon = async (req, res) => {
  try {
    const data = await admin.deleteCoupon(req.params.id);
    if (!data) return fail(res, 404, 'Coupon not found');
    ok(res, 'Coupon deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getAnalytics = async (req, res) => {
  try {
    ok(res, 'Analytics retrieved', await admin.getAnalytics());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postBroadcast = async (req, res) => {
  try {
    const { audience = 'all', title, message } = req.body;
    if (!title || !message) return fail(res, 400, 'Title and message are required');
    const data = await admin.broadcastNotification({ audience, title, message });
    ok(res, 'Notifications sent', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSettings = async (req, res) => {
  try {
    ok(res, 'Settings retrieved', await admin.getSettings());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const putSettings = async (req, res) => {
  try {
    ok(res, 'Settings updated', await admin.updateSettings(req.body));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

// Legacy report endpoints
const getReportTemplate = async (req, res, queryField, table, dateCol) => {
  try {
    const { pool } = require('../config/db');
    const { range = 'monthly', start_date, end_date } = req.query;
    let dateTrunc = 'day';
    if (range === 'monthly') dateTrunc = 'month';
    else if (range === 'weekly') dateTrunc = 'week';

    let query = `
      SELECT date_trunc($1, ${dateCol}) as period, ${queryField} as total
      FROM ${table}
    `;
    const values = [dateTrunc];
    const conditions = [];
    if (table === 'orders' && queryField.includes('SUM')) {
      conditions.push("status = 'Delivered'");
    }
    if (start_date && end_date) {
      conditions.push(`CAST(${dateCol} AS DATE) >= $2`);
      conditions.push(`CAST(${dateCol} AS DATE) <= $3`);
      values.push(start_date, end_date);
    }
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` GROUP BY period ORDER BY period DESC LIMIT 30`;
    const { rows } = await pool.query(query, values);
    ok(res, 'Report retrieved', rows);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSalesReports = (req, res) => getReportTemplate(req, res, 'SUM(total_amount)', 'orders', 'created_at');
const getOrderReports = (req, res) => getReportTemplate(req, res, 'COUNT(*)', 'orders', 'created_at');
const getUserReports = (req, res) => getReportTemplate(req, res, 'COUNT(*)', 'users', 'created_at');
const getRestaurantReports = (req, res) => getReportTemplate(req, res, 'COUNT(*)', 'restaurants', 'created_at');

module.exports = {
  getDashboard,
  getRestaurants,
  patchRestaurant,
  removeRestaurant,
  restaurantPerformance,
  getUsers,
  patchUser,
  removeUser,
  userOrders,
  getPartners,
  patchPartner,
  getOrders,
  getOrder,
  patchOrder,
  refund,
  getPaymentsOverview,
  getPaymentTransactions,
  getRefunds,
  postRefund,
  getMenu,
  removeMenuItem,
  getCategories,
  getCoupons,
  postCoupon,
  patchCoupon,
  removeCoupon,
  getAnalytics,
  postBroadcast,
  getSettings,
  putSettings,
  getSalesReports,
  getOrderReports,
  getUserReports,
  getRestaurantReports,
};
