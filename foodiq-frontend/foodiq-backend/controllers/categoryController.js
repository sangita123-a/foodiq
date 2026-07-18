const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../models/restaurantCategoryModel');
const cache = require('../services/cacheService');
const { invalidateCatalog, setCatalogHttpCache } = require('../middleware/cacheMiddleware');

const getAll = async (req, res) => {
  try {
    const key = cache.cacheKey('categories:all', {});
    const { data: categories, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_CATEGORIES || 300),
      () => getCategories()
    );
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Categories retrieved', data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required', error: {} });

    const newCategory = await createCategory({ name, description, image_url });
    await invalidateCatalog();
    res.status(201).json({ success: true, message: 'Category created', data: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found', error: {} });

    const updatedCategory = await updateCategory(id, req.body);
    await invalidateCatalog();
    res.json({ success: true, message: 'Category updated', data: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found', error: {} });

    await deleteCategory(id);
    await invalidateCatalog();
    res.json({ success: true, message: 'Category deleted', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, create, update, remove };
