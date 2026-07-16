const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require('../models/restaurantModel');
const { getMenuItemsByRestaurant } = require('../models/menuItemModel');

const getAll = async (req, res) => {
  try {
    const result = await getRestaurants(req.query);
    res.json({ success: true, message: 'Restaurants retrieved', data: result.restaurants, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await getRestaurantById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found', error: {} });

    res.json({ success: true, message: 'Restaurant retrieved', data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getMenu = async (req, res) => {
  try {
    const { id } = req.params; // restaurant ID
    const menuItems = await getMenuItemsByRestaurant(id);
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

    const updatedRestaurant = await updateRestaurant(id, req.body);
    res.json({ success: true, message: 'Restaurant updated', data: updatedRestaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await getRestaurantById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found', error: {} });

    await deleteRestaurant(id);
    res.json({ success: true, message: 'Restaurant deleted', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, getById, getMenu, create, update, remove };
