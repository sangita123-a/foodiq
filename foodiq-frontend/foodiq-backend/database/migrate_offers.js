/**
 * Creates offers module tables.
 * Run: node database/migrate_offers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        banner_url TEXT,
        coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
        terms TEXT,
        color_gradient VARCHAR(100) DEFAULT 'from-rose-500 to-red-600',
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        valid_from TIMESTAMP WITH TIME ZONE,
        valid_until TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS offer_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        offer_discount_percent DECIMAL(5,2),
        UNIQUE(offer_id, menu_item_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS offer_restaurants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        UNIQUE(offer_id, restaurant_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS offer_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS coupon_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
        offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        coupon_code VARCHAR(50),
        discount_amount DECIMAL(10,2) DEFAULT 0,
        final_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id) ON DELETE SET NULL
    `);

    await client.query('COMMIT');
    console.log('Offers migration completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Offers migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
