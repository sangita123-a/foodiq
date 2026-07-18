const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require('../models/restaurantModel');
const { getMenuItemsByRestaurant } = require('../models/menuItemModel');
const cache = require('../services/cacheService');
const { invalidateCatalog, setCatalogHttpCache } = require('../middleware/cacheMiddleware');
const { assertRestaurantOwner, isAdmin } = require('../middleware/ownership');
const { writeAudit } = require('../services/auditService');

const getAll = async (req, res) => {
  try {
    const key = cache.cacheKey('restaurants:list', req.query || {});
    const ttl = Number(process.env.CACHE_TTL_RESTAURANTS || 45);
    const { data, cache: status } = await cache.wrap(key, ttl, () => getRestaurants(req.query));
    setCatalogHttpCache(res, status);
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
    setCatalogHttpCache(res, status);
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
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Restaurant menu retrieved', data: menuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required', error: {} });
    }

    // Non-admins can only create restaurants for themselves
    let owner_id = req.body.owner_id;
    if (!isAdmin(req.user)) {
      owner_id = req.user.id;
    } else if (!owner_id) {
      return res.status(400).json({ success: false, message: 'Owner ID is required', error: {} });
    }

    const newRestaurant = await createRestaurant({ ...req.body, owner_id });
    await invalidateCatalog();
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'restaurant_create',
      category: 'catalog',
      resourceId: newRestaurant?.id,
      req,
    }).catch(() => {});
    res.status(201).json({ success: true, message: 'Restaurant created', data: newRestaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    await assertRestaurantOwner(req.user, id);

    // Owners cannot reassign ownership; admins may
    const patch = { ...req.body };
    if (!isAdmin(req.user)) {
      delete patch.owner_id;
    }

    const updated = await updateRestaurant(id, patch);
    await invalidateCatalog();
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'restaurant_update',
      category: 'catalog',
      resourceId: id,
      req,
    }).catch(() => {});
    res.json({ success: true, message: 'Restaurant updated', data: updated });
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
    await assertRestaurantOwner(req.user, id);
    const deleted = await deleteRestaurant(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Restaurant not found', error: {} });
    await invalidateCatalog();
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'restaurant_delete',
      category: 'catalog',
      resourceId: id,
      req,
    }).catch(() => {});
    res.json({ success: true, message: 'Restaurant deleted', data: {} });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Server Error' : error.message,
      error: {},
    });
  }
};

module.exports = { getAll, getById, getMenu, create, update, remove };
