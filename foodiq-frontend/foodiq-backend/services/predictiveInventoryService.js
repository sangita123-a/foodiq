const { pool } = require('../config/db');

/**
 * Suggest reorders for items below reorder_level (or low qty).
 */
const generateSuggestions = async () => {
  const { rows } = await pool.query(
    `SELECT id, quantity, reorder_level, menu_item_id
     FROM inventory_items
     WHERE reorder_level IS NOT NULL AND quantity <= reorder_level
     LIMIT 50`
  ).catch(async () => {
    const alt = await pool.query(
      `SELECT id, quantity, menu_item_id FROM inventory_items WHERE quantity < 10 LIMIT 50`
    );
    return alt;
  });

  const created = [];
  for (const item of rows) {
    const suggested = Math.max(
      Number(item.reorder_level || 20) - Number(item.quantity || 0),
      5
    );
    const { rows: ins } = await pool.query(
      `INSERT INTO inventory_reorder_suggestions (inventory_item_id, suggested_qty, reason, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [item.id, suggested, 'Below reorder level / predictive foundation']
    );
    created.push(ins[0]);
  }
  return { suggestions: created, count: created.length };
};

const listSuggestions = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM inventory_reorder_suggestions ORDER BY created_at DESC LIMIT 100`
  );
  return rows;
};

module.exports = { generateSuggestions, listSuggestions };
