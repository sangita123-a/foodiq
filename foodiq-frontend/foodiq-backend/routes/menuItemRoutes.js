const express = require('express');
const router = express.Router();
const { getAll, getById, getByRestaurant, create, update, remove } = require('../controllers/menuItemController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(getAll).post(protect, authorize('admin', 'restaurant_owner'), create);
// Static path before /:id so /restaurant/:id is not captured as an item id
router.route('/restaurant/:restaurantId').get(getByRestaurant);
router.route('/:id').get(getById).put(protect, authorize('admin', 'restaurant_owner'), update).delete(protect, authorize('admin', 'restaurant_owner'), remove);

module.exports = router;
