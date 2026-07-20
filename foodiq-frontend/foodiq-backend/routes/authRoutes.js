const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/logout-all', protect, logoutAllDevices);
router.post('/refresh', authLimiter, refreshAccessToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
