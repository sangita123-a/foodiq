const {
  getMenuCategories,
  getMenuCategoryById,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
} = require('../models/menuCategoryModel');
const { assertRestaurantOwner } = require('../middleware/ownership');

const getAll = async (req, res) => {
  try {
    const categories = await getMenuCategories(req.query.restaurant_id);
    res.json({ success: true, message: 'Menu Categories retrieved', data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { restaurant_id, name, description } = req.body;
    if (!restaurant_id || !name) {
      return res.status(400).json({ success: false, message: 'Restaurant ID and Name are required', error: {} });
    }
    await assertRestaurantOwner(req.user, restaurant_id);

    const newCategory = await createMenuCategory({ restaurant_id, name, description });
    res.status(201).json({ success: true, message: 'Menu Category created', data: newCategory });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: status === 500 ? 'Server Error' : error.message, error: {} });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getMenuCategoryById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Menu Category not found', error: {} });
    await assertRestaurantOwner(req.user, category.restaurant_id);

    const updatedCategory = await updateMenuCategory(id, req.body);
    res.json({ success: true, message: 'Menu Category updated', data: updatedCategory });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: status === 500 ? 'Server Error' : error.message, error: {} });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getMenuCategoryById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Menu Category not found', error: {} });
    await assertRestaurantOwner(req.user, category.restaurant_id);

    await deleteMenuCategory(id);
    res.json({ success: true, message: 'Menu Category deleted', data: {} });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: status === 500 ? 'Server Error' : error.message, error: {} });
  }
};

module.exports = { getAll, create, update, remove };
