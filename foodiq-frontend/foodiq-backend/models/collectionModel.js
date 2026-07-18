const { pool } = require('../config/db');

const listCollections = async ({ limit = 20 } = {}) => {
  const { rows } = await pool.query(
    `SELECT c.*,
            COALESCE(
              (SELECT COUNT(*)::int FROM collection_restaurants cr WHERE cr.collection_id = c.id),
              0
            ) AS restaurant_count
     FROM restaurant_collections c
     WHERE c.is_active = TRUE
     ORDER BY c.sort_order ASC, c.created_at DESC
     LIMIT $1`,
    [Math.min(Number(limit) || 20, 50)]
  );
  return rows;
};

const getCollectionBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT * FROM restaurant_collections WHERE slug = $1 AND is_active = TRUE`,
    [slug]
  );
  const collection = rows[0];
  if (!collection) return null;

  const linked = await pool.query(
    `SELECT r.*
     FROM collection_restaurants cr
     JOIN restaurants r ON r.id = cr.restaurant_id
     WHERE cr.collection_id = $1 AND r.is_active = TRUE
     ORDER BY cr.sort_order ASC, r.rating DESC NULLS LAST
     LIMIT 40`,
    [collection.id]
  );

  // Fall back to filter_query when no curated links
  let restaurants = linked.rows;
  if (!restaurants.length && collection.filter_query) {
    const fq = typeof collection.filter_query === 'string'
      ? JSON.parse(collection.filter_query)
      : collection.filter_query;
    const { getRestaurants } = require('./restaurantModel');
    const result = await getRestaurants({
      ...fq,
      category: fq.cuisine || fq.category,
      deliveryTime: fq.delivery_time || fq.deliveryTime,
      priceRange: fq.price_range || fq.priceRange,
      is_veg: fq.is_veg,
      sort: fq.sort === 'price_low' ? 'price' : fq.sort === 'newest' ? 'newest' : fq.sort,
      limit: 24,
      page: 1,
    });
    restaurants = result.restaurants || [];
  }

  return { ...collection, restaurants, places: `${restaurants.length} Places` };
};

const listActiveCampaigns = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM seasonal_campaigns
     WHERE is_active = TRUE
       AND starts_at <= NOW()
       AND ends_at >= NOW()
     ORDER BY starts_at DESC
     LIMIT 10`
  );
  return rows;
};

module.exports = {
  listCollections,
  getCollectionBySlug,
  listActiveCampaigns,
};
