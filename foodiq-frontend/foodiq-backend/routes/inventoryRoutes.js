const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/inventoryController');

router.use(protect);
router.use(authorize('restaurant_owner', 'admin'));

router.get('/overview', c.getOverview);
router.get('/items', c.getItems);
router.post('/items', c.postItem);
router.put('/items/:id', c.putItem);
router.delete('/items/:id', c.removeItem);
router.get('/categories', c.getCategories);
router.post('/categories', c.postCategory);
router.get('/alerts', c.getAlerts);

router.get('/suppliers', c.getSuppliers);
router.post('/suppliers', c.postSupplier);
router.put('/suppliers/:id', c.putSupplier);
router.delete('/suppliers/:id', c.removeSupplier);

router.get('/recipes', c.getRecipes);
router.put('/recipes/:menuItemId', c.putRecipe);

router.get('/purchases', c.getPurchases);
router.post('/purchases', c.postPurchase);
router.post('/purchases/:id/receive', c.receivePurchase);

router.get('/kitchen', c.getKitchen);
router.get('/reports', c.getReports);
router.post('/wastage', c.postWastage);

module.exports = router;
