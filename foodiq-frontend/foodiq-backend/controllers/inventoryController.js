const { pool } = require('../config/db');
const { getRestaurantByOwnerId } = require('../models/partnerModel');
const inventory = require('../models/inventoryModel');
const { notifyInventoryAlerts } = require('../services/inventoryService');

const PARTNER_ROLES = ['restaurant_owner', 'admin'];

const requirePartnerRestaurant = async (req, res) => {
  if (!PARTNER_ROLES.includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Partner access only', error: {} });
    return null;
  }
  if (req.user.role === 'admin' && req.query.restaurant_id) {
    const { rows } = await pool.query('SELECT * FROM restaurants WHERE id = $1', [
      req.query.restaurant_id,
    ]);
    if (!rows[0]) {
      res.status(404).json({ success: false, message: 'Restaurant not found', error: {} });
      return null;
    }
    return rows[0];
  }
  const restaurant = await getRestaurantByOwnerId(req.user.id);
  if (!restaurant) {
    res.status(404).json({
      success: false,
      message: 'No restaurant linked to this partner account',
      error: {},
    });
    return null;
  }
  return restaurant;
};

const ok = (res, message, data) => res.json({ success: true, message, data });

const getOverview = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const [items, alerts, kitchenStats] = await Promise.all([
      inventory.listItems(restaurant.id),
      inventory.getAlerts(restaurant.id),
      inventory.getKitchenStats(restaurant.id),
    ]);
    ok(res, 'Inventory overview', {
      items,
      alerts,
      kitchen: kitchenStats,
      item_count: items.length,
      alert_count: alerts.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const getItems = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    ok(res, 'Inventory items', await inventory.listItems(restaurant.id));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const postItem = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const item = await inventory.createItem(restaurant.id, req.body);
    await inventory.markMenuItemsFromRecipes(restaurant.id);
    await notifyInventoryAlerts(restaurant.id);
    ok(res, 'Inventory item created', item);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const putItem = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const item = await inventory.updateItem(req.params.id, restaurant.id, req.body);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found', error: {} });
    await inventory.markMenuItemsFromRecipes(restaurant.id);
    await notifyInventoryAlerts(restaurant.id);
    ok(res, 'Inventory item updated', item);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const removeItem = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    await inventory.deleteItem(req.params.id, restaurant.id);
    ok(res, 'Inventory item deleted', { id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const getCategories = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    ok(res, 'Categories', await inventory.listCategories(restaurant.id));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const postCategory = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    if (!req.body.name) {
      return res.status(400).json({ success: false, message: 'Category name required', error: {} });
    }
    ok(res, 'Category created', await inventory.createCategory(restaurant.id, req.body.name));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const getAlerts = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    ok(res, 'Inventory alerts', await inventory.getAlerts(restaurant.id));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    ok(res, 'Suppliers', await inventory.listSuppliers(restaurant.id));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const postSupplier = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    ok(res, 'Supplier created', await inventory.createSupplier(restaurant.id, req.body));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const putSupplier = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const row = await inventory.updateSupplier(req.params.id, restaurant.id, req.body);
    if (!row) return res.status(404).json({ success: false, message: 'Supplier not found', error: {} });
    ok(res, 'Supplier updated', row);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const removeSupplier = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    await inventory.deleteSupplier(req.params.id, restaurant.id);
    ok(res, 'Supplier deleted', { id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const getRecipes = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    ok(res, 'Recipes', await inventory.listRecipes(restaurant.id));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const putRecipe = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const rows = await inventory.setRecipeIngredients(
      req.params.menuItemId,
      restaurant.id,
      req.body.ingredients || []
    );
    if (rows === null) {
      return res.status(404).json({ success: false, message: 'Menu item not found', error: {} });
    }
    await inventory.markMenuItemsFromRecipes(restaurant.id);
    ok(res, 'Recipe updated', rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const getPurchases = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    ok(res, 'Purchase orders', await inventory.listPurchases(restaurant.id));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const postPurchase = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    ok(res, 'Purchase order created', await inventory.createPurchase(restaurant.id, req.body));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const receivePurchase = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const po = await inventory.receivePurchase(req.params.id, restaurant.id);
    await inventory.markMenuItemsFromRecipes(restaurant.id);
    await notifyInventoryAlerts(restaurant.id);
    ok(res, 'Stock received', po);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message, error: {} });
  }
};

const getKitchen = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const [orders, stats] = await Promise.all([
      inventory.getKitchenOrders(restaurant.id),
      inventory.getKitchenStats(restaurant.id),
    ]);
    ok(res, 'Kitchen dashboard', { orders, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const getReports = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    ok(res, 'Inventory reports', await inventory.getReports(restaurant.id));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

const postWastage = async (req, res) => {
  try {
    const restaurant = await requirePartnerRestaurant(req, res);
    if (!restaurant) return;
    const { inventory_item_id, quantity, notes } = req.body;
    await inventory.adjustQuantity(inventory_item_id, restaurant.id, -Math.abs(Number(quantity)));
    await inventory.recordTransaction({
      restaurant_id: restaurant.id,
      inventory_item_id,
      transaction_type: 'wastage',
      quantity: -Math.abs(Number(quantity)),
      notes,
    });
    await inventory.markMenuItemsFromRecipes(restaurant.id);
    ok(res, 'Wastage recorded', { inventory_item_id, quantity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: {} });
  }
};

module.exports = {
  getOverview,
  getItems,
  postItem,
  putItem,
  removeItem,
  getCategories,
  postCategory,
  getAlerts,
  getSuppliers,
  postSupplier,
  putSupplier,
  removeSupplier,
  getRecipes,
  putRecipe,
  getPurchases,
  postPurchase,
  receivePurchase,
  getKitchen,
  getReports,
  postWastage,
};
