const express = require('express');
const router = express.Router();
const { createPayment, verifyPayment, getHistory } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/create', createPayment);
router.post('/verify', verifyPayment);
router.get('/history', getHistory);

module.exports = router;
