const express = require('express');
const router = express.Router();
const { getAll, create, update, remove, setDefault } = require('../controllers/paymentMethodController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getAll).post(create);
router.put('/:id/default', setDefault);
router.route('/:id').put(update).delete(remove);

module.exports = router;
