const { pool } = require('../config/db');
const inventory = require('../models/inventoryModel');
const { createNotification } = require('../models/notificationModel');

const deductInventoryForOrder = async (orderId, restaurantId) => {
  if (await inventory.hasOrderDeduction(orderId)) return { skipped: true };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const itemsRes = await client.query(
      `SELECT oi.menu_item_id, oi.quantity FROM order_items oi WHERE oi.order_id = $1`,
      [orderId]
    );

    for (const line of itemsRes.rows) {
      const recipes = await inventory.getRecipesForMenuItem(line.menu_item_id);
      for (const recipe of recipes) {
        const deductQty = Number(recipe.quantity_required) * Number(line.quantity);
        await inventory.adjustQuantity(
          recipe.inventory_item_id,
          recipe.restaurant_id,
          -deductQty,
          client
        );
        await inventory.recordTransaction(
          {
            restaurant_id: recipe.restaurant_id,
            inventory_item_id: recipe.inventory_item_id,
            transaction_type: 'consumption',
            quantity: -deductQty,
            reference_id: orderId,
            notes: `Order ${String(orderId).slice(0, 8)}`,
          },
          client
        );
      }
    }

    await inventory.markMenuItemsFromRecipes(restaurantId, client);
    await client.query('COMMIT');

    await notifyInventoryAlerts(restaurantId);
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.warn('[inventory] deduct failed:', err.message);
    return { error: err.message };
  } finally {
    client.release();
  }
};

const notifyInventoryAlerts = async (restaurantId) => {
  try {
    const alerts = await inventory.getAlerts(restaurantId);
    if (!alerts.length) return;

    const ownerRes = await pool.query(`SELECT owner_id, name FROM restaurants WHERE id = $1`, [
      restaurantId,
    ]);
    const ownerId = ownerRes.rows[0]?.owner_id;
    if (!ownerId) return;

    const outOfStock = alerts.filter((a) => a.alert_type === 'out_of_stock');
    const lowStock = alerts.filter((a) => a.alert_type === 'low_stock');
    const expiring = alerts.filter((a) =>
      ['expiring_soon', 'expired'].includes(a.alert_type)
    );

    if (outOfStock.length) {
      await createNotification(
        ownerId,
        'inventory_alert',
        'Out of Stock',
        `${outOfStock.length} ingredient(s) out of stock: ${outOfStock.map((a) => a.name).slice(0, 3).join(', ')}`,
        { link: '/partner/inventory', restaurant_id: restaurantId, alert_type: 'out_of_stock' }
      );
    }
    if (lowStock.length) {
      await createNotification(
        ownerId,
        'low_stock',
        'Low Stock Alert',
        `${lowStock.length} ingredient(s) running low. Restock soon.`,
        { link: '/partner/inventory', restaurant_id: restaurantId, alert_type: 'low_stock' }
      );
    }
    if (expiring.length) {
      await createNotification(
        ownerId,
        'inventory_alert',
        'Expiring Soon',
        `${expiring.length} item(s) expiring within 7 days.`,
        { link: '/partner/inventory', restaurant_id: restaurantId, alert_type: 'expiring_soon' }
      );
    }
  } catch (err) {
    console.warn('[inventory] alert notify skipped:', err.message);
  }
};

const trackKitchenStatus = async (orderId, restaurantId, dbStatus) => {
  const s = String(dbStatus || '').toLowerCase();
  if (s === 'preparing') await inventory.upsertKitchenTimer(orderId, restaurantId, 'started');
  if (s === 'ready for pickup') await inventory.upsertKitchenTimer(orderId, restaurantId, 'ready');
  if (s === 'delivered') await inventory.upsertKitchenTimer(orderId, restaurantId, 'completed');
};

module.exports = {
  deductInventoryForOrder,
  notifyInventoryAlerts,
  trackKitchenStatus,
};
