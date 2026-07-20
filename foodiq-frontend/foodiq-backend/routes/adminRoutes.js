const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { requirePermission } = require('../utils/adminPermissions');
const c = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', requirePermission('dashboard'), c.getDashboard);
router.get('/live-deliveries', requirePermission('live'), c.getLiveDeliveries);
router.get('/analytics', requirePermission('analytics'), c.getAnalytics);

router.get('/restaurants', requirePermission('restaurants'), c.getRestaurants);
router.put('/restaurants/:id', requirePermission('restaurants'), c.patchRestaurant);
router.delete('/restaurants/:id', requirePermission('restaurants'), c.removeRestaurant);
router.get('/restaurants/:id/performance', requirePermission('restaurants'), c.restaurantPerformance);

router.get('/users', requirePermission('customers'), c.getUsers);
router.put('/users/:id', requirePermission('customers'), c.patchUser);
router.delete('/users/:id', requirePermission('customers'), c.removeUser);
router.get('/users/:id/orders', requirePermission('customers'), c.userOrders);
router.get('/users/:id/wallet', requirePermission('customers'), c.userWallet);
router.get('/users/:id/referrals', requirePermission('customers'), c.userReferrals);

router.get('/delivery-partners', requirePermission('delivery'), c.getPartners);
router.put('/delivery-partners/:id', requirePermission('delivery'), c.patchPartner);

router.get('/orders', requirePermission('orders'), c.getOrders);
router.get('/orders/:id', requirePermission('orders'), c.getOrder);
router.put('/orders/:id', requirePermission('orders'), c.patchOrder);
router.post('/orders/:id/refund', requirePermission('orders', 'payments'), c.refund);
router.get('/payments', requirePermission('payments'), c.getPaymentsOverview);
router.get('/payments/transactions', requirePermission('payments'), c.getPaymentTransactions);
router.get('/payments/refunds', requirePermission('payments'), c.getRefunds);
router.post('/payments/refunds', requirePermission('payments'), c.postRefund);
router.get('/payments/settlements', requirePermission('payments'), c.getSettlements);

router.get('/menu', requirePermission('menu'), c.getMenu);
router.delete('/menu/:id', requirePermission('menu'), c.removeMenuItem);
router.get('/categories', requirePermission('menu'), c.getCategories);

router.get('/coupons', requirePermission('coupons'), c.getCoupons);
router.post('/coupons', requirePermission('coupons'), c.postCoupon);
router.put('/coupons/:id', requirePermission('coupons'), c.patchCoupon);
router.delete('/coupons/:id', requirePermission('coupons'), c.removeCoupon);

router.post('/notifications/broadcast', requirePermission('notifications', 'marketing'), c.postBroadcast);

router.get('/settings', requirePermission('settings'), c.getSettings);
router.put('/settings', requirePermission('settings'), c.putSettings);

router.get('/reports/sales', requirePermission('reports'), c.getSalesReports);
router.get('/reports/orders', requirePermission('reports'), c.getOrderReports);
router.get('/reports/users', requirePermission('reports'), c.getUserReports);
router.get('/reports/restaurants', requirePermission('reports'), c.getRestaurantReports);
router.get('/reports/payments', requirePermission('reports'), c.getPaymentReportHandler);
router.get('/reports/delivery', requirePermission('reports'), c.getDeliveryReportHandler);
router.get('/reports/export', requirePermission('reports'), c.exportReport);

router.get('/staff', requirePermission('staff'), c.getStaff);
router.post('/staff', requirePermission('staff'), c.postStaff);
router.put('/staff/:id', requirePermission('staff'), c.patchStaff);
router.delete('/staff/:id', requirePermission('staff'), c.removeStaff);

router.get('/cms', requirePermission('cms'), c.getCms);
router.put('/cms', requirePermission('cms'), c.putCms);
router.delete('/cms/:key', requirePermission('cms'), c.removeCms);

router.get('/marketing', requirePermission('marketing'), c.getMarketing);
router.post('/marketing/campaigns', requirePermission('marketing'), c.postMarketing);
router.put('/marketing/campaigns/:id', requirePermission('marketing'), c.patchMarketing);
router.post('/marketing/campaigns/:id/send', requirePermission('marketing'), c.sendMarketingCampaign);
router.post('/marketing/seasonal', requirePermission('marketing'), c.postSeasonal);

router.get('/security', requirePermission('security'), c.getSecurity);

const feedbackAdmin = require('../controllers/feedbackController');
const bugAdmin = require('../controllers/bugController');
const maintenance = require('../controllers/maintenanceController');

router.get('/feedback', feedbackAdmin.adminListFeedback);
router.put('/feedback/product/:id', feedbackAdmin.adminPatchProductFeedback);
router.put('/feedback/support/:id', feedbackAdmin.adminPatchSupport);
router.put('/feedback/contact/:id', feedbackAdmin.adminPatchContact);
router.put('/feedback/contact/:id/reply', feedbackAdmin.adminReplyContact);
router.delete('/feedback/contact/:id', feedbackAdmin.adminDeleteContact);
router.get('/feedback/contact/export', feedbackAdmin.adminExportContactCsv);

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
