const express = require('express');
const router = express.Router({ mergeParams: true }); 
const { getTrackingInfo, updateLocation } = require('../controllers/trackingController');

router.get('/tracking', getTrackingInfo);
router.put('/location', updateLocation);

module.exports = router;
