const express = require('express');
const router = express.Router();
const c = require('../controllers/deliverySyncController');
const { protectDelivery } = require('../middleware/deliveryAuth');

/* ── Delivery Partner Sync Engine Routes ────────────────────────────────── */

// GET /api/delivery/sync/status — check queue count & last sync time
router.get('/status', protectDelivery, c.getSyncStatus);

// GET /api/delivery/sync/history — paginated sync log history
router.get('/history', protectDelivery, c.getSyncHistory);

// POST /api/delivery/sync/manual — trigger manual sync / batch submit client offline actions
router.post('/manual', protectDelivery, c.processManualSync);

// POST /api/delivery/sync/retry — retry failed sync logs
router.post('/retry', protectDelivery, c.retryFailedSync);

module.exports = router;
