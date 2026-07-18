const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { resolveTenantContext } = require('../middleware/resolveTenantContext');
const c = require('../controllers/v4AdminController');

router.use(protect);
router.use(authorize('admin'));
router.use(resolveTenantContext);

router.get('/tax-rules', c.listTaxRules);
router.post('/tax-rules', c.createTaxRule);
router.get('/bi/enterprise', c.enterpriseBi);
router.get('/audit', c.auditExport);
router.get('/fleet', c.fleetList);
router.post('/fleet', c.fleetCreate);
router.get('/ai', c.aiStats);
router.get('/inventory/suggestions', c.inventorySuggestions);
router.post('/iot/devices', c.iotDeviceCreate);
router.get('/memberships', c.listMemberships);
router.post('/memberships', c.upsertMembership);

module.exports = router;
