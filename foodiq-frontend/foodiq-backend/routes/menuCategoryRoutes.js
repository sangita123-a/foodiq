const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/menuCategoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(getAll).post(protect, authorize('admin', 'restaurant_owner'), create);
router.route('/:id').put(protect, authorize('admin', 'restaurant_owner'), update).delete(protect, authorize('admin', 'restaurant_owner'), remove);

module.exports = router;
