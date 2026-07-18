const { getAllCuisines, getCuisineBySlug, getCuisineItems } = require('../models/cuisineModel');
const cache = require('../services/cacheService');
const { setCatalogHttpCache } = require('../middleware/cacheMiddleware');

const listCuisines = async (req, res) => {
  try {
    const key = cache.cacheKey('cuisines:all', {});
    const { data: cuisines, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_CUISINES || 300),
      () => getAllCuisines()
    );
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Cuisines retrieved', data: cuisines });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getCuisine = async (req, res) => {
  try {
    const key = cache.cacheKey('cuisines:slug', { slug: req.params.slug });
    const { data: cuisine, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_CUISINES || 300),
      () => getCuisineBySlug(req.params.slug)
    );
    if (!cuisine) {
      return res.status(404).json({ success: false, message: 'Cuisine not found', error: {} });
    }
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Cuisine retrieved', data: cuisine });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getItems = async (req, res) => {
  try {
    const key = cache.cacheKey('cuisines:items', { slug: req.params.slug });
    const { data: items, cache: status } = await cache.wrap(
      key,
      Number(process.env.CACHE_TTL_CUISINES || 180),
      async () => {
        const cuisine = await getCuisineBySlug(req.params.slug);
        if (!cuisine) return null;
        return getCuisineItems(req.params.slug);
      }
    );
    if (!items) {
      return res.status(404).json({ success: false, message: 'Cuisine not found', error: {} });
    }
    setCatalogHttpCache(res, status);
    res.json({ success: true, message: 'Cuisine items retrieved', data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { listCuisines, getCuisine, getItems };
