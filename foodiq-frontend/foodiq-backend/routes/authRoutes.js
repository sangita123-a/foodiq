const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  sendAuthOtp,
  verifyAuthOtp,
} = require('../controllers/authController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', optionalProtect, logoutUser);
router.post('/logout-all', protect, logoutAllDevices);
router.post('/refresh', authLimiter, refreshAccessToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/send-otp', otpLimiter, sendAuthOtp);
router.post('/verify-otp', otpLimiter, verifyAuthOtp);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
