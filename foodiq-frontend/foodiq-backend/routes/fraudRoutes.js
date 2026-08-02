const express = require('express');
const router = express.Router();
const FraudController = require('../controllers/fraudController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// --- Delivery Partner Endpoints ---
router.get(
  '/delivery/fraud/history',
  verifyToken,
  requireRole(['delivery_partner', 'admin']),
  FraudController.getDeliveryHistory
);

router.get(
  '/delivery/fraud/status',
  verifyToken,
  requireRole(['delivery_partner', 'admin']),
  FraudController.getDeliveryStatus
);

// --- Admin Endpoints ---
router.get(
  '/admin/fraud',
  verifyToken,
  requireRole(['admin', 'super_admin']),
  FraudController.getAdminFraudCases
);

router.get(
  '/admin/fraud/:id',
  verifyToken,
  requireRole(['admin', 'super_admin']),
  FraudController.getAdminFraudCaseById
);

router.patch(
  '/admin/fraud/:id/review',
  verifyToken,
  requireRole(['admin', 'super_admin']),
  FraudController.reviewAdminFraudCase
);

router.patch(
  '/admin/fraud/:id/resolve',
  verifyToken,
  requireRole(['admin', 'super_admin']),
  FraudController.resolveAdminFraudCase
);

router.patch(
  '/admin/fraud/rules',
  verifyToken,
  requireRole(['admin', 'super_admin']),
  FraudController.updateAdminFraudRules
);

module.exports = router;
