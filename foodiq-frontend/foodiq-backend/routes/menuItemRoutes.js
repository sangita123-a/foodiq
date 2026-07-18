const express = require('express');
const router = express.Router();
const { getAll, getById, getByRestaurant, create, update, remove } = require('../controllers/menuItemController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(getAll).post(protect, authorize('admin', 'restaurant_owner'), create);
router.route('/:id').get(getById).put(protect, authorize('admin', 'restaurant_owner'), update).delete(protect, authorize('admin', 'restaurant_owner'), remove);
router.route('/restaurant/:restaurantId').get(getByRestaurant);

module.exports = router;
