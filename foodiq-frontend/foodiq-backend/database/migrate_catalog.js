require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function migrateCatalog() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE restaurant_categories
        ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
        ALTER COLUMN image_url TYPE TEXT;

      ALTER TABLE restaurants
        ADD COLUMN IF NOT EXISTS slug VARCHAR(160),
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS banner_url TEXT,
        ADD COLUMN IF NOT EXISTS distance_km NUMERIC(5,2) DEFAULT 2.5,
        ADD COLUMN IF NOT EXISTS offer_text VARCHAR(160),
        ALTER COLUMN image_url TYPE TEXT;

      ALTER TABLE menu_items
        ADD COLUMN IF NOT EXISTS slug VARCHAR(180),
        ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 4.5,
        ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS ingredients TEXT,
        ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb,
        ALTER COLUMN image_url TYPE TEXT;

      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(20) DEFAULT 'Now',
        ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

      CREATE TABLE IF NOT EXISTS cuisine_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cuisine_id UUID NOT NULL REFERENCES restaurant_categories(id) ON DELETE CASCADE,
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        UNIQUE(cuisine_id, menu_item_id)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS uq_restaurant_categories_slug
        ON restaurant_categories(slug) WHERE slug IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS uq_restaurants_slug
        ON restaurants(slug) WHERE slug IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_items_restaurant_name
        ON menu_items(restaurant_id, name);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_items_catalog_image
        ON menu_items(image_url)
        WHERE image_url LIKE '/images/catalog/dishes/%';
      CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_categories_restaurant_name
        ON menu_categories(restaurant_id, name);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_cart_menu
        ON cart_items(cart_id, menu_item_id);
      CREATE INDEX IF NOT EXISTS idx_menu_items_trending
        ON menu_items(is_trending, trending_score DESC);
      CREATE INDEX IF NOT EXISTS idx_cuisine_items_order
        ON cuisine_items(cuisine_id, display_order);
    `);
    await client.query('COMMIT');
    console.log('[MIGRATION] Catalog schema is ready');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateCatalog()
    .then(() => pool.end())
    .catch((error) => {
      console.error('[MIGRATION] Catalog migration failed:', error);
      pool.end().finally(() => process.exit(1));
    });
}

module.exports = migrateCatalog;
