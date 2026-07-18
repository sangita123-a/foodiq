/**
 * Search adapter — Postgres (default) or Elasticsearch (when configured).
 */
const { pool } = require('../config/db');

const provider = () =>
  String(process.env.SEARCH_PROVIDER || 'pg').toLowerCase();

const searchPg = async (q, { limit = 20 } = {}) => {
  const term = `%${String(q || '').trim()}%`;
  if (!String(q || '').trim()) return { restaurants: [], dishes: [] };
  const [restaurants, dishes] = await Promise.all([
    pool.query(
      `SELECT id, name, slug, rating, image_url, market_id
       FROM restaurants
       WHERE is_active = TRUE AND name ILIKE $1
       ORDER BY rating DESC NULLS LAST
       LIMIT $2`,
      [term, Math.min(Number(limit) || 20, 50)]
    ),
    pool.query(
      `SELECT m.id, m.name, m.slug, m.price, m.image_url, m.restaurant_id
       FROM menu_items m
       WHERE m.is_available = TRUE AND m.name ILIKE $1
       ORDER BY m.rating DESC NULLS LAST
       LIMIT $2`,
      [term, Math.min(Number(limit) || 20, 50)]
    ),
  ]);
  return {
    provider: 'pg',
    restaurants: restaurants.rows,
    dishes: dishes.rows,
  };
};

const searchElasticsearch = async (q, opts) => {
  const node = process.env.ELASTICSEARCH_NODE;
  if (!node) {
    return searchPg(q, opts);
  }
  try {
    // Foundation stub: fall back to PG until ES client is wired in 3.1
    return {
      ...(await searchPg(q, opts)),
      provider: 'elasticsearch_fallback_pg',
      note: 'ELASTICSEARCH_NODE set but client not bundled in foundation; using PG',
    };
  } catch {
    return searchPg(q, opts);
  }
};

const search = async (q, opts) => {
  if (provider() === 'elasticsearch') {
    return searchElasticsearch(q, opts);
  }
  return searchPg(q, opts);
};

module.exports = { search, provider };
