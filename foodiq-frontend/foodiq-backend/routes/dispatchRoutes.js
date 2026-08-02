const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/dispatchController');

router.use(protect);
router.use(authorize('admin'));

router.post('/run', c.runDispatch);
router.get('/history', c.getHistory);
router.get('/logs', c.getLogs);
router.get('/rules', c.getRules);
router.patch('/rules', c.updateRules);

module.exports = router;
