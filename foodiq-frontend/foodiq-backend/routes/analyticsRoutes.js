const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const deliveryRoles = ['delivery_partner', 'driver', 'admin', 'super_admin'];
const adminRoles = ['admin', 'super_admin'];

// ── Delivery Partner APIs ──────────────────────────────────────────────────
router.get(
  '/delivery/analytics',
  verifyToken,
  requireRole(deliveryRoles),
  AnalyticsController.getDeliveryAnalytics
);

router.get(
  '/delivery/analytics/performance',
  verifyToken,
  requireRole(deliveryRoles),
  AnalyticsController.getDeliveryPerformance
);

router.get(
  '/delivery/analytics/history',
  verifyToken,
  requireRole(deliveryRoles),
  AnalyticsController.getDeliveryHistory
);

router.get(
  '/delivery/reports/daily',
  verifyToken,
  requireRole(deliveryRoles),
  AnalyticsController.getDailyReport
);

router.get(
  '/delivery/reports/weekly',
  verifyToken,
  requireRole(deliveryRoles),
  AnalyticsController.getWeeklyReport
);

router.get(
  '/delivery/reports/monthly',
  verifyToken,
  requireRole(deliveryRoles),
  AnalyticsController.getMonthlyReport
);

// ── Admin APIs ─────────────────────────────────────────────────────────────
router.get(
  '/admin/delivery-analytics',
  verifyToken,
  requireRole(adminRoles),
  AnalyticsController.getAdminDeliveryAnalytics
);

router.get(
  '/admin/delivery-performance',
  verifyToken,
  requireRole(adminRoles),
  AnalyticsController.getAdminDeliveryPerformance
);

module.exports = router;
