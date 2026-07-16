const { getAllCuisines, getCuisineBySlug, getCuisineItems } = require('../models/cuisineModel');

const listCuisines = async (req, res) => {
  try {
    const cuisines = await getAllCuisines();
    res.json({ success: true, message: 'Cuisines retrieved', data: cuisines });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getCuisine = async (req, res) => {
  try {
    const cuisine = await getCuisineBySlug(req.params.slug);
    if (!cuisine) {
      return res.status(404).json({ success: false, message: 'Cuisine not found', error: {} });
    }
    res.json({ success: true, message: 'Cuisine retrieved', data: cuisine });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getItems = async (req, res) => {
  try {
    const cuisine = await getCuisineBySlug(req.params.slug);
    if (!cuisine) {
      return res.status(404).json({ success: false, message: 'Cuisine not found', error: {} });
    }
    const items = await getCuisineItems(req.params.slug);
    res.json({ success: true, message: 'Cuisine items retrieved', data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { listCuisines, getCuisine, getItems };
