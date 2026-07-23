const express = require('express');
const router = express.Router();
const {
  list,
  featured,
  create,
  helpful,
  report,
  getOne,
} = require('../controllers/testimonialController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiters');

router.get('/featured', optionalProtect, featured);
router.get('/', optionalProtect, list);
router.get('/:id', optionalProtect, getOne);
router.post('/', protect, authLimiter, create);
router.patch('/:id/helpful', protect, authLimiter, helpful);
router.post('/:id/report', protect, authLimiter, report);

module.exports = router;
