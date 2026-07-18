const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');
const {
  buildReviewAnalytics,
  generateMaintenanceReport,
  sendWeeklyReviewReport,
  listMaintenanceReports,
} = require('../services/maintenanceReportService');

const getReviewAnalytics = async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);
    const data = await buildReviewAnalytics(days);
    return ok(res, 'Review analytics', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getOrGenerateReport = async (req, res) => {
  try {
    const period = req.query.period === 'weekly' ? 'weekly' : 'monthly';
    const persist = String(req.query.persist || 'true').toLowerCase() !== 'false';
    const report = await generateMaintenanceReport({
      period,
      createdBy: req.user.id,
      persist,
    });
    return ok(res, 'Maintenance report', report);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const listReports = async (req, res) => {
  try {
    const rows = await listMaintenanceReports({
      period: req.query.period || null,
      limit: req.query.limit,
    });
    return ok(res, 'Maintenance reports', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const sendWeekly = async (req, res) => {
  try {
    const result = await sendWeeklyReviewReport();
    return ok(res, 'Weekly review report sent', result);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const healthSummary = async (req, res) => {
  try {
    const [db, errors, bugs, reviews] = await Promise.all([
      pool.query('SELECT 1 AS ok'),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM error_events
         WHERE created_at >= NOW() - INTERVAL '7 days'`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM bug_reports
         WHERE status IN ('open', 'triaging', 'in_progress')`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM reviews
         WHERE created_at >= NOW() - INTERVAL '7 days'`
      ),
    ]);
    return ok(res, 'Health summary', {
      database: db.rows[0]?.ok === 1 ? 'up' : 'down',
      errors_7d: errors.rows[0]?.c || 0,
      open_bugs: bugs.rows[0]?.c || 0,
      reviews_7d: reviews.rows[0]?.c || 0,
      app_version: '2.0.0',
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getV2Adoption = async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM order_feedback
            WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')) AS order_feedback,
         (SELECT COUNT(*)::int FROM delivery_reviews
            WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')) AS delivery_reviews,
         (SELECT COUNT(*)::int FROM reviews
            WHERE order_id IS NOT NULL
              AND created_at >= NOW() - ($1::int * INTERVAL '1 day')) AS restaurant_reviews_from_orders,
         (SELECT COUNT(*)::int FROM user_feedback
            WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')) AS product_feedback,
         (SELECT COUNT(*)::int FROM bug_reports
            WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')) AS bug_reports,
         (SELECT COUNT(*)::int FROM support_tickets
            WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')) AS support_tickets,
         (SELECT COUNT(*)::int FROM orders
            WHERE status = 'Delivered'
              AND created_at >= NOW() - ($1::int * INTERVAL '1 day')) AS delivered_orders,
         (SELECT COUNT(*)::int FROM maintenance_reports) AS maintenance_reports_total`,
      [days]
    );
    const r = rows[0] || {};
    const delivered = Number(r.delivered_orders) || 0;
    const feedbackRate =
      delivered > 0
        ? Math.round((Number(r.order_feedback) / delivered) * 1000) / 10
        : 0;
    return ok(res, 'V2.0 feature adoption', {
      days,
      app_version: '2.0.0',
      metrics: r,
      feedback_rate_pct: feedbackRate,
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = {
  getReviewAnalytics,
  getOrGenerateReport,
  listReports,
  sendWeekly,
  healthSummary,
  getV2Adoption,
};
