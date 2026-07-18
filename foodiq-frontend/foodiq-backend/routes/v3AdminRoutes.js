const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { resolveTenantContext } = require('../middleware/resolveTenantContext');
const c = require('../controllers/v3AdminController');

router.use(protect);
router.use(authorize('admin'));
router.use(resolveTenantContext);

router.get('/markets', c.listMarkets);
router.post('/markets', c.createMarket);

router.get('/organizations', c.listOrganizations);
router.post('/organizations', c.createOrganization);

router.get('/franchises', c.listFranchises);
router.post('/franchises', c.createFranchise);

router.get('/chains', c.listChains);
router.post('/chains', c.createChain);

router.post('/white-label', c.upsertWhiteLabel);
router.post('/api-keys', c.postApiKey);

router.get('/bi', c.getBi);
router.post('/forecasts', c.postForecast);
router.get('/pricing/preview', c.getPricingPreview);

router.get('/inventory', c.listInventory);
router.get('/connectors', c.listConnectors);
router.post('/connectors', c.upsertConnector);

router.get('/search', c.adminSearch);

module.exports = router;
