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
      ADD COLUMN IF NOT EXISTS offer_id UUID
    `);
    await client.query(`
      ALTER TABLE restaurant_categories
        ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);

    // Burger cuisine alias (shares Fast Food dishes when present)
    const fastFood = await client.query(
      `SELECT id FROM restaurant_categories WHERE slug = 'fast-food' LIMIT 1`
    );
    if (fastFood.rows[0]) {
      await client.query(
        `INSERT INTO restaurant_categories (name, slug, description, image_url, sort_order)
         SELECT 'Burger', 'burger', 'Juicy burgers, fries and loaded sandwiches',
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 16
         WHERE NOT EXISTS (SELECT 1 FROM restaurant_categories WHERE slug = 'burger')`
      );

      const burger = await client.query(
        `SELECT id FROM restaurant_categories WHERE slug = 'burger' LIMIT 1`
      );
      if (burger.rows[0]) {
        await client.query(`
          CREATE TABLE IF NOT EXISTS cuisine_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            cuisine_id UUID NOT NULL REFERENCES restaurant_categories(id) ON DELETE CASCADE,
            menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
            display_order INTEGER DEFAULT 0,
            UNIQUE(cuisine_id, menu_item_id)
          )
        `);

        await client.query(
          `INSERT INTO cuisine_items (cuisine_id, menu_item_id, display_order)
           SELECT $1, mi.id, ROW_NUMBER() OVER (ORDER BY mi.name)
           FROM menu_items mi
           WHERE LOWER(mi.name) LIKE '%burger%'
           ON CONFLICT DO NOTHING`,
          [burger.rows[0].id]
        );
      }
    }

    console.log('[SCHEMA] Critical schema checks completed');
  } catch (err) {
    console.error('[SCHEMA] ensureSchema warning:', err.message);
  } finally {
    client.release();
  }
}

module.exports = ensureSchema;
