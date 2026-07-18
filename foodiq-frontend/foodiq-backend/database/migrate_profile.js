/**
 * Profile module migrations — safe to run multiple times.
 * node database/migrate_profile.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS date_of_birth DATE,
        ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
        ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE
    `);

    await client.query(`
      ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS notify_orders BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS notify_offers BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS notify_rewards BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'in',
        ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'inr',
        ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'ist',
        ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) DEFAULT '#FF2D3B',
        ADD COLUMN IF NOT EXISTS hide_profile BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS data_sharing BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS notify_order_updates BOOLEAN DEFAULT TRUE
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'upi', 'wallet', 'cod')),
        label VARCHAR(100),
        card_holder_name VARCHAR(255),
        card_last4 VARCHAR(4),
        card_brand VARCHAR(50),
        card_expiry VARCHAR(10),
        upi_id VARCHAR(255),
        wallet_name VARCHAR(100),
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, restaurant_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_name VARCHAR(255),
        device_type VARCHAR(50) DEFAULT 'desktop',
        browser VARCHAR(100),
        os VARCHAR(100),
        ip_address VARCHAR(100),
        location VARCHAR(255),
        is_current BOOLEAN DEFAULT FALSE,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_name VARCHAR(255),
        ip_address VARCHAR(100),
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        status VARCHAR(30) DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'used', 'expired')),
        applied_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, coupon_id)
      )
    `);

    await client.query('COMMIT');
    console.log('Profile migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
