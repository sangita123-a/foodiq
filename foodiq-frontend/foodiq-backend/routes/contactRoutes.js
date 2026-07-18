const express = require('express');
const router = express.Router();
const { submitContact } = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimiters');

router.post('/', contactLimiter, submitContact);

module.exports = router;
