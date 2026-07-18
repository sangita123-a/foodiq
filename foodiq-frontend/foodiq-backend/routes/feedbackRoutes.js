const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/authMiddleware');
const { feedbackLimiter } = require('../middleware/rateLimiters');
const { submitFeedback } = require('../controllers/feedbackController');

router.post('/', feedbackLimiter, optionalProtect, submitFeedback);

module.exports = router;
