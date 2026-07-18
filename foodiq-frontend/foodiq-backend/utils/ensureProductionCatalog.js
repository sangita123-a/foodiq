const { pool } = require('../config/db');

/**
 * When the active catalog is empty, UPSERT curated restaurants + dishes.
 * Safe for production: seed_catalog uses ON CONFLICT (no TRUNCATE).
 * Disable with AUTO_SEED_CATALOG=false.
 */
async function ensureProductionCatalog() {
  const enabled =
    String(process.env.AUTO_SEED_CATALOG || 'true').toLowerCase() !== 'false';
  if (!enabled) {
    console.log('[CATALOG] Auto-seed disabled (AUTO_SEED_CATALOG=false)');
    return { seeded: false, reason: 'disabled' };
  }

  let restaurants = 0;
  let dishes = 0;
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS c FROM restaurants WHERE is_active = TRUE`
    );
    restaurants = r.rows[0]?.c || 0;
    const m = await pool.query(
      `SELECT COUNT(*)::int AS c FROM menu_items WHERE is_available = TRUE`
    );
    dishes = m.rows[0]?.c || 0;
  } catch (err) {
    console.warn('[CATALOG] Could not count catalog rows:', err.message);
    return { seeded: false, reason: 'count_failed', error: err.message };
  }

  if (restaurants > 0 && dishes > 0) {
    console.log(
      `[CATALOG] Catalog ready (${restaurants} restaurants, ${dishes} dishes) — skip seed`
    );
    return { seeded: false, reason: 'already_populated', restaurants, dishes };
  }

  console.log(
    `[CATALOG] Empty/incomplete catalog (restaurants=${restaurants}, dishes=${dishes}) — syncing…`
  );
  const syncCatalog = require('../database/seed_catalog');
  await syncCatalog();

  const afterR = await pool.query(
    `SELECT COUNT(*)::int AS c FROM restaurants WHERE is_active = TRUE`
  );
  const afterM = await pool.query(
    `SELECT COUNT(*)::int AS c FROM menu_items WHERE is_available = TRUE`
  );
  console.log(
    `[CATALOG] Sync complete (${afterR.rows[0].c} restaurants, ${afterM.rows[0].c} dishes)`
  );
  return {
    seeded: true,
    restaurants: afterR.rows[0].c,
    dishes: afterM.rows[0].c,
  };
}

module.exports = ensureProductionCatalog;
