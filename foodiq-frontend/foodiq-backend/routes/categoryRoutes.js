const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(getAll).post(protect, authorize('admin'), create);
router.route('/:id').put(protect, authorize('admin'), update).delete(protect, authorize('admin'), remove);

module.exports = router;
