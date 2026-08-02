const express = require('express');
const router = express.Router();
const c = require('../controllers/emergencyController');
const v = require('../validators/emergencyValidator');
const { protectDelivery } = require('../middleware/deliveryAuth');
const { protect, authorize } = require('../middleware/authMiddleware');
const { requirePermission } = require('../utils/adminPermissions');
const rateLimit = require('express-rate-limit');

// Rate limiter specifically for SOS Creation to prevent abuse (e.g. max 5 requests / 15 minutes)
const sosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many SOS requests. Please wait before submitting another.',
    error: { code: 'RATE_LIMIT' },
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
 * DELIVERY PARTNER SOS ROUTES (/api/delivery/emergency)
 * ───────────────────────────────────────────────────────────────────────────── */

// POST /api/delivery/emergency - Create SOS
router.post('/emergency', protectDelivery, sosLimiter, v.validateCreateEmergency, c.createEmergency);

// GET /api/delivery/emergency/active - Check current active emergency
router.get('/emergency/active', protectDelivery, c.getActiveEmergency);

// GET /api/delivery/emergency/history - List historical emergencies
router.get('/emergency/history', protectDelivery, c.getEmergencyHistory);

// PATCH /api/delivery/emergency/cancel - Cancel active emergency
router.patch('/emergency/cancel', protectDelivery, c.cancelEmergency);

/* ─────────────────────────────────────────────────────────────────────────────
 * ADMIN SOS MANAGEMENT ROUTES (/api/admin/emergencies)
 * ───────────────────────────────────────────────────────────────────────────── */

// GET /api/admin/emergencies - List emergencies with search, filters & pagination
router.get('/admin/emergencies', protect, authorize('admin'), requirePermission('delivery', 'live'), c.getAdminEmergencies);

// GET /api/admin/emergencies/:id - View full details of emergency
router.get('/admin/emergencies/:id', protect, authorize('admin'), requirePermission('delivery', 'live'), c.getAdminEmergencyById);

// PATCH /api/admin/emergencies/:id/resolve - Admin resolves emergency
router.patch('/admin/emergencies/:id/resolve', protect, authorize('admin'), requirePermission('delivery', 'live'), c.resolveAdminEmergency);

// PATCH /api/admin/emergencies/:id/escalate - Admin escalates emergency
router.patch('/admin/emergencies/:id/escalate', protect, authorize('admin'), requirePermission('delivery', 'live'), c.escalateAdminEmergency);

module.exports = router;
