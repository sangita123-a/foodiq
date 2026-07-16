/**
 * Adds slug/sort_order to categories and cuisine_items mapping table.
 * Run: node database/migrate_cuisines.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE restaurant_categories
        ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cuisine_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cuisine_id UUID NOT NULL REFERENCES restaurant_categories(id) ON DELETE CASCADE,
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        UNIQUE(cuisine_id, menu_item_id)
      )
    `);

    await client.query('COMMIT');
    console.log('Cuisines migration completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cuisines migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
