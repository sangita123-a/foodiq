const express = require('express');
const router = express.Router();
const { getRefundById } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/:id', getRefundById);

module.exports = router;
