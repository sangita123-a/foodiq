/**
 * Standalone schema migrate for CI/CD.
 * 1) Apply database/schema.sql (CREATE IF NOT EXISTS)
 * 2) ensureSchema (ALTERs + satellite tables)
 * 3) Auto-seed catalog when empty (UPSERT)
 * Usage: node scripts/ci/run-migrate.js
 * Exit 0 on success, 1 on failure.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function main() {
  const applyBaseSchema = require('../../utils/applyBaseSchema');
  const ensureSchema = require('../../utils/ensureSchema');
  const ensureProductionCatalog = require('../../utils/ensureProductionCatalog');
  const { pool } = require('../../config/db');
  console.log(
    '[migrate] DB target:',
    process.env.DATABASE_URL
      ? 'DATABASE_URL'
      : `${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'foodiq'}`
  );
  console.log('[migrate] Applying base schema.sql…');
  await applyBaseSchema();
  console.log('[migrate] Applying ensureSchema…');
  await ensureSchema();
  const core = await pool.query(
    `SELECT to_regclass('public.restaurants') AS restaurants,
            to_regclass('public.menu_items') AS menu_items,
            to_regclass('public.organizations') AS organizations`
  );
  if (!core.rows[0].restaurants || !core.rows[0].menu_items || !core.rows[0].organizations) {
    throw new Error(
      `Core tables missing after migrate (restaurants=${core.rows[0].restaurants}, menu_items=${core.rows[0].menu_items}, organizations=${core.rows[0].organizations})`
    );
  }
  console.log('[migrate] Ensuring production catalog…');
  await ensureProductionCatalog();
  console.log('[migrate] Schema ensure complete');
  await pool.end();
}

main().catch(async (err) => {
  console.error('[migrate] FAILED', err.message);
  try {
    await require('../../config/db').pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
