/**
 * Adds delivery_instructions to orders table.
 * Run: node database/migrate_orders.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_instructions TEXT
    `);
    console.log('Orders migration completed.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
