/**
 * Verify critical Foodiq tables/columns exist after migrate.
 * Default: core food-delivery catalog (unblocks CI/CD).
 * Full V3/V4 matrix: VERIFY_SCHEMA_FULL=true
 * Usage: node scripts/ci/verify-schema.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const CORE_TABLES = [
  'users',
  'restaurants',
  'menu_items',
  'menu_categories',
  'restaurant_categories',
  'orders',
  'payments',
  'cart',
  'reviews',
  'offers',
  'notifications',
];

const FULL_TABLES = [
  ...CORE_TABLES,
  'contact_messages',
  'support_tickets',
  'delivery_reviews',
  'order_feedback',
  'user_feedback',
  'bug_reports',
  'maintenance_reports',
  'organizations',
  'markets',
  'currencies',
  'franchises',
  'restaurant_chains',
  'white_label_configs',
  'api_keys',
  'warehouses',
  'inventory_items',
  'integration_connectors',
  'pricing_rules',
  'surge_events',
  'ai_forecast_runs',
  'locales',
  'tax_rules',
  'sso_providers',
  'organization_memberships',
  'corporate_accounts',
  'corporate_orders',
  'recurring_order_schedules',
  'ai_chat_sessions',
  'fleet_vehicles',
  'iot_devices',
  'iot_telemetry',
  'inventory_reorder_suggestions',
  'api_marketplace_listings',
  'privacy_requests',
  'wishlists',
  'recently_viewed',
  'referral_codes',
  'referral_redemptions',
  'gift_cards',
  'gift_card_transactions',
  'restaurant_collections',
  'collection_restaurants',
  'seasonal_campaigns',
  'product_feature_flags',
  'audit_logs',
];

const CORE_COLUMNS = [
  { table: 'restaurants', column: 'image_url' },
  { table: 'restaurants', column: 'is_active' },
  { table: 'menu_items', column: 'image_url' },
  { table: 'menu_items', column: 'is_trending' },
  { table: 'menu_items', column: 'price' },
];

const FULL_COLUMNS = [
  ...CORE_COLUMNS,
  { table: 'reviews', column: 'status' },
  { table: 'reviews', column: 'admin_reply' },
  { table: 'contact_messages', column: 'reason' },
  { table: 'contact_messages', column: 'phone' },
  { table: 'restaurants', column: 'organization_id' },
  { table: 'restaurants', column: 'market_id' },
  { table: 'orders', column: 'market_id' },
  { table: 'orders', column: 'currency' },
  { table: 'audit_logs', column: 'organization_id' },
  { table: 'audit_logs', column: 'actor_type' },
  { table: 'bug_reports', column: 'stack_trace' },
  { table: 'bug_reports', column: 'api_endpoint' },
  { table: 'bug_reports', column: 'browser' },
  { table: 'bug_reports', column: 'device' },
  { table: 'bug_reports', column: 'fingerprint' },
  { table: 'bug_reports', column: 'occurrence_count' },
];

async function main() {
  const full =
    String(process.env.VERIFY_SCHEMA_FULL || '').toLowerCase() === 'true';
  const REQUIRED_TABLES = full ? FULL_TABLES : CORE_TABLES;
  const REQUIRED_COLUMNS = full ? FULL_COLUMNS : CORE_COLUMNS;

  const { pool } = require('../../config/db');
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const present = new Set(rows.map((r) => r.table_name));
    const missing = REQUIRED_TABLES.filter((t) => !present.has(t));
    if (missing.length) {
      console.error('[verify-schema] Missing tables:', missing.join(', '));
      console.error('[verify-schema] Present table count:', present.size);
      console.error(`::error title=Missing tables::${missing.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    const missingCols = [];
    for (const { table, column } of REQUIRED_COLUMNS) {
      const col = await client.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
        [table, column]
      );
      if (!col.rows[0]) {
        missingCols.push(`${table}.${column}`);
      }
    }
    if (missingCols.length) {
      console.error('[verify-schema] Missing columns:', missingCols.join(', '));
      console.error(`::error title=Missing columns::${missingCols.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    console.log(
      `[verify-schema] OK (${full ? 'full' : 'core'}) — tables:`,
      REQUIRED_TABLES.join(', ')
    );
    console.log(
      '[verify-schema] OK — columns:',
      REQUIRED_COLUMNS.map((c) => `${c.table}.${c.column}`).join(', ')
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(async (err) => {
  console.error('[verify-schema] FAILED', err.message);
  try {
    await require('../../config/db').pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
