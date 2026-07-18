const express = require('express');
const router = express.Router();
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');
const { optionalApiKey, requireApiKey } = require('../middleware/apiKeyAuth');
const { resolveLocale } = require('../middleware/resolveLocale');
const { resolveTenantContext } = require('../middleware/resolveTenantContext');
const { requireOrgRole } = require('../middleware/requireOrgRole');
const c = require('../controllers/v4Controller');

router.use(resolveLocale);
router.use(resolveTenantContext);
router.use(optionalApiKey);

router.get('/health', c.health);
router.get('/i18n/messages', c.i18nMessages);

router.get('/sso/:provider/start', c.ssoStart);
router.post('/sso/:provider/callback', c.ssoCallback);

router.post('/voice', optionalProtect, c.voiceOrder);
router.post('/chat', optionalProtect, c.chat);

router.get('/recommendations', optionalProtect, c.recommendations);
router.get('/offers/personalized', optionalProtect, c.offersPersonalized);

router.get(
  '/corporate/accounts',
  protect,
  requireOrgRole('org_admin', 'buyer', 'approver', 'viewer'),
  c.corporateAccountsList
);
router.post(
  '/corporate/accounts',
  protect,
  requireOrgRole('org_admin'),
  c.corporateAccountCreate
);
router.post(
  '/corporate/orders',
  protect,
  requireOrgRole('org_admin', 'buyer'),
  c.corporateOrderCreate
);
router.post(
  '/corporate/recurring',
  protect,
  requireOrgRole('org_admin', 'buyer'),
  c.recurringCreate
);
router.post('/corporate/recurring/run', protect, requireOrgRole('org_admin'), c.recurringRun);

router.post('/fleet/optimize', protect, authorize('admin', 'restaurant_owner', 'delivery_partner'), c.fleetOptimize);
router.post('/iot/telemetry', requireApiKey('partner', 'enterprise', 'public'), c.iotTelemetry);
router.post('/inventory/predict', protect, authorize('admin', 'restaurant_owner'), c.inventoryPredict);

router.get('/marketplace', c.marketplaceList);
router.post('/marketplace/subscribe', requireApiKey('partner', 'enterprise'), c.marketplaceSubscribe);

router.post('/privacy/export', protect, c.privacyExport);
router.post('/privacy/delete-request', protect, c.privacyDelete);

module.exports = router;
