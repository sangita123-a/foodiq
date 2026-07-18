const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/authMiddleware');
const { feedbackLimiter } = require('../middleware/rateLimiters');
const { submitBug } = require('../controllers/bugController');

router.post('/', feedbackLimiter, optionalProtect, submitBug);

module.exports = router;
