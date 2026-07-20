const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const c = require('../controllers/loyaltyController');

router.use(protect);

router.get('/overview', c.getOverview);
router.get('/wallet', c.getWallet);
router.get('/membership', c.getMembership);
router.get('/history', c.getHistory);
router.post('/redeem', c.redeemPoints);
router.post('/checkout-preview', c.previewCheckout);
router.post('/referral/code', c.ensureReferral);

module.exports = router;
