const express = require('express');
const router = express.Router();
const { listLiveDeals, getRestaurantLiveDeal } = require('../controllers/liveDealController');

router.get('/', listLiveDeals);
router.get('/restaurant/:restaurantId', getRestaurantLiveDeal);

module.exports = router;
