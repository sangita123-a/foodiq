const {
  getMenuCategories,
  getMenuCategoryById,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
} = require('../models/menuCategoryModel');

const getAll = async (req, res) => {
  try {
    const categories = await getMenuCategories();
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

    const newCategory = await createMenuCategory({ restaurant_id, name, description });
    res.status(201).json({ success: true, message: 'Menu Category created', data: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getMenuCategoryById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Menu Category not found', error: {} });

    const updatedCategory = await updateMenuCategory(id, req.body);
    res.json({ success: true, message: 'Menu Category updated', data: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getMenuCategoryById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Menu Category not found', error: {} });

    await deleteMenuCategory(id);
    res.json({ success: true, message: 'Menu Category deleted', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, create, update, remove };
