const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, deleteAccount, getDashboard } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/dashboard', getDashboard);
router.route('/').get(getProfile).put(updateProfile).delete(deleteAccount);

module.exports = router;
