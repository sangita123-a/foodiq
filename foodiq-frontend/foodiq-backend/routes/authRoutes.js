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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
