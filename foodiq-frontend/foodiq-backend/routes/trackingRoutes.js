const express = require('express');
const router = express.Router({ mergeParams: true }); 
const { getTrackingInfo, getOrderLocation, updateLocation } = require('../controllers/trackingController');

router.get('/tracking', getTrackingInfo);
router.get('/location', getOrderLocation);
router.put('/location', updateLocation);

module.exports = router;
