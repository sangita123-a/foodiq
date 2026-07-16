const express = require('express');
const router = express.Router();
const { getAll, getById, getByRestaurant, create, update, remove } = require('../controllers/menuItemController');

router.route('/').get(getAll).post(create);
router.route('/:id').get(getById).put(update).delete(remove);
// Note: /api/restaurants/:restaurantId/menu will be mounted differently in server.js or restaurantsRoutes, 
// but we provide it here as well for flexibility depending on routing setup.
router.route('/restaurant/:restaurantId').get(getByRestaurant);

module.exports = router;
