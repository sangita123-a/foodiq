const express = require('express');
const router = express.Router();
const { search } = require('../controllers/searchController');

router.route('/').get(search);

module.exports = router;
