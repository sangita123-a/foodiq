const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/monitoringController');

// Deep health for load balancers (no secrets)
router.get('/health', c.getPublicHealth);

// Client error beacon (optional auth)
router.post('/client-error', (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return protect(req, res, () => c.postClientError(req, res).catch(next));
  }
  return c.postClientError(req, res).catch(next);
});

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', c.getDashboard);
router.get('/metrics', c.getMetrics);
router.post('/metrics/snapshot', c.postSnapshot);

router.get('/audits', c.getAudits);
router.get('/audits/export', c.exportAudits);

router.get('/errors', c.getErrors);

router.get('/alerts', c.getAlertsHandler);
router.put('/alerts/:id/ack', c.ackAlert);
router.post('/alerts/test', c.postTestAlert);

router.get('/logs', c.getLogFiles);
router.get('/logs/:name', c.getLogContent);
router.get('/logs/:name/download', c.exportLogFile);

router.get('/backups', c.getBackups);
router.post('/backups', c.postBackup);

module.exports = router;
