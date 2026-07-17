const {
  getMenuItems,
  getMenuItemById,
  getMenuItemDetailsById,
  getMenuItemsByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../models/menuItemModel');

const getAll = async (req, res) => {
  try {
    const items = await getMenuItems({
      trending: req.query.trending,
      limit: req.query.limit,
      search: req.query.search || '',
    });
    res.json({ success: true, message: 'Menu items retrieved', data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getMenuItemDetailsById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found', error: {} });
    res.json({ success: true, message: 'Menu item retrieved', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const items = await getMenuItemsByRestaurant(restaurantId);
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

    const newItem = await createMenuItem(req.body);
    res.status(201).json({ success: true, message: 'Menu item created', data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getMenuItemById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found', error: {} });

    const updatedItem = await updateMenuItem(id, req.body);
    res.json({ success: true, message: 'Menu item updated', data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getMenuItemById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found', error: {} });

    await deleteMenuItem(id);
    res.json({ success: true, message: 'Menu item deleted', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, getById, getByRestaurant, create, update, remove };
