const express = require('express');
const router = express.Router();
const { getPublicPartnerReviews } = require('../controllers/deliveryPartnerReviewController');
const { isValidUuid } = require('../middleware/validateParams');

/**
 * Mounted at /api/delivery in server.js BEFORE the main deliveryRoutes
 * router, so this stays reachable without authentication. deliveryRoutes
 * ends with an unconditional `router.use(hybridDeliveryAuth)` that would
 * otherwise 401 anonymous profile-page visitors before they ever got here.
 *
 * `:partnerId` only intercepts genuine UUIDs; anything else (e.g. the
 * literal `/me/reviews` self-service route) falls through to deliveryRoutes
 * unchanged via next().
 */
// GET /api/delivery/:partnerId/reviews
router.get('/:partnerId/reviews', (req, res, next) => {
  if (!isValidUuid(req.params.partnerId)) return next();
  return getPublicPartnerReviews(req, res, next);
});

module.exports = router;
