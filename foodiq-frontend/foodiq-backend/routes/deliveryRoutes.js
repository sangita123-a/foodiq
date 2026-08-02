const express = require('express');
const router = express.Router();
const c = require('../controllers/deliveryController');
const v = require('../validators/deliveryValidator');
const { protectDelivery } = require('../middleware/deliveryAuth');
const { protect, authorize } = require('../middleware/authMiddleware');
const { singleUpload } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiters');

// Hybrid auth middleware for backward compatibility on legacy endpoints
const hybridDeliveryAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const cookieToken = req.cookies?.delivery_token;

  if (authHeader.startsWith('Bearer ') || cookieToken) {
    protectDelivery(req, res, (err) => {
      if (!err && req.deliveryPartner) {
        return next();
      }
      // Fall back to legacy user token if protectDelivery fails
      protect(req, res, () => {
        authorize('delivery_partner', 'admin')(req, res, next);
      });
    });
  } else {
    protect(req, res, () => {
      authorize('delivery_partner', 'admin')(req, res, next);
    });
  }
};

/* ── Public Delivery Partner Auth & OTP Routes ──────────────────────────── */

// POST /api/delivery/register
router.post('/register', v.validateRegister, c.register);

// POST /api/delivery/login
router.post('/login', v.validateLogin, c.login);

// POST /api/delivery/send-otp
router.post('/send-otp', v.validateSendOtp, c.sendOtp);

// POST /api/delivery/verify-otp
router.post('/verify-otp', v.validateVerifyOtp, c.verifyOtp);

// POST /api/delivery/forgot-password
router.post('/forgot-password', v.validateForgotPassword, c.forgotPassword);

// POST /api/delivery/reset-password
router.post('/reset-password', v.validateResetPassword, c.resetPassword);

const sc = require('../controllers/shiftController');

/* ── Shift Scheduling & Attendance Routes ───────────────────────────────── */
router.get('/shifts', protectDelivery, sc.getShifts);
router.get('/shifts/today', protectDelivery, sc.getTodayShift);
router.post('/check-in', protectDelivery, sc.checkIn);
router.post('/check-out', protectDelivery, sc.checkOut);
router.get('/attendance', protectDelivery, sc.getAttendance);

/* ── Protected Delivery Partner Routes (delivery_partners auth) ───────────── */

// GET /api/delivery/profile
router.get('/profile', protectDelivery, c.getProfile);

// GET /api/delivery/orders/available
router.get('/orders/available', protectDelivery, c.getAvailable);

// GET /api/delivery/orders/assigned
router.get('/orders/assigned', protectDelivery, c.getAssigned);

// POST /api/delivery/orders/:id/accept
router.post('/orders/:id/accept', protectDelivery, c.accept);

// POST /api/delivery/location/update — live GPS ping (Live Delivery Tracking)
router.post('/location/update', protectDelivery, v.validateLocationUpdate, c.updateLocationDetailed);

// Status transition routes
router.patch('/orders/:id/reached-restaurant', protectDelivery, c.reachedRestaurant);
router.patch('/orders/:id/picked-up', protectDelivery, c.pickedUp);
router.patch('/orders/:id/out-for-delivery', protectDelivery, c.outForDelivery);
router.patch('/orders/:id/delivered', protectDelivery, c.delivered);
router.post('/orders/:id/verify-otp', protectDelivery, c.verifyOrderOtp);

/* ── Wallet & Earnings ────────────────────────────────────────────────────── */

// GET /api/delivery/wallet — available/pending balance, lifetime + today/weekly/monthly earnings
router.get('/wallet', protectDelivery, c.getWallet);

// GET /api/delivery/transactions — paginated transaction history
router.get('/transactions', protectDelivery, c.getTransactions);

// POST /api/delivery/withdraw — request a withdrawal
router.post('/withdraw', protectDelivery, c.requestWithdrawal);

/* ── Bank Account & Payout Management ────────────────────────────────────── */

// GET/POST /api/delivery/bank-account, PATCH/DELETE /api/delivery/bank-account/:id
router.use('/bank-account', require('./deliveryBankAccountRoutes'));

/* ── KYC & Vehicle Verification Documents ────────────────────────────────── */

// POST /api/delivery/documents/upload — multipart field "file"
router.post('/documents/upload', protectDelivery, uploadLimiter, singleUpload, c.uploadDocument);

// GET /api/delivery/documents
router.get('/documents', protectDelivery, c.getDocuments);

/* ── Delivery Partner Ratings & Reviews ───────────────────────────────────── */

// GET /api/delivery/me/partner-reviews — self-service: my own ratings & reviews
router.get('/me/partner-reviews', protectDelivery, require('../controllers/deliveryPartnerReviewController').getMyPartnerReviews);

/* ── Delivery Partner Notification System ────────────────────────────────── */

// GET /api/delivery/notifications, PATCH /:id/read, PATCH /read-all, DELETE /:id
router.use('/notifications', require('./deliveryNotificationRoutes'));

/* ── Delivery Partner Support Tickets ────────────────────────────────────── */

// GET /api/delivery/support, POST /api/delivery/support
router.use('/support', require('./deliverySupportRoutes'));

/* ── Offline Mode & Auto Sync System ───────────────────────────────────── */
router.use('/sync', require('./deliverySyncRoutes'));

/* ── Auxiliary & Legacy Compatibility Routes ─────────────────────────────── */

router.use(hybridDeliveryAuth);

router.get('/me', c.getMe);
router.get('/me/reviews', c.getMyReviews);
router.put('/profile', c.updateProfile);
router.get('/dashboard', c.getDashboard);
router.put('/availability', c.setAvailability);
router.put('/location', c.setLocation);
router.get('/orders/assigned', c.getAssigned);
router.get('/orders/:id', c.getOrder);
router.post('/orders/:id/reject', c.reject);
router.put('/orders/:id/status', c.updateStatus);
router.post('/orders/:id/customer-call', c.notifyCustomerCalling);
router.get('/orders/:id/route', c.getRoute);
router.get('/earnings', c.getEarnings);
router.get('/history', c.getHistory);

module.exports = router;
