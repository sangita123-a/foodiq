const express = require('express');
const router = express.Router();
const { getAll, getById, getMenu, create, update, remove } = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/authMiddleware');

const reviewRoutes = require('./reviewRoutes');

router.route('/').get(getAll).post(protect, authorize('admin', 'restaurant_owner'), create);
router.route('/:id').get(getById).put(protect, authorize('admin', 'restaurant_owner'), update).delete(protect, authorize('admin', 'restaurant_owner'), remove);
router.route('/:id/menu').get(getMenu);

router.use('/:restaurantId/reviews', reviewRoutes);

module.exports = router;
