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
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Webhook must be public (Razorpay signs with webhook secret — no JWT).
router.post('/webhook', handleRazorpayWebhook);

router.use(protect);

router.post('/create', createPayment);
router.post('/verify', verifyPayment);
router.get('/history', getHistory);
router.get('/by-order/:orderId', getPaymentForOrder);
router.get('/:id/invoice', downloadInvoice);

router.post('/razorpay/order', createRazorpayCheckoutOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/razorpay/fail', markPaymentFailed);
router.post('/razorpay/mock-complete', mockCompletePayment);

module.exports = router;
