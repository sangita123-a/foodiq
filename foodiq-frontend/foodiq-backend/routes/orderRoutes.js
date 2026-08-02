const express = require('express');
const router = express.Router();
const { placeOrder, getAllOrders, getSingleOrder, cancelOrder, updateStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const {
  getFeedback,
  submitFeedback,
  updateFeedback,
  deleteFeedback,
} = require('../controllers/orderFeedbackController');
const {
  createOrderReview,
  getOrderReview,
} = require('../controllers/deliveryPartnerReviewController');

router.use(protect);

router.post('/place', placeOrder);
router.get('/', getAllOrders);
router.post('/:id/reorder', require('../controllers/reorderController').reorderOrder);
router.get('/:id/feedback', getFeedback);
router.post('/:id/feedback', submitFeedback);
router.put('/:id/feedback', updateFeedback);
router.delete('/:id/feedback', deleteFeedback);
router.get('/:id/review', getOrderReview);
router.post('/:id/review', createOrderReview);
router.get('/:id', getSingleOrder);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', updateStatus);

const trackingRoutes = require('./trackingRoutes');
router.use('/:id', trackingRoutes);

module.exports = router;
