const { pool } = require('../config/db');
const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require('../models/favoriteModel');

const getAll = async (req, res) => {
  try {
    const [items, restaurants] = await Promise.all([
      getFavorites(req.user.id),
      pool.query(
        `SELECT rf.id AS favorite_id, r.*
         FROM restaurant_favorites rf
         JOIN restaurants r ON rf.restaurant_id = r.id
         WHERE rf.user_id = $1
         ORDER BY rf.created_at DESC`,
        [req.user.id]
      ),
    ]);
    res.json({
      success: true,
      message: 'Favorites retrieved',
      data: { items, restaurants: restaurants.rows },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const add = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    await addFavorite(req.user.id, menuItemId);
    res.status(201).json({ success: true, message: 'Item added to favorites', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    await removeFavorite(req.user.id, menuItemId);
    res.json({ success: true, message: 'Item removed from favorites', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const addRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    await pool.query(
      `INSERT INTO restaurant_favorites (user_id, restaurant_id)
       VALUES ($1, $2) ON CONFLICT (user_id, restaurant_id) DO NOTHING`,
      [req.user.id, restaurantId]
    );
    res.status(201).json({ success: true, message: 'Restaurant added to favorites', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const removeRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    await pool.query(
      'DELETE FROM restaurant_favorites WHERE user_id = $1 AND restaurant_id = $2',
      [req.user.id, restaurantId]
    );
    res.json({ success: true, message: 'Restaurant removed from favorites', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, add, remove, addRestaurant, removeRestaurant };
