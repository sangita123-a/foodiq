const express = require('express');
const router = express.Router();
const { checkout } = require('../controllers/checkoutController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').post(checkout);

module.exports = router;
