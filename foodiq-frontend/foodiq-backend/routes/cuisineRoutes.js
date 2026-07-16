const express = require('express');
const router = express.Router();
const { listCuisines, getCuisine, getItems } = require('../controllers/cuisineController');

router.get('/', listCuisines);
router.get('/:slug/items', getItems);
router.get('/:slug', getCuisine);

module.exports = router;
