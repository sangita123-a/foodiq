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
      weeklyRevenue: data.weekly_revenue,
      monthlyRevenue: data.monthly_revenue,
      yearlyRevenue: data.yearly_revenue,
      activeDeliveryPartners: data.active_delivery_partners,
      totalDeliveryPartners: data.total_delivery_partners,
      pendingRestaurantApprovals: data.pending_restaurant_approvals,
      pendingPartnerApprovals: data.pending_partner_approvals,
      activeOrders: data.active_orders,
      deliveredOrders: data.delivered_orders,
      cancelledOrders: data.cancelled_orders,
      totalMenuItems: data.total_menu_items,
      avgDeliveryTimeMinutes: data.avg_delivery_time_minutes,
      customerSatisfaction: data.customer_satisfaction,
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
    try {
      const { sendMarketingByType } = require('../services/pushNotificationService');
      const couponType = req.body.coupon_type || 'coupon_alert';
      const marketingType =
        couponType === 'festival' ? 'festival_discount' : couponType === 'first_order' ? 'new_offer' : 'coupon_alert';
      await sendMarketingByType(marketingType, {
        title: `New Coupon: ${data.code}`,
        message: req.body.title || `Use code ${data.code} on your next order!`,
        link: '/coupons',
      });
    } catch (pushErr) {
      console.warn('[admin] coupon push skipped:', pushErr.message);
    }
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

const getCouponAnalytics = async (req, res) => {
  try {
    ok(res, 'Coupon analytics retrieved', await admin.getCouponAnalytics());
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
    const {
      audience = 'all',
      title,
      message,
      user_ids,
      city,
      restaurant_id,
      type,
      link,
      schedule_at,
    } = req.body;
    if (!title || !message) return fail(res, 400, 'Title and message are required');
    const data = await admin.broadcastNotification({
      audience,
      title,
      message,
      user_ids,
      city,
      restaurant_id,
      type,
      link,
      schedule_at,
      created_by: req.user.id,
    });
    ok(res, data.scheduled ? 'Notification scheduled' : 'Notifications sent', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postPushCampaign = async (req, res) => {
  try {
    const data = await admin.broadcastNotification({
      ...req.body,
      created_by: req.user.id,
    });
    ok(res, data.scheduled ? 'Push notification scheduled' : 'Push notifications sent', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getScheduledPushCampaigns = async (req, res) => {
  try {
    const { rows } = await require('../config/db').pool.query(
      `SELECT id, name, audience, subject, message, status, scheduled_at, sent_count, created_at
       FROM marketing_campaigns
       WHERE channel = 'push'
       ORDER BY created_at DESC
       LIMIT 50`
    );
    ok(res, 'Scheduled push campaigns retrieved', rows);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getPushTargetOptions = async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const [cities, restaurants] = await Promise.all([
      pool.query(
        `SELECT DISTINCT TRIM(city) AS city FROM addresses
         WHERE city IS NOT NULL AND TRIM(city) <> ''
         ORDER BY city LIMIT 100`
      ),
      pool.query(
        `SELECT id, name, city FROM restaurants ORDER BY name LIMIT 200`
      ),
    ]);
    ok(res, 'Push target options retrieved', {
      cities: cities.rows.map((r) => r.city),
      restaurants: restaurants.rows,
    });
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

const getLiveDeliveries = async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const { getLiveDeliveries: fetchLive, getDelayedOrders } = require('../services/trackingService');
    const live = await fetchLive();
    const delayed = await getDelayedOrders();
    const cancelled = await pool.query(
      `SELECT o.id, o.status, o.created_at, r.name AS restaurant_name
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       WHERE LOWER(o.status) IN ('cancelled', 'rejected')
         AND o.created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
       ORDER BY o.created_at DESC
       LIMIT 30`
    );
    ok(res, 'Live deliveries retrieved', {
      live_deliveries: live,
      delayed_orders: delayed,
      cancelled_orders: cancelled.rows,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getStaff = async (req, res) => {
  try {
    ok(res, 'Admin staff retrieved', await admin.listAdminStaff());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postStaff = async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const { email, password, full_name, phone_number, admin_role } = req.body;
    if (!email || !password || !full_name) {
      return fail(res, 400, 'Email, password, and name are required');
    }
    const password_hash = await bcrypt.hash(password, 12);
    const data = await admin.createAdminStaff({
      email: String(email).trim().toLowerCase(),
      password_hash,
      full_name,
      phone_number,
      admin_role: admin_role || 'admin',
    });
    ok(res, 'Admin staff created', data);
  } catch (error) {
    if (error.code === '23505') return fail(res, 409, 'Email already exists');
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchStaff = async (req, res) => {
  try {
    let password_hash;
    if (req.body.password) {
      const bcrypt = require('bcrypt');
      password_hash = await bcrypt.hash(req.body.password, 12);
    }
    const data = await admin.updateAdminStaff(req.params.id, {
      ...req.body,
      password_hash,
    });
    if (!data) return fail(res, 404, 'Staff member not found');
    ok(res, 'Staff updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeStaff = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return fail(res, 400, 'Cannot delete your own account');
    }
    const data = await admin.deleteAdminStaff(req.params.id);
    if (!data) return fail(res, 404, 'Staff member not found');
    ok(res, 'Staff deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const userWallet = async (req, res) => {
  try {
    ok(res, 'User wallet retrieved', await admin.getUserWallet(req.params.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const userReferrals = async (req, res) => {
  try {
    ok(res, 'User referrals retrieved', await admin.getUserReferrals(req.params.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getCms = async (req, res) => {
  try {
    ok(res, 'CMS content retrieved', await admin.listCmsContent());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const putCms = async (req, res) => {
  try {
    const data = await admin.upsertCmsContent(req.body);
    ok(res, 'CMS content saved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeCms = async (req, res) => {
  try {
    const data = await admin.deleteCmsContent(req.params.key);
    if (!data) return fail(res, 404, 'Content not found');
    ok(res, 'CMS content deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getMarketing = async (req, res) => {
  try {
    const campaigns = await admin.listMarketingCampaigns({
      channel: req.query.channel || '',
      status: req.query.status || '',
    });
    const seasonal = await admin.listSeasonalCampaigns();
    ok(res, 'Marketing data retrieved', { campaigns, seasonal });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postMarketing = async (req, res) => {
  try {
    const data = await admin.createMarketingCampaign({
      ...req.body,
      created_by: req.user.id,
    });
    ok(res, 'Campaign created', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchMarketing = async (req, res) => {
  try {
    const data = await admin.updateMarketingCampaign(req.params.id, req.body);
    if (!data) return fail(res, 404, 'Campaign not found');
    ok(res, 'Campaign updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postSeasonal = async (req, res) => {
  try {
    ok(res, 'Seasonal campaign saved', await admin.upsertSeasonalCampaign(req.body));
  } catch (error) {
    if (error.code === '23505') return fail(res, 409, 'Slug already exists');
    fail(res, 500, 'Server Error', error.message);
  }
};

const sendMarketingCampaign = async (req, res) => {
  try {
    const campaign = await admin.updateMarketingCampaign(req.params.id, { status: 'sending' });
    if (!campaign) return fail(res, 404, 'Campaign not found');

    let sent = 0;
    if (campaign.channel === 'push') {
      const result = await admin.broadcastNotification({
        audience: campaign.audience || 'all',
        title: campaign.subject || campaign.name,
        message: campaign.message,
      });
      sent = result.sent;
    } else if (campaign.channel === 'email' || campaign.channel === 'sms') {
      const messaging = require('../controllers/messagingController');
      const fakeReq = {
        body: {
          audience: campaign.audience || 'all',
          subject: campaign.subject || campaign.name,
          message: campaign.message,
          template: 'promo',
        },
        user: req.user,
      };
      const fakeRes = {
        json: (payload) => payload,
        status: () => ({ json: () => ({}) }),
      };
      if (campaign.channel === 'email') {
        await messaging.postPromo(fakeReq, fakeRes);
      } else {
        await messaging.postPromo(fakeReq, fakeRes);
      }
      sent = 1;
    }

    const updated = await admin.updateMarketingCampaign(req.params.id, {
      status: 'sent',
      sent_count: sent,
    });
    ok(res, 'Campaign sent', updated);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSecurity = async (req, res) => {
  try {
    const { ADMIN_ROLES, ROLE_LABELS, ROLE_PERMISSIONS } = require('../utils/adminPermissions');
    const loginLogs = await admin.getAdminLoginLogs({ limit: 100 });
    const auditLogs = await admin.getAuditLogs({ limit: 100, category: req.query.category || '' });
    ok(res, 'Security data retrieved', {
      roles: ADMIN_ROLES.map((r) => ({ id: r, label: ROLE_LABELS[r], permissions: ROLE_PERMISSIONS[r] })),
      login_logs: loginLogs,
      audit_logs: auditLogs,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getPaymentReportHandler = async (req, res) => {
  try {
    ok(res, 'Payment report retrieved', await admin.getPaymentReport(req.query));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getDeliveryReportHandler = async (req, res) => {
  try {
    ok(res, 'Delivery report retrieved', await admin.getDeliveryReport());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSettlements = async (req, res) => {
  try {
    ok(res, 'Settlements retrieved', await admin.getRestaurantSettlements());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const exportReport = async (req, res) => {
  try {
    const { type = 'sales', format = 'json', start_date, end_date } = req.query;
    let rows = [];
    if (type === 'sales' || type === 'payment') {
      rows = await admin.getPaymentReport({ start_date, end_date, group_by: 'day' });
    } else if (type === 'delivery') {
      rows = await admin.getDeliveryReport();
    } else if (type === 'restaurants') {
      rows = await admin.listRestaurants({});
    } else if (type === 'customers') {
      rows = await admin.listUsers({ role: 'customer' });
    } else if (type === 'orders') {
      rows = await admin.listOrders({});
    }

    if (format === 'csv') {
      if (!rows.length) {
        res.setHeader('Content-Type', 'text/csv');
        return res.send('No data');
      }
      const keys = Object.keys(rows[0]);
      const csv = [keys.join(',')].concat(
        rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      return res.send(csv);
    }

    ok(res, 'Report exported', { type, rows, count: rows.length });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getLoyaltyOverview = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const [analytics, rules, tiers] = await Promise.all([
      loyaltyModel.getAnalytics(),
      loyaltyModel.listRules(),
      loyaltyModel.listTiers(),
    ]);
    ok(res, 'Loyalty overview retrieved', { analytics, rules, tiers });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchLoyaltyRule = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const data = await loyaltyModel.updateRule(req.params.key, req.body);
    if (!data) return fail(res, 404, 'Rule not found');
    ok(res, 'Loyalty rule updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchLoyaltyTier = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const data = await loyaltyModel.updateTier(req.params.slug, req.body);
    if (!data) return fail(res, 404, 'Tier not found');
    ok(res, 'Membership tier updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postLoyaltyAdjust = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const { user_id, points, reason } = req.body;
    if (!user_id || !points) return fail(res, 400, 'user_id and points are required');
    const result = await loyaltyModel.adminAdjustPoints(user_id, Number(points), reason, req.user.id);
    ok(res, 'Points adjusted', result);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postLoyaltyExpire = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const result = await loyaltyModel.expirePoints(req.body.user_id || null);
    ok(res, 'Expired points processed', result);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postLoyaltyCampaign = async (req, res) => {
  try {
    const loyaltyEngine = require('../services/loyaltyEngine');
    const { user_ids = [], points, campaign_id } = req.body;
    if (!Array.isArray(user_ids) || !user_ids.length) {
      return fail(res, 400, 'user_ids array required');
    }
    let credited = 0;
    for (const uid of user_ids) {
      const r = await loyaltyEngine.creditCampaign(uid, campaign_id || `campaign:${Date.now()}`, points);
      if (r && !r.duplicate) credited += 1;
    }
    ok(res, 'Campaign rewards credited', { credited, total: user_ids.length });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportCenter = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    const analytics = await helpCenter.getAnalytics();
    ok(res, 'Support analytics retrieved', analytics);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportTickets = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    ok(res, 'Tickets retrieved', await helpCenter.listAllTickets({
      status: req.query.status || '',
      category: req.query.category || '',
    }));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const assignSupportTicket = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    const ticket = await helpCenter.assignTicket(req.params.id, req.body.agent_id || req.user.id);
    if (!ticket) return fail(res, 404, 'Ticket not found');
    ok(res, 'Ticket assigned', ticket);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const resolveSupportTicket = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    const ticket = await helpCenter.resolveTicket(req.params.id, req.body.admin_notes);
    if (!ticket) return fail(res, 404, 'Ticket not found');
    ok(res, 'Ticket resolved', ticket);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportLiveChats = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    ok(res, 'Live chats retrieved', await helpCenter.listActiveChats());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportLiveChatDetail = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    const chat = await helpCenter.getLiveChat(req.params.id);
    if (!chat) return fail(res, 404, 'Chat not found');
    const messages = await helpCenter.getLiveMessages(req.params.id);
    ok(res, 'Live chat detail', { chat, messages });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postSupportAgentMessage = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    await helpCenter.assignLiveChat(req.params.id, req.user.id);
    const msg = await helpCenter.addLiveMessage({
      chatId: req.params.id,
      senderId: req.user.id,
      senderRole: 'agent',
      message: req.body.message,
      attachmentUrl: req.body.attachment_url,
      attachmentType: req.body.attachment_type,
    });
    try {
      const { getIO } = require('../socket/emitters');
      getIO()?.to(`support:${req.params.id}`).emit('supportMessage', msg);
    } catch {
      /* optional */
    }
    ok(res, 'Message sent', msg, 201);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportAiSessions = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    ok(res, 'AI sessions retrieved', await helpCenter.listAiSessions({ limit: 50 }));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getAdminInventory = async (req, res) => {
  try {
    const inventory = require('../models/inventoryModel');
    ok(res, 'Inventory health overview', await inventory.adminInventoryOverview());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getDashboard,
  getLiveDeliveries,
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
  getCouponAnalytics,
  getAnalytics,
  postBroadcast,
  postPushCampaign,
  getScheduledPushCampaigns,
  getPushTargetOptions,
  getSettings,
  putSettings,
  getSalesReports,
  getOrderReports,
  getUserReports,
  getRestaurantReports,
  getStaff,
  postStaff,
  patchStaff,
  removeStaff,
  userWallet,
  userReferrals,
  getCms,
  putCms,
  removeCms,
  getMarketing,
  postMarketing,
  patchMarketing,
  postSeasonal,
  sendMarketingCampaign,
  getSecurity,
  getPaymentReportHandler,
  getDeliveryReportHandler,
  getSettlements,
  exportReport,
  getLoyaltyOverview,
  patchLoyaltyRule,
  patchLoyaltyTier,
  postLoyaltyAdjust,
  postLoyaltyExpire,
  postLoyaltyCampaign,
  getSupportCenter,
  getSupportTickets,
  assignSupportTicket,
  resolveSupportTicket,
  getSupportLiveChats,
  getSupportLiveChatDetail,
  postSupportAgentMessage,
  getSupportAiSessions,
  getAdminInventory,
};
