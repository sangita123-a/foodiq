const express = require('express');
const router = express.Router();
const c = require('../controllers/deliveryZoneController');
const v = require('../validators/deliveryZoneValidator');
const { protectDelivery } = require('../middleware/deliveryAuth');
const { protect, authorize } = require('../middleware/authMiddleware');
const { requirePermission } = require('../utils/adminPermissions');

/* ─────────────────────────────────────────────────────────────────────────────
 * ADMIN DELIVERY ZONE MANAGEMENT ROUTES (/api/admin/delivery-zones)
 * ───────────────────────────────────────────────────────────────────────────── */

const adminZoneAuth = [protect, authorize('admin'), requirePermission('delivery')];

// GET /api/admin/delivery-zones/violations - List geo-fencing violations
router.get('/admin/delivery-zones/violations', ...adminZoneAuth, c.getZoneViolations);

// PATCH /api/admin/delivery-zones/violations/:id/resolve - Mark a violation as handled
router.patch('/admin/delivery-zones/violations/:id/resolve', ...adminZoneAuth, c.resolveViolation);

// GET /api/admin/delivery-zones/live-riders - Snapshot of online riders + zone membership
router.get('/admin/delivery-zones/live-riders', ...adminZoneAuth, c.getLiveRiders);

// GET /api/admin/delivery-zones/heatmap - Aggregated GPS activity + violation density
router.get('/admin/delivery-zones/heatmap', ...adminZoneAuth, c.getZoneHeatmap);

// POST /api/admin/delivery-zones - Create delivery zone
router.post('/admin/delivery-zones', ...adminZoneAuth, v.validateCreateZone, c.createZone);

// GET /api/admin/delivery-zones - List delivery zones with pagination & filters
router.get('/admin/delivery-zones', ...adminZoneAuth, c.getZones);

// GET /api/admin/delivery-zones/:id/analytics - Per-zone rider/violation analytics
router.get('/admin/delivery-zones/:id/analytics', ...adminZoneAuth, v.validateZoneIdParam, c.getZoneAnalytics);

// PATCH /api/admin/delivery-zones/:id - Update delivery zone
router.patch('/admin/delivery-zones/:id', ...adminZoneAuth, v.validateUpdateZone, c.updateZone);

// DELETE /api/admin/delivery-zones/:id - Delete delivery zone
router.delete('/admin/delivery-zones/:id', ...adminZoneAuth, v.validateZoneIdParam, c.deleteZone);

// GET /api/admin/delivery-zones/:id/partners - Riders currently assigned to a zone
router.get('/admin/delivery-zones/:id/partners', ...adminZoneAuth, v.validateZoneIdParam, c.getZonePartners);

// POST /api/admin/delivery-zones/:id/assign-partner - Assign partner to zone
router.post('/admin/delivery-zones/:id/assign-partner', ...adminZoneAuth, v.validateAssignPartner, c.assignPartner);

// DELETE /api/admin/delivery-zones/:id/remove-partner - Remove partner from zone
router.delete('/admin/delivery-zones/:id/remove-partner', ...adminZoneAuth, v.validateRemovePartner, c.removePartner);

/* ─────────────────────────────────────────────────────────────────────────────
 * DELIVERY PARTNER ZONE ROUTES (/api/delivery)
 * ───────────────────────────────────────────────────────────────────────────── */

// GET /api/delivery/zones - View assigned zones for authenticated partner
router.get('/delivery/zones', protectDelivery, c.getAssignedZones);

// GET /api/delivery/zones/nearby - Nearby active zones (regardless of assignment)
router.get('/delivery/zones/nearby', protectDelivery, v.validateNearbyQuery, c.getNearbyZones);

// GET /api/delivery/current-zone - Detect current active zone membership for GPS
router.get('/delivery/current-zone', protectDelivery, c.getCurrentZone);

// GET /api/delivery/allowed-orders - List available orders within assigned zones
router.get('/delivery/allowed-orders', protectDelivery, c.getAllowedOrders);

module.exports = router;
