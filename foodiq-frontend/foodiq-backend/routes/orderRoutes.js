const express = require('express');
const router = express.Router();
const { placeOrder, getAllOrders, getSingleOrder, cancelOrder, updateStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/place', placeOrder);
router.get('/', getAllOrders);
router.get('/:id', getSingleOrder);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', updateStatus);

// Tracking routes mounted within orders for `/api/orders/:id/...`
const trackingRoutes = require('./trackingRoutes');
router.use('/:id', trackingRoutes); 

module.exports = router;
