const express = require('express');
const router = express.Router();
const { submitContact } = require('../controllers/contactController');
const { getPublicContactInfo } = require('../controllers/contactSettingsController');
const { contactLimiter } = require('../middleware/rateLimiters');

router.get('/', getPublicContactInfo);
router.post('/', contactLimiter, submitContact);

module.exports = router;
