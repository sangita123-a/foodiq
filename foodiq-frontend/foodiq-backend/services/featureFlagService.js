/**
 * Product feature flags with gradual percent rollout.
 */
const { pool } = require('../config/db');

let cache = { at: 0, flags: null };
const CACHE_MS = 30_000;

const loadFlags = async () => {
  if (cache.flags && Date.now() - cache.at < CACHE_MS) return cache.flags;
  try {
    const { rows } = await pool.query(`SELECT * FROM product_feature_flags`);
    const map = {};
    for (const row of rows) map[row.key] = row;
    cache = { at: Date.now(), flags: map };
    return map;
  } catch {
    return cache.flags || {};
  }
};

const hashToPercent = (key, userId) => {
  const crypto = require('crypto');
  const h = crypto.createHash('md5').update(`${key}:${userId || 'anon'}`).digest();
  return h.readUInt16BE(0) % 100;
};

/**
 * @returns {{ enabled: boolean, key: string, rollout_percent: number }}
 */
const isEnabled = async (key, { userId = null } = {}) => {
  const flags = await loadFlags();
  const row = flags[key];
  if (!row) {
    // Unknown keys default ON for backward-compatible additive features
    return { enabled: true, key, rollout_percent: 100 };
  }
  if (!row.enabled) return { enabled: false, key, rollout_percent: row.rollout_percent };
  const pct = Number(row.rollout_percent);
  if (pct >= 100) return { enabled: true, key, rollout_percent: pct };
  if (pct <= 0) return { enabled: false, key, rollout_percent: pct };
  const bucket = hashToPercent(key, userId);
  return { enabled: bucket < pct, key, rollout_percent: pct, bucket };
};

const listFlags = async () => {
  const flags = await loadFlags();
  return Object.values(flags);
};

const upsertFlag = async ({ key, enabled, rollout_percent, description, meta }) => {
  const { rows } = await pool.query(
    `INSERT INTO product_feature_flags (key, enabled, rollout_percent, description, meta, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET
       enabled = COALESCE($2, product_feature_flags.enabled),
       rollout_percent = COALESCE($3, product_feature_flags.rollout_percent),
       description = COALESCE($4, product_feature_flags.description),
       meta = COALESCE($5::jsonb, product_feature_flags.meta),
       updated_at = NOW()
     RETURNING *`,
    [
      key,
      enabled == null ? true : !!enabled,
      rollout_percent == null ? 100 : Math.min(100, Math.max(0, Number(rollout_percent))),
      description || null,
      JSON.stringify(meta || {}),
    ]
  );
  cache = { at: 0, flags: null };
  return rows[0];
};

const getClientFlags = async (userId = null) => {
  const flags = await loadFlags();
  const out = {};
  for (const key of Object.keys(flags)) {
    const r = await isEnabled(key, { userId });
    out[key] = r.enabled;
  }
  return out;
};

module.exports = {
  isEnabled,
  listFlags,
  upsertFlag,
  getClientFlags,
  loadFlags,
};
