const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { otpLimiter } = require('../middleware/rateLimiters');
const c = require('../controllers/messagingController');

router.post('/otp/send', otpLimiter, c.postSendOtp);
router.post('/otp/verify', otpLimiter, c.postVerifyOtp);

router.use(protect);

router.get('/preferences', c.getPreferences);
router.put('/preferences', c.putPreferences);

router.post('/email', c.postSendEmail);
router.post('/sms', c.postSendSms);
router.post('/invoice', c.postGenerateInvoice);

router.get('/logs/email', authorize('admin'), c.getEmailLogs);
router.get('/logs/sms', authorize('admin'), c.getSmsLogs);
router.post('/reports/run', authorize('admin'), c.postRunReport);
router.post('/promo', authorize('admin'), c.postPromo);

module.exports = router;
