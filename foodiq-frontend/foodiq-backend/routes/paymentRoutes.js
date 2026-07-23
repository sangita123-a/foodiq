const express = require('express');
const router = express.Router();
const {
  createPayment,
  verifyPayment,
  getHistory,
  createRazorpayCheckoutOrder,
  verifyRazorpayPayment,
  markPaymentFailed,
  mockCompletePayment,
  handleRazorpayWebhook,
  downloadInvoice,
  getPaymentForOrder,
  getPaymentDetail,
  retryPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiters');

// Webhook must be public (Razorpay signs with webhook secret — no JWT).
router.post('/webhook', handleRazorpayWebhook);

router.use(protect);
router.use(paymentLimiter);

router.post('/create', createPayment);
router.post('/create-order', createRazorpayCheckoutOrder);
router.post('/verify', (req, res) => {
  if (req.body && (req.body.razorpay_signature || req.body.razorpay_order_id)) {
    return verifyRazorpayPayment(req, res);
  }
  return verifyPayment(req, res);
});
router.get('/', getHistory);
router.get('/history', getHistory);
router.post('/retry', retryPayment);
router.get('/by-order/:orderId', getPaymentForOrder);
router.get('/:id/invoice', downloadInvoice);
router.get('/:id', getPaymentDetail);

router.post('/razorpay/order', createRazorpayCheckoutOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/razorpay/fail', markPaymentFailed);
router.post('/razorpay/mock-complete', mockCompletePayment);

module.exports = router;
