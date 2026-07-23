const express = require('express');
const router = express.Router();
const {
  submitSupport,
  submitOrderProblem,
  submitEmailSupport,
  getSupportHistory,
} = require('../controllers/supportController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { singleUpload } = require('../middleware/uploadMiddleware');

router.post('/', protect, submitSupport);
router.post('/order-problem', protect, singleUpload, submitOrderProblem);
router.post('/email', optionalProtect, singleUpload, submitEmailSupport);
router.get('/history', protect, getSupportHistory);

module.exports = router;
