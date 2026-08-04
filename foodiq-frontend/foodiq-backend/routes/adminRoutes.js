const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { requirePermission } = require('../utils/adminPermissions');
const c = require('../controllers/adminController');
const { restaurantAdminActionLimiter } = require('../middleware/rateLimiters');
const { validateRestaurantDocument, validateRestaurantBankAccount } = require('../validators/restaurantValidator');
const { validateUuidParam } = require('../middleware/validateParams');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', requirePermission('dashboard'), c.getDashboard);
router.get('/live-deliveries', requirePermission('live'), c.getLiveDeliveries);
router.get('/analytics', requirePermission('analytics'), c.getAnalytics);

router.get('/restaurants', requirePermission('restaurants'), c.getRestaurants);
router.get('/restaurants/stats', requirePermission('restaurants'), c.getRestaurantStats);
router.post('/restaurants/bulk', requirePermission('restaurants'), restaurantAdminActionLimiter, c.bulkRestaurants);
router.patch('/restaurants/reviews/:reviewId', requirePermission('restaurants'), c.patchRestaurantReview);
router.get('/restaurants/:id', requirePermission('restaurants'), c.getRestaurantDetail);
router.put('/restaurants/:id', requirePermission('restaurants'), c.patchRestaurant);
router.delete('/restaurants/:id', requirePermission('restaurants'), restaurantAdminActionLimiter, c.removeRestaurant);
router.post('/restaurants/:id/verify', requirePermission('restaurants'), restaurantAdminActionLimiter, c.verifyRestaurantAction);
router.get('/restaurants/:id/verification-timeline', requirePermission('restaurants'), c.getRestaurantVerificationTimeline);
router.get('/restaurants/:id/performance', requirePermission('restaurants'), c.restaurantPerformance);
router.get('/restaurants/:id/documents', requirePermission('restaurants'), c.getRestaurantDocuments);
router.patch('/restaurants/:id/documents', requirePermission('restaurants'), restaurantAdminActionLimiter, validateRestaurantDocument, c.patchRestaurantDocument);
router.patch('/restaurants/:id/documents/:docId', requirePermission('restaurants'), restaurantAdminActionLimiter, validateRestaurantDocument, c.patchRestaurantDocument);
router.get('/restaurants/:id/bank-account', requirePermission('restaurants', 'payments'), c.getRestaurantBankAccount);
router.patch('/restaurants/:id/bank-account', requirePermission('restaurants', 'payments'), restaurantAdminActionLimiter, validateRestaurantBankAccount, c.patchRestaurantBankAccount);
router.get('/restaurants/:id/revenue-trend', requirePermission('restaurants', 'analytics'), c.getRestaurantRevenueTrend);
router.get('/restaurants/:id/analytics', requirePermission('restaurants', 'analytics'), c.getRestaurantAnalytics);
router.get('/restaurants/:id/reviews', requirePermission('restaurants', 'feedback'), c.getRestaurantReviews);
router.get('/restaurants/:id/settlements', requirePermission('restaurants', 'payments'), c.getRestaurantSettlementsScoped);

router.get('/users', requirePermission('customers'), c.getUsers);
router.put('/users/:id', requirePermission('customers'), c.patchUser);
router.delete('/users/:id', requirePermission('customers'), c.removeUser);
router.get('/users/:id/orders', requirePermission('customers'), c.userOrders);
router.get('/users/:id/wallet', requirePermission('customers'), c.userWallet);
router.get('/users/:id/referrals', requirePermission('customers'), c.userReferrals);
router.get('/customers/:id/support', requirePermission('customers'), c.getCustomerSupportTickets);

const sc = require('../controllers/shiftController');
router.get('/shifts', requirePermission('delivery'), sc.getAdminShifts);
router.post('/shifts', requirePermission('delivery'), sc.createAdminShift);
router.post('/shifts/assign', requirePermission('delivery'), sc.assignAdminShift);
router.get('/shifts/partner/:partnerId/attendance', requirePermission('delivery'), sc.getAdminPartnerAttendance);
router.patch('/shifts/:id', requirePermission('delivery'), sc.updateAdminShift);
router.delete('/shifts/:id', requirePermission('delivery'), sc.deleteAdminShift);

router.get('/delivery-partners', requirePermission('delivery'), c.getPartners);
router.put('/delivery-partners/:id', requirePermission('delivery'), c.patchPartner);

router.get('/withdrawals', requirePermission('delivery', 'payments'), c.getWithdrawals);
router.patch('/withdrawals/:id', requirePermission('delivery', 'payments'), c.patchWithdrawal);

router.get('/delivery/documents', requirePermission('delivery'), c.getKycDocuments);
router.patch('/delivery/documents/:id', requirePermission('delivery'), c.patchKycDocument);

router.get('/delivery/bank-accounts', requirePermission('delivery', 'payments'), c.getDeliveryBankAccounts);
router.patch('/delivery/bank-accounts/:id', requirePermission('delivery', 'payments'), c.patchDeliveryBankAccount);

const deliveryPartnerReviewAdmin = require('../controllers/deliveryPartnerReviewController');
router.get('/delivery-reviews/trends', requirePermission('delivery', 'feedback'), deliveryPartnerReviewAdmin.adminReviewTrends);
router.get('/delivery-reviews', requirePermission('delivery', 'feedback'), deliveryPartnerReviewAdmin.adminListPartnerReviews);
router.delete('/delivery-reviews/:id', requirePermission('delivery', 'feedback'), deliveryPartnerReviewAdmin.adminDeletePartnerReview);

const { notificationLimiter, supportLimiter } = require('../middleware/rateLimiters');
router.get('/delivery/notifications', requirePermission('delivery', 'notifications'), c.getDeliveryNotifications);
router.post('/delivery/notifications/send', notificationLimiter, requirePermission('delivery', 'notifications'), c.sendDeliveryNotification);

router.get('/orders', requirePermission('orders'), c.getOrders);
router.get('/orders/stats', requirePermission('orders'), c.getOrderStats);
router.post('/orders/bulk-status', requirePermission('orders'), c.bulkUpdateStatus);
router.post('/orders/bulk-assign', requirePermission('orders', 'delivery'), c.bulkAssignPartner);
router.post('/orders/bulk-cancel', requirePermission('orders'), c.bulkCancelOrders);
router.get('/orders/:id', requirePermission('orders'), validateUuidParam('id'), c.getOrder);
router.get('/orders/:id/history', requirePermission('orders'), validateUuidParam('id'), c.getOrderHistory);
router.get('/orders/:id/invoice', requirePermission('orders'), validateUuidParam('id'), c.downloadOrderInvoice);
router.put('/orders/:id', requirePermission('orders'), validateUuidParam('id'), c.patchOrder);
router.post('/orders/:id/refund', requirePermission('orders', 'payments'), validateUuidParam('id'), c.refund);
router.get('/payments', requirePermission('payments'), c.getPaymentsOverview);
router.get('/payments/transactions', requirePermission('payments'), c.getPaymentTransactions);
router.get('/payments/refunds', requirePermission('payments'), c.getRefunds);
router.post('/payments/refunds', requirePermission('payments'), c.postRefund);
router.get('/payments/settlements', requirePermission('payments'), c.getSettlements);
router.get('/payments/settlements/batches', requirePermission('payments'), c.listSettlementBatches);
router.post('/payments/settlements/generate', requirePermission('payments'), c.generateSettlementBatch);
router.post('/payments/settlements/bulk-approve', requirePermission('payments'), c.bulkApproveSettlementBatches);
router.post('/payments/settlements/:id/approve', requirePermission('payments'), validateUuidParam('id'), c.approveSettlementBatch);
router.post('/payments/settlements/:id/pay', requirePermission('payments'), validateUuidParam('id'), c.paySettlementBatch);
router.post('/payments/settlements/:id/reject', requirePermission('payments'), validateUuidParam('id'), c.rejectSettlementBatch);

router.get('/menu', requirePermission('menu'), c.getMenu);
router.delete('/menu/:id', requirePermission('menu'), c.removeMenuItem);
router.get('/categories', requirePermission('menu'), c.getCategories);

router.get('/coupons', requirePermission('coupons'), c.getCoupons);
router.get('/coupons/analytics', requirePermission('coupons'), c.getCouponAnalytics);
router.post('/coupons', requirePermission('coupons'), c.postCoupon);
router.put('/coupons/:id', requirePermission('coupons'), c.patchCoupon);
router.delete('/coupons/:id', requirePermission('coupons'), c.removeCoupon);

router.post('/notifications/broadcast', requirePermission('notifications', 'marketing'), c.postBroadcast);
router.post('/notifications/push', requirePermission('notifications', 'marketing'), c.postPushCampaign);
router.get('/notifications/push/scheduled', requirePermission('notifications', 'marketing'), c.getScheduledPushCampaigns);
router.get('/notifications/push/targets', requirePermission('notifications', 'marketing'), c.getPushTargetOptions);

router.get('/settings', requirePermission('settings'), c.getSettings);
router.put('/settings', requirePermission('settings'), c.putSettings);

const { updateAdminContactInfo } = require('../controllers/contactSettingsController');
router.put('/contact', requirePermission('settings'), updateAdminContactInfo);

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

router.get('/loyalty', requirePermission('loyalty'), c.getLoyaltyOverview);
router.put('/loyalty/rules/:key', requirePermission('loyalty'), c.patchLoyaltyRule);
router.put('/loyalty/tiers/:slug', requirePermission('loyalty'), c.patchLoyaltyTier);
router.post('/loyalty/adjust', requirePermission('loyalty'), c.postLoyaltyAdjust);
router.post('/loyalty/expire', requirePermission('loyalty'), c.postLoyaltyExpire);
router.post('/loyalty/campaign', requirePermission('loyalty'), c.postLoyaltyCampaign);

const driverSupportAdmin = require('../controllers/deliverySupportController');
router.get('/support/tickets', requirePermission('delivery', 'feedback'), driverSupportAdmin.adminListTickets);
router.get('/support/ticket/:id', requirePermission('delivery', 'feedback'), driverSupportAdmin.adminGetTicket);
router.patch('/support/assign', requirePermission('delivery', 'feedback'), driverSupportAdmin.adminAssignTicket);
router.patch('/support/status', requirePermission('delivery', 'feedback'), driverSupportAdmin.adminUpdateStatus);
router.post('/support/message', supportLimiter, requirePermission('delivery', 'feedback'), driverSupportAdmin.adminSendMessage);

const ticketAdmin = require('../controllers/ticketController');
router.get('/tickets', requirePermission('feedback'), ticketAdmin.adminListTickets);

router.get('/tickets/:id', requirePermission('feedback'), ticketAdmin.adminGetTicket);
router.put('/tickets/:id/assign', requirePermission('feedback'), ticketAdmin.adminAssignTicket);
router.put('/tickets/:id/status', requirePermission('feedback'), ticketAdmin.adminUpdateStatus);
router.post('/tickets/:id/messages', requirePermission('feedback'), ticketAdmin.adminReplyTicket);
router.put('/tickets/:id/close', requirePermission('feedback'), ticketAdmin.adminCloseTicket);

router.get('/inventory', requirePermission('restaurants'), c.getAdminInventory);

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
router.delete('/reviews/:id', feedbackAdmin.adminDeleteReview);

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

const syncAdmin = require('../controllers/deliverySyncController');
router.get('/sync/queue', syncAdmin.getAdminSyncList);
router.get('/sync/stats', syncAdmin.getAdminSyncStats);
router.post('/sync/retry', syncAdmin.retryAdminSync);

const routeAdmin = require('../controllers/routeController');
router.get('/routes', routeAdmin.getAdminRoutes);
router.get('/routes/analytics', routeAdmin.getAdminRouteAnalytics);

module.exports = router;
