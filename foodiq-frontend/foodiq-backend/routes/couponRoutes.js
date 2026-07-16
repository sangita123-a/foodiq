const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getMyCoupons,
  saveCoupon,
  applyCoupon,
  removeCoupon,
} = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getCoupons);
router.get('/mine', protect, getMyCoupons);
router.post('/save', protect, saveCoupon);
router.post('/apply', protect, applyCoupon);
router.delete('/:couponId', protect, removeCoupon);

module.exports = router;
