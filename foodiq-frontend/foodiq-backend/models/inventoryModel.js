const { pool } = require('../config/db');

const listCategories = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT * FROM inventory_categories WHERE restaurant_id = $1 ORDER BY name`,
    [restaurantId]
  );
  return rows;
};

const createCategory = async (restaurantId, name) => {
  const { rows } = await pool.query(
    `INSERT INTO inventory_categories (restaurant_id, name) VALUES ($1, $2)
     ON CONFLICT (restaurant_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [restaurantId, name]
  );
  return rows[0];
};

const listItems = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT i.*, c.name AS category_name, s.name AS supplier_name,
            CASE
              WHEN i.quantity <= 0 THEN 'out_of_stock'
              WHEN i.quantity <= i.reorder_level THEN 'low_stock'
              WHEN i.expiry_date IS NOT NULL AND i.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
              ELSE 'ok'
            END AS stock_status
     FROM restaurant_inventory_items i
     LEFT JOIN inventory_categories c ON c.id = i.category_id
     LEFT JOIN inventory_suppliers s ON s.id = i.supplier_id
     WHERE i.restaurant_id = $1
     ORDER BY i.name`,
    [restaurantId]
  );
  return rows;
};

const getItem = async (id, restaurantId) => {
  const { rows } = await pool.query(
    `SELECT * FROM restaurant_inventory_items WHERE id = $1 AND restaurant_id = $2`,
    [id, restaurantId]
  );
  return rows[0] || null;
};

const createItem = async (restaurantId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO restaurant_inventory_items
       (restaurant_id, category_id, name, quantity, unit, purchase_price, supplier_id, expiry_date, reorder_level)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      restaurantId,
      data.category_id || null,
      data.name,
      data.quantity ?? 0,
      data.unit || 'pieces',
      data.purchase_price ?? 0,
      data.supplier_id || null,
      data.expiry_date || null,
      data.reorder_level ?? 5,
    ]
  );
  return rows[0];
};

const updateItem = async (id, restaurantId, data) => {
  const { rows } = await pool.query(
    `UPDATE restaurant_inventory_items SET
       category_id = COALESCE($3, category_id),
       name = COALESCE($4, name),
       quantity = COALESCE($5, quantity),
       unit = COALESCE($6, unit),
       purchase_price = COALESCE($7, purchase_price),
       supplier_id = COALESCE($8, supplier_id),
       expiry_date = COALESCE($9, expiry_date),
       reorder_level = COALESCE($10, reorder_level),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND restaurant_id = $2 RETURNING *`,
    [
      id,
      restaurantId,
      data.category_id,
      data.name,
      data.quantity,
      data.unit,
      data.purchase_price,
      data.supplier_id,
      data.expiry_date,
      data.reorder_level,
    ]
  );
  return rows[0] || null;
};

const deleteItem = async (id, restaurantId) => {
  await pool.query(
    `DELETE FROM restaurant_inventory_items WHERE id = $1 AND restaurant_id = $2`,
    [id, restaurantId]
  );
};

const adjustQuantity = async (id, restaurantId, delta, client = pool) => {
  const { rows } = await client.query(
    `UPDATE restaurant_inventory_items SET
       quantity = GREATEST(0, quantity + $3),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND restaurant_id = $2 RETURNING *`,
    [id, restaurantId, delta]
  );
  return rows[0] || null;
};

const recordTransaction = async (data, client = pool) => {
  await client.query(
    `INSERT INTO inventory_transactions
       (restaurant_id, inventory_item_id, transaction_type, quantity, reference_id, notes)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      data.restaurant_id,
      data.inventory_item_id,
      data.transaction_type,
      data.quantity,
      data.reference_id || null,
      data.notes || null,
    ]
  );
};

const listSuppliers = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT s.*,
            (SELECT COUNT(*)::int FROM inventory_purchase_orders p WHERE p.supplier_id = s.id) AS purchase_count
     FROM inventory_suppliers s
     WHERE s.restaurant_id = $1 ORDER BY s.name`,
    [restaurantId]
  );
  return rows;
};

const createSupplier = async (restaurantId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO inventory_suppliers (restaurant_id, name, contact_person, phone, email, address)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [restaurantId, data.name, data.contact_person, data.phone, data.email, data.address]
  );
  return rows[0];
};

const updateSupplier = async (id, restaurantId, data) => {
  const { rows } = await pool.query(
    `UPDATE inventory_suppliers SET
       name = COALESCE($3, name),
       contact_person = COALESCE($4, contact_person),
       phone = COALESCE($5, phone),
       email = COALESCE($6, email),
       address = COALESCE($7, address),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND restaurant_id = $2 RETURNING *`,
    [id, restaurantId, data.name, data.contact_person, data.phone, data.email, data.address]
  );
  return rows[0] || null;
};

const deleteSupplier = async (id, restaurantId) => {
  await pool.query(`DELETE FROM inventory_suppliers WHERE id = $1 AND restaurant_id = $2`, [
    id,
    restaurantId,
  ]);
};

const listRecipes = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT m.id AS menu_item_id, m.name AS menu_item_name, m.price, m.is_available,
            COALESCE(json_agg(json_build_object(
              'id', r.id,
              'inventory_item_id', r.inventory_item_id,
              'ingredient_name', i.name,
              'quantity_required', r.quantity_required,
              'unit', COALESCE(r.unit, i.unit),
              'available_qty', i.quantity
            )) FILTER (WHERE r.id IS NOT NULL), '[]') AS ingredients
     FROM menu_items m
     LEFT JOIN recipe_ingredients r ON r.menu_item_id = m.id
     LEFT JOIN restaurant_inventory_items i ON i.id = r.inventory_item_id
     WHERE m.restaurant_id = $1
     GROUP BY m.id ORDER BY m.name`,
    [restaurantId]
  );
  return rows;
};

const setRecipeIngredients = async (menuItemId, restaurantId, ingredients) => {
  const check = await pool.query(
    `SELECT id FROM menu_items WHERE id = $1 AND restaurant_id = $2`,
    [menuItemId, restaurantId]
  );
  if (!check.rows[0]) return null;

  await pool.query(`DELETE FROM recipe_ingredients WHERE menu_item_id = $1`, [menuItemId]);

  for (const ing of ingredients) {
    await pool.query(
      `INSERT INTO recipe_ingredients (menu_item_id, inventory_item_id, quantity_required, unit)
       VALUES ($1,$2,$3,$4)`,
      [menuItemId, ing.inventory_item_id, ing.quantity_required, ing.unit || null]
    );
  }

  const { rows } = await pool.query(
    `SELECT r.*, i.name AS ingredient_name, i.quantity AS available_qty
     FROM recipe_ingredients r
     JOIN restaurant_inventory_items i ON i.id = r.inventory_item_id
     WHERE r.menu_item_id = $1`,
    [menuItemId]
  );
  return rows;
};

const getRecipesForMenuItem = async (menuItemId) => {
  const { rows } = await pool.query(
    `SELECT r.*, i.name AS ingredient_name, i.quantity AS available_qty, i.restaurant_id
     FROM recipe_ingredients r
     JOIN restaurant_inventory_items i ON i.id = r.inventory_item_id
     WHERE r.menu_item_id = $1`,
    [menuItemId]
  );
  return rows;
};

const listPurchases = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT p.*, s.name AS supplier_name,
            (SELECT COUNT(*)::int FROM inventory_purchase_items pi WHERE pi.purchase_order_id = p.id) AS item_count
     FROM inventory_purchase_orders p
     LEFT JOIN inventory_suppliers s ON s.id = p.supplier_id
     WHERE p.restaurant_id = $1 ORDER BY p.created_at DESC`,
    [restaurantId]
  );
  return rows;
};

const getPurchase = async (id, restaurantId) => {
  const { rows } = await pool.query(
    `SELECT p.*, s.name AS supplier_name FROM inventory_purchase_orders p
     LEFT JOIN inventory_suppliers s ON s.id = p.supplier_id
     WHERE p.id = $1 AND p.restaurant_id = $2`,
    [id, restaurantId]
  );
  if (!rows[0]) return null;
  const items = await pool.query(
    `SELECT pi.*, i.name AS inventory_name FROM inventory_purchase_items pi
     LEFT JOIN restaurant_inventory_items i ON i.id = pi.inventory_item_id
     WHERE pi.purchase_order_id = $1`,
    [id]
  );
  return { ...rows[0], items: items.rows };
};

const createPurchase = async (restaurantId, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const total = (data.items || []).reduce(
      (sum, it) => sum + Number(it.quantity) * Number(it.unit_price || 0),
      0
    );
    const { rows } = await client.query(
      `INSERT INTO inventory_purchase_orders (restaurant_id, supplier_id, status, total_amount, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [restaurantId, data.supplier_id || null, data.status || 'draft', total, data.notes || null]
    );
    const po = rows[0];
    for (const it of data.items || []) {
      await client.query(
        `INSERT INTO inventory_purchase_items
           (purchase_order_id, inventory_item_id, item_name, quantity, unit, unit_price)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [po.id, it.inventory_item_id || null, it.item_name, it.quantity, it.unit || 'pieces', it.unit_price || 0]
      );
    }
    await client.query('COMMIT');
    return getPurchase(po.id, restaurantId);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const receivePurchase = async (id, restaurantId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const poRes = await client.query(
      `SELECT * FROM inventory_purchase_orders WHERE id = $1 AND restaurant_id = $2 FOR UPDATE`,
      [id, restaurantId]
    );
    const po = poRes.rows[0];
    if (!po) throw Object.assign(new Error('Purchase order not found'), { status: 404 });
    if (po.status === 'received') throw Object.assign(new Error('Already received'), { status: 400 });

    const items = await client.query(
      `SELECT * FROM inventory_purchase_items WHERE purchase_order_id = $1`,
      [id]
    );

    for (const it of items.rows) {
      if (it.inventory_item_id) {
        await adjustQuantity(it.inventory_item_id, restaurantId, Number(it.quantity), client);
        await recordTransaction(
          {
            restaurant_id: restaurantId,
            inventory_item_id: it.inventory_item_id,
            transaction_type: 'purchase',
            quantity: Number(it.quantity),
            reference_id: id,
            notes: `PO received`,
          },
          client
        );
      }
    }

    await client.query(
      `UPDATE inventory_purchase_orders SET status = 'received', received_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
    await client.query('COMMIT');
    return getPurchase(id, restaurantId);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const getAlerts = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT *, CASE
       WHEN quantity <= 0 THEN 'out_of_stock'
       WHEN quantity <= reorder_level THEN 'low_stock'
       WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE THEN 'expired'
       WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
     END AS alert_type
     FROM restaurant_inventory_items
     WHERE restaurant_id = $1 AND (
       quantity <= reorder_level OR
       (expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '7 days')
     )
     ORDER BY quantity ASC, expiry_date ASC NULLS LAST`,
    [restaurantId]
  );
  return rows;
};

const getKitchenOrders = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.total_amount, o.created_at, ot.current_status AS status,
            u.full_name AS customer_name,
            k.started_at, k.ready_at, k.completed_at, k.prep_minutes,
            COALESCE(json_agg(json_build_object(
              'name', mi.name, 'quantity', oi.quantity
            )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o
     JOIN order_tracking ot ON ot.order_id = o.id
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
     LEFT JOIN kitchen_order_timers k ON k.order_id = o.id
     WHERE o.restaurant_id = $1
       AND ot.current_status IN ('Pending','Accepted','Preparing','Ready for Pickup','Delivered')
       AND o.created_at > NOW() - INTERVAL '24 hours'
     GROUP BY o.id, ot.current_status, u.full_name, k.started_at, k.ready_at, k.completed_at, k.prep_minutes
     ORDER BY o.created_at DESC`,
    [restaurantId]
  );
  return rows;
};

const upsertKitchenTimer = async (orderId, restaurantId, field) => {
  const now = new Date();
  const col = field === 'started' ? 'started_at' : field === 'ready' ? 'ready_at' : 'completed_at';
  await pool.query(
    `INSERT INTO kitchen_order_timers (order_id, restaurant_id, ${col})
     VALUES ($1,$2,$3)
     ON CONFLICT (order_id) DO UPDATE SET ${col} = EXCLUDED.${col}`,
    [orderId, restaurantId, now]
  );
  if (field === 'completed') {
    await pool.query(
      `UPDATE kitchen_order_timers SET prep_minutes = EXTRACT(EPOCH FROM (ready_at - started_at)) / 60
       WHERE order_id = $1 AND started_at IS NOT NULL AND ready_at IS NOT NULL`,
      [orderId]
    );
  }
};

const getKitchenStats = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE ot.current_status = 'Pending')::int AS new_orders,
       COUNT(*) FILTER (WHERE ot.current_status IN ('Accepted','Preparing'))::int AS preparing,
       COUNT(*) FILTER (WHERE ot.current_status = 'Ready for Pickup')::int AS ready,
       COUNT(*) FILTER (WHERE ot.current_status = 'Delivered' AND o.created_at > CURRENT_DATE)::int AS completed_today,
       COALESCE(AVG(k.prep_minutes) FILTER (WHERE k.prep_minutes IS NOT NULL), 0) AS avg_prep_minutes
     FROM orders o
     JOIN order_tracking ot ON ot.order_id = o.id
     LEFT JOIN kitchen_order_timers k ON k.order_id = o.id
     WHERE o.restaurant_id = $1 AND o.created_at > NOW() - INTERVAL '24 hours'`,
    [restaurantId]
  );
  return rows[0];
};

const getReports = async (restaurantId) => {
  const [daily, weekly, monthly, wastage, lowStock, value, topUsed, leastUsed, foodCost] =
    await Promise.all([
      pool.query(
        `SELECT DATE(created_at) AS day, SUM(ABS(quantity)) AS consumed
         FROM inventory_transactions
         WHERE restaurant_id = $1 AND transaction_type = 'consumption'
           AND created_at > NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at) ORDER BY day`,
        [restaurantId]
      ),
      pool.query(
        `SELECT DATE_TRUNC('week', created_at) AS week_start, SUM(ABS(quantity)) AS consumed
         FROM inventory_transactions
         WHERE restaurant_id = $1 AND transaction_type = 'consumption'
           AND created_at > NOW() - INTERVAL '8 weeks'
         GROUP BY week_start ORDER BY week_start`,
        [restaurantId]
      ),
      pool.query(
        `SELECT DATE_TRUNC('month', created_at) AS month_start, SUM(ABS(quantity)) AS consumed
         FROM inventory_transactions
         WHERE restaurant_id = $1 AND transaction_type = 'consumption'
           AND created_at > NOW() - INTERVAL '6 months'
         GROUP BY month_start ORDER BY month_start`,
        [restaurantId]
      ),
      pool.query(
        `SELECT i.name, SUM(t.quantity) AS wasted
         FROM inventory_transactions t
         JOIN restaurant_inventory_items i ON i.id = t.inventory_item_id
         WHERE t.restaurant_id = $1 AND t.transaction_type = 'wastage'
           AND t.created_at > NOW() - INTERVAL '30 days'
         GROUP BY i.name ORDER BY wasted DESC LIMIT 10`,
        [restaurantId]
      ),
      pool.query(
        `SELECT name, quantity, unit, reorder_level FROM restaurant_inventory_items
         WHERE restaurant_id = $1 AND quantity <= reorder_level ORDER BY quantity`,
        [restaurantId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(quantity * purchase_price), 0) AS total_value
         FROM restaurant_inventory_items WHERE restaurant_id = $1`,
        [restaurantId]
      ),
      pool.query(
        `SELECT i.name, SUM(ABS(t.quantity)) AS total_used
         FROM inventory_transactions t
         JOIN restaurant_inventory_items i ON i.id = t.inventory_item_id
         WHERE t.restaurant_id = $1 AND t.transaction_type = 'consumption'
           AND t.created_at > NOW() - INTERVAL '30 days'
         GROUP BY i.name ORDER BY total_used DESC LIMIT 10`,
        [restaurantId]
      ),
      pool.query(
        `SELECT i.name, COALESCE(SUM(ABS(t.quantity)), 0) AS total_used
         FROM restaurant_inventory_items i
         LEFT JOIN inventory_transactions t ON t.inventory_item_id = i.id
           AND t.transaction_type = 'consumption' AND t.created_at > NOW() - INTERVAL '30 days'
         WHERE i.restaurant_id = $1
         GROUP BY i.id, i.name ORDER BY total_used ASC LIMIT 10`,
        [restaurantId]
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(oi.quantity * COALESCE(ri.quantity_required, 0) * COALESCE(inv.purchase_price, 0)), 0) AS ingredient_cost,
           COALESCE(SUM(oi.quantity * oi.price_at_time), 0) AS revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         LEFT JOIN recipe_ingredients ri ON ri.menu_item_id = oi.menu_item_id
         LEFT JOIN restaurant_inventory_items inv ON inv.id = ri.inventory_item_id
         WHERE o.restaurant_id = $1 AND o.created_at > NOW() - INTERVAL '30 days'`,
        [restaurantId]
      ),
    ]);

  const fc = foodCost.rows[0] || {};
  const revenue = Number(fc.revenue) || 0;
  const ingredientCost = Number(fc.ingredient_cost) || 0;

  return {
    daily_consumption: daily.rows,
    weekly_consumption: weekly.rows,
    monthly_consumption: monthly.rows,
    wastage: wastage.rows,
    low_stock: lowStock.rows,
    inventory_value: Number(value.rows[0]?.total_value || 0),
    most_consumed: topUsed.rows,
    least_used: leastUsed.rows,
    food_cost_percent: revenue > 0 ? (ingredientCost / revenue) * 100 : 0,
    inventory_turnover: ingredientCost > 0 ? revenue / ingredientCost : 0,
  };
};

const adminInventoryOverview = async () => {
  const { rows } = await pool.query(
    `SELECT r.id, r.name, r.is_active,
            COUNT(DISTINCT i.id)::int AS item_count,
            COUNT(DISTINCT i.id) FILTER (WHERE i.quantity <= 0)::int AS out_of_stock,
            COUNT(DISTINCT i.id) FILTER (WHERE i.quantity > 0 AND i.quantity <= i.reorder_level)::int AS low_stock,
            COALESCE(SUM(i.quantity * i.purchase_price), 0) AS inventory_value,
            COUNT(DISTINCT m.id) FILTER (WHERE m.is_available = FALSE)::int AS unavailable_dishes
     FROM restaurants r
     LEFT JOIN restaurant_inventory_items i ON i.restaurant_id = r.id
     LEFT JOIN menu_items m ON m.restaurant_id = r.id
     GROUP BY r.id ORDER BY r.name`
  );
  return rows;
};

const markMenuItemsFromRecipes = async (restaurantId, client = pool) => {
  await client.query(
    `UPDATE menu_items m SET is_available = FALSE, updated_at = CURRENT_TIMESTAMP
     WHERE m.restaurant_id = $1 AND EXISTS (
       SELECT 1 FROM recipe_ingredients r
       JOIN restaurant_inventory_items i ON i.id = r.inventory_item_id
       WHERE r.menu_item_id = m.id AND i.quantity < r.quantity_required
     )`,
    [restaurantId]
  );
  await client.query(
    `UPDATE menu_items m SET is_available = TRUE, updated_at = CURRENT_TIMESTAMP
     WHERE m.restaurant_id = $1 AND is_available = FALSE AND NOT EXISTS (
       SELECT 1 FROM recipe_ingredients r
       JOIN restaurant_inventory_items i ON i.id = r.inventory_item_id
       WHERE r.menu_item_id = m.id AND i.quantity < r.quantity_required
     ) AND EXISTS (SELECT 1 FROM recipe_ingredients r2 WHERE r2.menu_item_id = m.id)`,
    [restaurantId]
  );
};

const hasOrderDeduction = async (orderId, client = pool) => {
  const { rows } = await client.query(
    `SELECT 1 FROM inventory_transactions
     WHERE reference_id = $1 AND transaction_type = 'consumption' LIMIT 1`,
    [orderId]
  );
  return !!rows[0];
};

module.exports = {
  listCategories,
  createCategory,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  adjustQuantity,
  recordTransaction,
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  listRecipes,
  setRecipeIngredients,
  getRecipesForMenuItem,
  listPurchases,
  getPurchase,
  createPurchase,
  receivePurchase,
  getAlerts,
  getKitchenOrders,
  upsertKitchenTimer,
  getKitchenStats,
  getReports,
  adminInventoryOverview,
  markMenuItemsFromRecipes,
  hasOrderDeduction,
};
