const { ok, fail } = require('../utils/respond');
const bi = require('../services/analyticsBiService');
const {
  exportBiCsv,
  exportBiExcelCsv,
  exportBiPdf,
} = require('../services/analyticsExportService');
const { runForecast } = require('../services/aiForecastService');
const { sendDailyPlatformReport } = require('../services/reportEmailService');

const daysFrom = (req) => req.query.days || req.body?.days || 30;

const adminDashboard = async (req, res) => {
  try {
    const data = await bi.getAdminBiDashboard({ days: daysFrom(req) });
    return ok(res, 'Admin BI dashboard', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminRealtime = async (req, res) => {
  try {
    const orders = await bi.getOrderAnalytics({ days: 1 });
    const revenue = await bi.getRevenueAnalytics({ days: 1 });
    return ok(res, 'Realtime sales', {
      ...orders.realtime,
      aov: revenue.summary?.aov,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminRevenue = async (req, res) => {
  try {
    return ok(res, 'Revenue analytics', await bi.getRevenueAnalytics({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminOrders = async (req, res) => {
  try {
    return ok(res, 'Order analytics', await bi.getOrderAnalytics({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminCustomerGrowth = async (req, res) => {
  try {
    return ok(res, 'Customer growth', await bi.getCustomerGrowth({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminRestaurantGrowth = async (req, res) => {
  try {
    return ok(res, 'Restaurant growth', await bi.getRestaurantGrowth({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminDelivery = async (req, res) => {
  try {
    return ok(res, 'Delivery performance', await bi.getDeliveryPerformance({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminFunnel = async (req, res) => {
  try {
    return ok(res, 'Conversion funnel', await bi.getConversionFunnel({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminRetention = async (req, res) => {
  try {
    return ok(res, 'Retention', await bi.getRetentionAnalysis({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminClv = async (req, res) => {
  try {
    return ok(res, 'CLV', await bi.getCustomerLifetimeValue({ limit: req.query.limit }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminAbandonment = async (req, res) => {
  try {
    return ok(res, 'Cart abandonment', await bi.getCartAbandonment({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPopularRestaurants = async (req, res) => {
  try {
    return ok(res, 'Popular restaurants', await bi.getPopularRestaurants({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPopularDishes = async (req, res) => {
  try {
    return ok(res, 'Popular dishes', await bi.getPopularDishes({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPeakHours = async (req, res) => {
  try {
    return ok(res, 'Peak hours', await bi.getPeakHours({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminCitySales = async (req, res) => {
  try {
    return ok(res, 'City-wise sales', await bi.getCityWiseSales({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminCoupons = async (req, res) => {
  try {
    return ok(res, 'Coupon performance', await bi.getCouponPerformance({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminCampaigns = async (req, res) => {
  try {
    return ok(res, 'Campaign analytics', await bi.getCampaignAnalytics({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminAnomalies = async (req, res) => {
  try {
    return ok(res, 'Anomalies', await bi.detectAnomalies({ lookback: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminInsights = async (req, res) => {
  try {
    return ok(res, 'AI insights', await bi.getAiInsights({ days: daysFrom(req) }));
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminForecast = async (req, res) => {
  try {
    const result = await runForecast({
      forecastType: req.query.type || req.body?.type || 'sales',
      horizonDays: req.query.horizon || req.body?.horizon_days || 7,
      marketId: req.query.market_id || req.body?.market_id || null,
    });
    return ok(res, 'Sales forecast', result);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminExport = async (req, res) => {
  try {
    const format = String(req.query.format || 'csv').toLowerCase();
    const data = await bi.getAdminBiDashboard({ days: daysFrom(req) });
    if (format === 'pdf') {
      const buf = await exportBiPdf(data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="foodiq-bi-${data.days}d.pdf"`
      );
      return res.send(buf);
    }
    if (format === 'xlsx' || format === 'excel') {
      const body = exportBiExcelCsv(data);
      res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="foodiq-bi-${data.days}d.xls"`
      );
      return res.send(body);
    }
    const body = exportBiCsv(data);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="foodiq-bi-${data.days}d.csv"`
    );
    return res.send(body);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminEmailReport = async (req, res) => {
  try {
    const result = await sendDailyPlatformReport();
    // Enrich email body path already handled; also attach insight summary in response
    const insights = await bi.getAiInsights({ days: 7 });
    return ok(res, 'Analytics email report sent', { ...result, insights });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const restaurantDashboard = async (req, res) => {
  try {
    const restaurantId =
      req.query.restaurant_id ||
      req.user?.restaurant_id ||
      req.partnerRestaurantId;
    // Resolve partner restaurant if needed
    let rid = restaurantId;
    if (!rid && req.user?.id) {
      const { pool } = require('../config/db');
      const { rows } = await pool.query(
        `SELECT id FROM restaurants WHERE owner_id = $1 LIMIT 1`,
        [req.user.id]
      );
      rid = rows[0]?.id;
    }
    if (!rid) return fail(res, 400, 'restaurant_id required');
    const data = await bi.getRestaurantBiDashboard({
      restaurantId: rid,
      days: daysFrom(req),
    });
    return ok(res, 'Restaurant analytics', data);
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Server Error', err);
  }
};

const deliveryDashboard = async (req, res) => {
  try {
    let partnerId = req.query.partner_id || null;
    if (!partnerId && req.user?.role === 'delivery_partner') {
      const { pool } = require('../config/db');
      const { rows } = await pool.query(
        `SELECT id FROM delivery_partners WHERE user_id = $1 LIMIT 1`,
        [req.user.id]
      );
      partnerId = rows[0]?.id || null;
    }
    const data = await bi.getDeliveryBiDashboard({
      partnerId,
      days: daysFrom(req),
    });
    return ok(res, 'Delivery analytics', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const customerDashboard = async (req, res) => {
  try {
    const data = await bi.getCustomerBiDashboard({
      userId: req.user.id,
      days: daysFrom(req),
    });
    return ok(res, 'Customer analytics', data);
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Server Error', err);
  }
};

module.exports = {
  adminDashboard,
  adminRealtime,
  adminRevenue,
  adminOrders,
  adminCustomerGrowth,
  adminRestaurantGrowth,
  adminDelivery,
  adminFunnel,
  adminRetention,
  adminClv,
  adminAbandonment,
  adminPopularRestaurants,
  adminPopularDishes,
  adminPeakHours,
  adminCitySales,
  adminCoupons,
  adminCampaigns,
  adminAnomalies,
  adminInsights,
  adminForecast,
  adminExport,
  adminEmailReport,
  restaurantDashboard,
  deliveryDashboard,
  customerDashboard,
};
