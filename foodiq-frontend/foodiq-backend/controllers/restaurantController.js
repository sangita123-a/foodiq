const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require('../models/restaurantModel');
const { getMenuItemsByRestaurant } = require('../models/menuItemModel');
const cache = require('../services/cacheService');
const { invalidateCatalog } = require('../middleware/cacheMiddleware');

const getAll = async (req, res) => {
  try {
    const key = cache.cacheKey('restaurants:list', req.query || {});
    const ttl = Number(process.env.CACHE_TTL_RESTAURANTS || 45);
    const { data, cache: status } = await cache.wrap(key, ttl, () => getRestaurants(req.query));
    res.setHeader('X-Cache', status);
    res.json({
      success: true,
      message: 'Restaurants retrieved',
      data: data.restaurants,
      pagination: data.pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const key = cache.cacheKey('restaurants:id', { id });
    const { data: restaurant, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_RESTAURANTS || 60),
      () => getRestaurantById(id)
    );
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found', error: {} });
    res.setHeader('X-Cache', status);
    res.json({ success: true, message: 'Restaurant retrieved', data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const key = cache.cacheKey('menu:restaurant', { id });
    const { data: menuItems, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_MENU || 60),
      () => getMenuItemsByRestaurant(id)
    );
    res.setHeader('X-Cache', status);
    res.json({ success: true, message: 'Restaurant menu retrieved', data: menuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, owner_id } = req.body;
    if (!name || !owner_id) {
      return res.status(400).json({ success: false, message: 'Name and Owner ID are required', error: {} });
    }

    const newRestaurant = await createRestaurant(req.body);
    await invalidateCatalog();
    res.status(201).json({ success: true, message: 'Restaurant created', data: newRestaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await getRestaurantById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found', error: {} });

    const updated = await updateRestaurant(id, req.body);
    await invalidateCatalog();
    res.json({ success: true, message: 'Restaurant updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteRestaurant(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Restaurant not found', error: {} });
    await invalidateCatalog();
    res.json({ success: true, message: 'Restaurant deleted', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, getById, getMenu, create, update, remove };
