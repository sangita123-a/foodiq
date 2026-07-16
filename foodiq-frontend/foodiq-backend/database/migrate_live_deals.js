/**
 * Creates live_deals table for Live Deals Ending Soon section.
 * Run: node database/migrate_live_deals.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS live_deals (
        id SERIAL PRIMARY KEY,
        deal_key VARCHAR(50) UNIQUE NOT NULL,
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
        offer_title VARCHAR(255) NOT NULL,
        description TEXT,
        logo_url TEXT,
        banner_url TEXT,
        delivery_time_label VARCHAR(50) DEFAULT '30 min',
        timer_seconds INTEGER DEFAULT 3600,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        UNIQUE(restaurant_id, coupon_id)
      )
    `);

    await client.query('COMMIT');
    console.log('Live deals migration completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Live deals migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
