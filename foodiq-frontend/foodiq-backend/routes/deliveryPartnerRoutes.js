const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/deliveryPartnerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getAll).post(create);
router.route('/:id').put(update).delete(remove);

module.exports = router;
