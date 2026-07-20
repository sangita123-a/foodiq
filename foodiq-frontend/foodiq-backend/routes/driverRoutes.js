const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/deliveryController');

router.use(protect);
router.use(authorize('delivery_partner', 'admin'));

/** POST /api/driver/location — share live GPS (alias for delivery partner location). */
router.post('/location', c.setLocation);

module.exports = router;
