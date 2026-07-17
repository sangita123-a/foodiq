const { pool } = require('../config/db');

/**
 * Ensures critical columns/tables exist so checkout and related flows
 * work even if migrations were not run manually.
 */
async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_instructions TEXT
    `);
    await client.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS offer_id UUID,
        ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(20) DEFAULT 'Now',
        ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE
    `);
    await client.query(`
      ALTER TABLE restaurant_categories
        ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE restaurants
        ADD COLUMN IF NOT EXISTS slug VARCHAR(160),
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS banner_url TEXT,
        ADD COLUMN IF NOT EXISTS distance_km NUMERIC(5,2) DEFAULT 2.5,
        ADD COLUMN IF NOT EXISTS offer_text VARCHAR(160)
    `);
    await client.query(`
      ALTER TABLE menu_items
        ADD COLUMN IF NOT EXISTS slug VARCHAR(180),
        ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 4.5,
        ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS ingredients TEXT,
        ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb
    `);

    // Ensure the Burger cuisine exists. Dish membership is owned by the
    // idempotent catalog sync so cuisines never leak items into each other.
    const fastFood = await client.query(
      `SELECT id FROM restaurant_categories WHERE slug = 'fast-food' LIMIT 1`
    );
    if (fastFood.rows[0]) {
      await client.query(
        `INSERT INTO restaurant_categories (name, slug, description, image_url, sort_order)
         SELECT 'Burger', 'burger', 'Juicy burgers, fries and loaded sandwiches',
                '/images/catalog/cuisines/burger.webp', 16
         WHERE NOT EXISTS (SELECT 1 FROM restaurant_categories WHERE slug = 'burger')`
      );

    }

    console.log('[SCHEMA] Critical schema checks completed');
  } catch (err) {
    console.error('[SCHEMA] ensureSchema warning:', err.message);
  } finally {
    client.release();
  }
}

module.exports = ensureSchema;
