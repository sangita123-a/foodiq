const express = require('express');
const router = express.Router({ mergeParams: true });
const { getForRestaurant, create, update, remove } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Reading reviews is public; creating/updating/deleting requires authentication.
router.route('/').get(getForRestaurant).post(protect, create);
router.route('/:id').put(protect, update).delete(protect, remove);

module.exports = router;
