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

const feedbackAdmin = require('../controllers/feedbackController');
const bugAdmin = require('../controllers/bugController');
const maintenance = require('../controllers/maintenanceController');

router.get('/feedback', feedbackAdmin.adminListFeedback);
router.put('/feedback/product/:id', feedbackAdmin.adminPatchProductFeedback);
router.put('/feedback/support/:id', feedbackAdmin.adminPatchSupport);
router.put('/feedback/contact/:id', feedbackAdmin.adminPatchContact);

router.get('/reviews', feedbackAdmin.adminListReviews);
router.put('/reviews/:id', feedbackAdmin.adminPatchReview);

router.get('/order-feedback', feedbackAdmin.adminListOrderFeedback);
router.get('/analytics/feedback', feedbackAdmin.adminFeedbackAnalytics);

router.get('/bugs', bugAdmin.adminListBugs);
router.get('/bugs/weekly-report', bugAdmin.adminWeeklyBugReport);
router.post('/bugs/weekly-report', bugAdmin.adminWeeklyBugReport);
router.get('/bugs/:id', bugAdmin.adminGetBug);
router.put('/bugs/:id', bugAdmin.adminPatchBug);
router.post('/bugs/from-error', bugAdmin.adminCreateBugFromError);

router.get('/analytics/reviews', maintenance.getReviewAnalytics);
router.get('/analytics/v2-adoption', maintenance.getV2Adoption);
router.get('/maintenance/health', maintenance.healthSummary);
router.get('/maintenance/report', maintenance.getOrGenerateReport);
router.get('/maintenance/reports', maintenance.listReports);
router.post('/maintenance/send-weekly', maintenance.sendWeekly);

const featuresAdmin = require('../controllers/featuresController');
router.get('/feature-flags', featuresAdmin.adminListFlags);
router.put('/feature-flags/:key', (req, res) => {
  req.body.key = req.params.key;
  return featuresAdmin.adminUpsertFlag(req, res);
});

module.exports = router;
