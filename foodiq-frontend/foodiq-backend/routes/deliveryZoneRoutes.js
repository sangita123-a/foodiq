const express = require('express');
const router = express.Router();
const c = require('../controllers/deliveryZoneController');
const v = require('../validators/deliveryZoneValidator');
const { protectDelivery } = require('../middleware/deliveryAuth');
const { protect, authorize } = require('../middleware/authMiddleware');

/* ─────────────────────────────────────────────────────────────────────────────
 * ADMIN DELIVERY ZONE MANAGEMENT ROUTES (/api/admin/delivery-zones)
 * ───────────────────────────────────────────────────────────────────────────── */

// POST /api/admin/delivery-zones - Create delivery zone
router.post('/admin/delivery-zones', protect, authorize('admin'), v.validateCreateZone, c.createZone);

// GET /api/admin/delivery-zones - List delivery zones with pagination & filters
router.get('/admin/delivery-zones', protect, authorize('admin'), c.getZones);

// PATCH /api/admin/delivery-zones/:id - Update delivery zone
router.patch('/admin/delivery-zones/:id', protect, authorize('admin'), v.validateUpdateZone, c.updateZone);

// DELETE /api/admin/delivery-zones/:id - Delete delivery zone
router.delete('/admin/delivery-zones/:id', protect, authorize('admin'), c.deleteZone);

// POST /api/admin/delivery-zones/:id/assign-partner - Assign partner to zone
router.post('/admin/delivery-zones/:id/assign-partner', protect, authorize('admin'), v.validateAssignPartner, c.assignPartner);

// DELETE /api/admin/delivery-zones/:id/remove-partner - Remove partner from zone
router.delete('/api/admin/delivery-zones/:id/remove-partner', protect, authorize('admin'), v.validateRemovePartner, c.removePartner);

/* ─────────────────────────────────────────────────────────────────────────────
 * DELIVERY PARTNER ZONE ROUTES (/api/delivery)
 * ───────────────────────────────────────────────────────────────────────────── */

// GET /api/delivery/zones - View assigned zones for authenticated partner
router.get('/delivery/zones', protectDelivery, c.getAssignedZones);

// GET /api/delivery/current-zone - Detect current active zone membership for GPS
router.get('/delivery/current-zone', protectDelivery, c.getCurrentZone);

// GET /api/delivery/allowed-orders - List available orders within assigned zones
router.get('/delivery/allowed-orders', protectDelivery, c.getAllowedOrders);

module.exports = router;
