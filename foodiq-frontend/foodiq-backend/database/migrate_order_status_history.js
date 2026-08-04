/**
 * Adds order_status_history table + trigger for the admin order timeline/audit trail.
 * Additive only — no existing columns are changed.
 * Run: node database/migrate_order_status_history.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        from_status VARCHAR(60),
        to_status VARCHAR(60) NOT NULL,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        source VARCHAR(30) NOT NULL DEFAULT 'system',
        reason TEXT,
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_status_history_order
        ON order_status_history(order_id, created_at DESC)
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION record_order_status_history() RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
          INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, source, reason)
          VALUES (
            NEW.id, OLD.status, NEW.status,
            NULLIF(current_setting('app.order_actor_id', true), '')::uuid,
            COALESCE(NULLIF(current_setting('app.order_actor_source', true), ''), 'system'),
            NULLIF(current_setting('app.order_actor_reason', true), '')
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await client.query(`DROP TRIGGER IF EXISTS trg_order_status_history ON orders`);
    await client.query(`
      CREATE TRIGGER trg_order_status_history
        AFTER UPDATE ON orders
        FOR EACH ROW EXECUTE PROCEDURE record_order_status_history()
    `);
    console.log('order_status_history migration completed.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
