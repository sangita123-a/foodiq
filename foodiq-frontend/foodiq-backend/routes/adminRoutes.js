const express = require('express');
const router = express.Router();
const { getDashboard, getSalesReports, getOrderReports, getUserReports, getRestaurantReports } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/reports/sales', getSalesReports);
router.get('/reports/orders', getOrderReports);
router.get('/reports/users', getUserReports);
router.get('/reports/restaurants', getRestaurantReports);

module.exports = router;
