const express = require('express');
const router = express.Router();
const { optionalApiKey, requireApiKey } = require('../middleware/apiKeyAuth');
const { resolveTenantContext } = require('../middleware/resolveTenantContext');
const c = require('../controllers/v1Controller');

router.use(resolveTenantContext);
router.use(optionalApiKey);

router.get('/health', c.health);
router.get('/branding', c.branding);
router.get('/markets', c.markets);
router.get('/restaurants', c.restaurants);

router.get('/partner/summary', requireApiKey('partner', 'enterprise'), c.partnerSummary);
router.post(
  '/integrations/:type/sync',
  requireApiKey('partner', 'enterprise'),
  c.syncIntegration
);

module.exports = router;
