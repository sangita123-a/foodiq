const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/analyticsBiController');

// Admin BI suite — JWT admin only
router.use('/admin', protect, authorize('admin'));

router.get('/admin/dashboard', c.adminDashboard);
router.get('/admin/realtime', c.adminRealtime);
router.get('/admin/revenue', c.adminRevenue);
router.get('/admin/orders', c.adminOrders);
router.get('/admin/customer-growth', c.adminCustomerGrowth);
router.get('/admin/restaurant-growth', c.adminRestaurantGrowth);
router.get('/admin/delivery', c.adminDelivery);
router.get('/admin/funnel', c.adminFunnel);
router.get('/admin/retention', c.adminRetention);
router.get('/admin/clv', c.adminClv);
router.get('/admin/cart-abandonment', c.adminAbandonment);
router.get('/admin/popular-restaurants', c.adminPopularRestaurants);
router.get('/admin/popular-dishes', c.adminPopularDishes);
router.get('/admin/peak-hours', c.adminPeakHours);
router.get('/admin/city-sales', c.adminCitySales);
router.get('/admin/coupons', c.adminCoupons);
router.get('/admin/campaigns', c.adminCampaigns);
router.get('/admin/anomalies', c.adminAnomalies);
router.get('/admin/insights', c.adminInsights);
router.get('/admin/forecast', c.adminForecast);
router.post('/admin/forecast', c.adminForecast);
router.get('/admin/export', c.adminExport);
router.post('/admin/email-report', c.adminEmailReport);

// Partner restaurant analytics
router.get('/restaurant', protect, authorize('restaurant_owner', 'admin'), c.restaurantDashboard);

// Delivery partner analytics
router.get('/delivery', protect, authorize('delivery_partner', 'admin'), c.deliveryDashboard);

// Customer personal analytics
router.get('/customer', protect, c.customerDashboard);

module.exports = router;
