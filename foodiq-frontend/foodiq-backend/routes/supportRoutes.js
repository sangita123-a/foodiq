const express = require('express');
const router = express.Router();
const { submitSupport } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitSupport);

module.exports = router;
