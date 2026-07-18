const express = require('express');
const router = express.Router();
const { placeOrder, getAllOrders, getSingleOrder, cancelOrder, updateStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const {
  getFeedback,
  submitFeedback,
} = require('../controllers/orderFeedbackController');

router.use(protect);

router.post('/place', placeOrder);
router.get('/', getAllOrders);
router.get('/:id/feedback', getFeedback);
router.post('/:id/feedback', submitFeedback);
router.get('/:id', getSingleOrder);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', updateStatus);

const trackingRoutes = require('./trackingRoutes');
router.use('/:id', trackingRoutes);

module.exports = router;
