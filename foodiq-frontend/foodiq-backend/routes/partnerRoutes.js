const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMe,
  getDashboard,
  getOrders,
  updatePartnerOrderStatus,
  getMenu,
  createDish,
  updateDish,
  removeDish,
  getProfile,
  updateProfile,
  getPartnerAnalytics,
  getNotifications,
  getSettlements,
  getPartnerReviews,
  replyPartnerReview,
} = require('../controllers/partnerController');

router.use(protect);
router.use(authorize('restaurant_owner', 'admin'));

router.get('/me', getMe);
router.get('/dashboard', getDashboard);
router.get('/orders', getOrders);
router.put('/orders/:id/status', updatePartnerOrderStatus);
router.get('/menu', getMenu);
router.post('/menu', createDish);
router.put('/menu/:id', updateDish);
router.delete('/menu/:id', removeDish);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/analytics', getPartnerAnalytics);
router.get('/notifications', getNotifications);
router.get('/settlements', getSettlements);
router.get('/reviews', getPartnerReviews);
router.put('/reviews/:id', replyPartnerReview);

router.use('/inventory', require('./inventoryRoutes'));

module.exports = router;
