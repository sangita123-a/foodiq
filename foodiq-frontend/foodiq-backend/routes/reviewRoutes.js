const express = require('express');
const router = express.Router({ mergeParams: true });
const { getForRestaurant, create, update, remove } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { reviewLimiter } = require('../middleware/rateLimiters');

// Reading reviews is public; creating/updating/deleting requires authentication.
router.route('/').get(getForRestaurant).post(protect, reviewLimiter, create);
router.route('/:id').put(protect, reviewLimiter, update).delete(protect, reviewLimiter, remove);

module.exports = router;
