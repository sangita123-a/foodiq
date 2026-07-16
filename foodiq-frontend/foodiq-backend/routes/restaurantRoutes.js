const express = require('express');
const router = express.Router();
const { getAll, getById, getMenu, create, update, remove } = require('../controllers/restaurantController');

const reviewRoutes = require('./reviewRoutes'); 

router.route('/').get(getAll).post(create);
router.route('/:id').get(getById).put(update).delete(remove);
router.route('/:id/menu').get(getMenu); 

router.use('/:restaurantId/reviews', reviewRoutes);

module.exports = router;
