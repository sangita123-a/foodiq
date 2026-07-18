const express = require('express');
const router = express.Router();
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/featuresController');

// Public / optional auth
router.get('/flags', optionalProtect, c.getFlags);
router.get('/home', optionalProtect, c.getHomeFeed);
router.get('/trending', optionalProtect, c.getTrending);
router.get('/recommendations', optionalProtect, c.getRecommendations);
router.get('/coupons/recommend', optionalProtect, c.getCouponRecs);
router.get('/collections', c.getCollections);
router.get('/collections/:slug', c.getCollection);
router.get('/campaigns', c.getCampaigns);
router.post('/views', optionalProtect, c.postView);
router.get('/views/recent', optionalProtect, c.getRecentViews);
router.post('/eta/estimate', optionalProtect, c.postEtaEstimate);
router.get('/gift-cards/:code', optionalProtect, c.getGiftCardBalance);

// Authenticated customer features
router.get('/wishlist', protect, c.getWishlist);
router.post('/wishlist', protect, c.postWishlist);
router.post('/wishlist/:menuItemId', protect, c.postWishlist);
router.delete('/wishlist/:menuItemId', protect, c.deleteWishlist);

router.get('/referral', protect, c.getReferral);
router.post('/referral/code', protect, c.ensureReferralCode);

router.get('/gift-cards', protect, c.getMyGiftCards);
router.post('/gift-cards/purchase', protect, c.postGiftCardPurchase);
router.post('/gift-cards/redeem', protect, c.postGiftCardRedeem);

// Admin flag management (also mounted under /api/admin)
router.get('/admin/flags', protect, authorize('admin'), c.adminListFlags);
router.put('/admin/flags/:key', protect, authorize('admin'), (req, res) => {
  req.body.key = req.params.key;
  return c.adminUpsertFlag(req, res);
});

module.exports = router;
