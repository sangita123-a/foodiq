const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', c.getDashboard);
router.get('/analytics', c.getAnalytics);

router.get('/restaurants', c.getRestaurants);
router.put('/restaurants/:id', c.patchRestaurant);
router.delete('/restaurants/:id', c.removeRestaurant);
router.get('/restaurants/:id/performance', c.restaurantPerformance);

router.get('/users', c.getUsers);
router.put('/users/:id', c.patchUser);
router.delete('/users/:id', c.removeUser);
router.get('/users/:id/orders', c.userOrders);

router.get('/delivery-partners', c.getPartners);
router.put('/delivery-partners/:id', c.patchPartner);

router.get('/orders', c.getOrders);
router.get('/orders/:id', c.getOrder);
router.put('/orders/:id', c.patchOrder);
router.post('/orders/:id/refund', c.refund);
router.get('/payments', c.getPaymentsOverview);
router.get('/payments/transactions', c.getPaymentTransactions);
router.get('/payments/refunds', c.getRefunds);
router.post('/payments/refunds', c.postRefund);

router.get('/menu', c.getMenu);
router.delete('/menu/:id', c.removeMenuItem);
router.get('/categories', c.getCategories);

router.get('/coupons', c.getCoupons);
router.post('/coupons', c.postCoupon);
router.put('/coupons/:id', c.patchCoupon);
router.delete('/coupons/:id', c.removeCoupon);

router.post('/notifications/broadcast', c.postBroadcast);

router.get('/settings', c.getSettings);
router.put('/settings', c.putSettings);

router.get('/reports/sales', c.getSalesReports);
router.get('/reports/orders', c.getOrderReports);
router.get('/reports/users', c.getUserReports);
router.get('/reports/restaurants', c.getRestaurantReports);

module.exports = router;
