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
    const r = await pool.query(`SELECT COUNT(*)::int AS c FROM restaurants`);
    restaurants = r.rows[0]?.c || 0;
    const m = await pool.query(`SELECT COUNT(*)::int AS c FROM menu_items`);
    dishes = m.rows[0]?.c || 0;
  } catch (err) {
    console.warn('[CATALOG] Could not count catalog rows:', err.message);
    throw new Error(`Catalog count failed: ${err.message}`);
  }

  const active = await pool.query(
    `SELECT COUNT(*)::int AS c FROM restaurants WHERE COALESCE(is_active, TRUE) = TRUE`
  ).catch(() => ({ rows: [{ c: restaurants }] }));
  const activeRestaurants = active.rows[0]?.c || 0;
  const availableDishes = await pool
    .query(
      `SELECT COUNT(*)::int AS c FROM menu_items WHERE COALESCE(is_available, TRUE) = TRUE`
    )
    .catch(() => ({ rows: [{ c: dishes }] }));
  const activeDishes = availableDishes.rows[0]?.c || 0;

  if (activeRestaurants > 0 && activeDishes > 0) {
    console.log(
      `[CATALOG] Catalog ready (${activeRestaurants} active restaurants, ${activeDishes} dishes) — skip seed`
    );
    return {
      seeded: false,
      reason: 'already_populated',
      restaurants: activeRestaurants,
      dishes: activeDishes,
    };
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
