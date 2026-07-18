const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/deliveryPartnerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(authorize('admin'), getAll).post(authorize('admin'), create);
router
  .route('/:id')
  .put(authorize('admin', 'delivery_partner'), update)
  .delete(authorize('admin'), remove);

module.exports = router;
