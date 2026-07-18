const {
  getMenuItems,
  getMenuItemById,
  getMenuItemDetailsById,
  getMenuItemsByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../models/menuItemModel');
const cache = require('../services/cacheService');
const { invalidateCatalog, setCatalogHttpCache } = require('../middleware/cacheMiddleware');

const getAll = async (req, res) => {
  try {
    const filters = {
      trending: req.query.trending,
      limit: req.query.limit,
      search: req.query.search || '',
    };
    const key = cache.cacheKey('menu:list', filters);
    const ttl = Number(process.env.CACHE_TTL_MENU || 60);
    const { data: items, cache: status } = await cache.wrap(key, ttl, () =>
      getMenuItems(filters)
    );
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Menu items retrieved', data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const key = cache.cacheKey('menu:id', { id });
    const { data: item, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_MENU || 60),
      () => getMenuItemDetailsById(id)
    );
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found', error: {} });
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Menu item retrieved', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const key = cache.cacheKey('menu:restaurant', { id: restaurantId });
    const { data: items, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_MENU || 60),
      () => getMenuItemsByRestaurant(restaurantId)
    );
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Restaurant menu retrieved', data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { restaurant_id, name, price } = req.body;
    if (!restaurant_id || !name || !price) {
      return res.status(400).json({ success: false, message: 'Restaurant ID, name, and price are required', error: {} });
    }

    const { assertRestaurantOwner } = require('../middleware/ownership');
    await assertRestaurantOwner(req.user, restaurant_id);

    const newItem = await createMenuItem(req.body);
    await invalidateCatalog();
    res.status(201).json({ success: true, message: 'Menu item created', data: newItem });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Server Error' : error.message,
      error: {},
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { assertMenuItemOwner } = require('../middleware/ownership');
    await assertMenuItemOwner(req.user, id);

    const updatedItem = await updateMenuItem(id, req.body);
    await invalidateCatalog();
    res.json({ success: true, message: 'Menu item updated', data: updatedItem });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Server Error' : error.message,
      error: {},
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { assertMenuItemOwner } = require('../middleware/ownership');
    await assertMenuItemOwner(req.user, id);

    await deleteMenuItem(id);
    await invalidateCatalog();
    res.json({ success: true, message: 'Menu item deleted', data: {} });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Server Error' : error.message,
      error: {},
    });
  }
};

module.exports = { getAll, getById, getByRestaurant, create, update, remove };
