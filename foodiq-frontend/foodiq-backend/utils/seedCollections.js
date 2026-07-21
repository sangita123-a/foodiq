/**
 * Seeds restaurant_collections + collection_restaurants with curated demo data.
 * Safe to run on every boot — upserts collections and fills empty junction rows.
 */
const COLLECTION_DEFS = [
  {
    slug: 'top-rated',
    title: 'Top Rated Restaurants',
    description: 'The absolute best rated spots in the city.',
    image_url: '/images/catalog/restaurants/north-indian.webp',
    filter_query: { sort: 'rating', rating: '4.0' },
    sort_order: 1,
    pick: 'top_rated',
  },
  {
    slug: 'quick-bites',
    title: 'Quick Bites',
    description: 'Meals that arrive fast when you are hungry now.',
    image_url: '/images/catalog/restaurants/fast-food.webp',
    filter_query: { sort: 'deliveryTime', delivery_time: '30' },
    sort_order: 2,
    pick: 'quick',
  },
  {
    slug: 'best-biryani',
    title: 'Best Biryani Near You',
    description: 'Authentic, rich, and aromatic biryanis.',
    image_url: '/images/catalog/restaurants/biryani.webp',
    filter_query: { cuisine: 'biryani', sort: 'rating' },
    sort_order: 3,
    pick: 'biryani',
  },
  {
    slug: 'pure-veg',
    title: 'Pure Veg Specials',
    description: 'Exquisite vegetarian delicacies for everyone.',
    image_url: '/images/catalog/restaurants/south-indian.webp',
    filter_query: { is_veg: 'true', sort: 'rating' },
    sort_order: 4,
    pick: 'veg',
  },
  {
    slug: 'budget-meals',
    title: 'Budget Meals',
    description: 'Delicious food that does not break the bank.',
    image_url: '/images/catalog/restaurants/street-food.webp',
    filter_query: { sort: 'price_low', price_range: '1' },
    sort_order: 5,
    pick: 'budget',
  },
];

const TARGET_PER_COLLECTION = 12;

async function pickRestaurants(pool, pick) {
  switch (pick) {
    case 'top_rated':
      return pool.query(
        `SELECT id FROM restaurants WHERE is_active = TRUE ORDER BY rating DESC NULLS LAST, name ASC LIMIT $1`,
        [TARGET_PER_COLLECTION]
      );
    case 'quick':
      return pool.query(
        `SELECT id FROM restaurants WHERE is_active = TRUE ORDER BY estimated_delivery_time ASC NULLS LAST, rating DESC LIMIT $1`,
        [TARGET_PER_COLLECTION]
      );
    case 'biryani':
      return pool.query(
        `SELECT r.id
         FROM restaurants r
         LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
         WHERE r.is_active = TRUE
           AND (
             rc.slug ILIKE '%biryani%'
             OR rc.name ILIKE '%biryani%'
             OR r.name ILIKE '%biryani%'
             OR r.description ILIKE '%biryani%'
           )
         ORDER BY r.rating DESC NULLS LAST
         LIMIT $1`,
        [TARGET_PER_COLLECTION]
      );
    case 'veg':
      return pool.query(
        `SELECT r.id
         FROM restaurants r
         LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
         WHERE r.is_active = TRUE
           AND (
             rc.slug IN ('south-indian', 'healthy', 'bakery')
             OR rc.name ILIKE '%south indian%'
             OR rc.name ILIKE '%veg%'
             OR r.name ILIKE '%veg%'
             OR r.name ILIKE '%dosa%'
           )
         ORDER BY r.rating DESC NULLS LAST
         LIMIT $1`,
        [TARGET_PER_COLLECTION]
      );
    case 'budget':
      return pool.query(
        `SELECT id FROM restaurants WHERE is_active = TRUE AND price_range <= 2
         ORDER BY price_range ASC, rating DESC LIMIT $1`,
        [TARGET_PER_COLLECTION]
      );
    default:
      return pool.query(
        `SELECT id FROM restaurants WHERE is_active = TRUE ORDER BY rating DESC LIMIT $1`,
        [TARGET_PER_COLLECTION]
      );
  }
}

async function ensureVegMenuFlags(pool, restaurantIds) {
  if (!restaurantIds.length) return;
  await pool.query(
    `UPDATE menu_items SET is_vegetarian = TRUE
     WHERE restaurant_id = ANY($1::uuid[])`,
    [restaurantIds]
  );
}

async function ensureOfferText(pool) {
  await pool.query(`
    UPDATE restaurants
    SET offer_text = COALESCE(NULLIF(TRIM(offer_text), ''), 'Flat 20% OFF')
    WHERE is_active = TRUE
      AND (offer_text IS NULL OR TRIM(offer_text) = '')
      AND rating >= 4.3
  `);
}

async function ensureHighQualityImages(pool) {
  const imageMap = [
    { pattern: '%biryani%', image: '/images/catalog/restaurants/biryani.webp' },
    { pattern: '%pizza%', image: '/images/catalog/restaurants/pizza.webp' },
    { pattern: '%burger%', image: '/images/catalog/restaurants/burger.webp' },
    { pattern: '%chinese%', image: '/images/catalog/restaurants/chinese.webp' },
    { pattern: '%south%', image: '/images/catalog/restaurants/south-indian.webp' },
    { pattern: '%dosa%', image: '/images/catalog/restaurants/south-indian.webp' },
    { pattern: '%veg%', image: '/images/catalog/restaurants/south-indian.webp' },
  ];

  for (const { pattern, image } of imageMap) {
    await pool.query(
      `UPDATE restaurants SET image_url = $1
       WHERE is_active = TRUE
         AND (image_url IS NULL OR TRIM(image_url) = '' OR image_url NOT LIKE 'http%')
         AND name ILIKE $2`,
      [image, pattern]
    );
  }

  await pool.query(
    `UPDATE restaurants SET image_url = '/images/catalog/restaurants/north-indian.webp'
     WHERE is_active = TRUE
       AND (image_url IS NULL OR TRIM(image_url) = '' OR image_url NOT LIKE 'http%')`
  );

  await pool.query(
    `UPDATE restaurants SET image_url = '/images/catalog/restaurants/biryani.webp'
     WHERE is_active = TRUE AND name ILIKE '%biryani%'`
  );
  await pool.query(
    `UPDATE restaurants SET image_url = '/images/catalog/restaurants/pizza.webp'
     WHERE is_active = TRUE AND name ILIKE '%pizza%'`
  );
  await pool.query(
    `UPDATE restaurants SET image_url = '/images/catalog/restaurants/burger.webp'
     WHERE is_active = TRUE AND name ILIKE '%burger%'`
  );
  await pool.query(
    `UPDATE restaurants SET image_url = '/images/catalog/restaurants/chinese.webp'
     WHERE is_active = TRUE AND (name ILIKE '%chinese%' OR name ILIKE '%wok%' OR name ILIKE '%momo%')`
  );
  await pool.query(
    `UPDATE restaurants SET image_url = '/images/catalog/restaurants/south-indian.webp'
     WHERE is_active = TRUE AND (name ILIKE '%dosa%' OR name ILIKE '%south%' OR name ILIKE '%veg%')`
  );
}

async function seedCollectionRestaurants(pool) {
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM collection_restaurants`
  );
  const existingLinks = countRows[0]?.c || 0;
  const restaurantCount = await pool.query(
    `SELECT COUNT(*)::int AS c FROM restaurants WHERE is_active = TRUE`
  );
  if ((restaurantCount.rows[0]?.c || 0) < 8) {
    console.log('[COLLECTIONS] Skip seed — fewer than 8 active restaurants');
    return { collections: 0, links: existingLinks };
  }

  await ensureHighQualityImages(pool);
  await ensureOfferText(pool);

  let totalLinks = 0;

  for (const def of COLLECTION_DEFS) {
    const { rows: upserted } = await pool.query(
      `INSERT INTO restaurant_collections (slug, title, description, image_url, filter_query, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, TRUE)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         image_url = EXCLUDED.image_url,
         filter_query = EXCLUDED.filter_query,
         sort_order = EXCLUDED.sort_order,
         is_active = TRUE
       RETURNING id`,
      [
        def.slug,
        def.title,
        def.description,
        def.image_url,
        JSON.stringify(def.filter_query),
        def.sort_order,
      ]
    );
    const collectionId = upserted[0].id;

    const { rows: linkCountRows } = await pool.query(
      `SELECT COUNT(*)::int AS c FROM collection_restaurants WHERE collection_id = $1`,
      [collectionId]
    );
    if ((linkCountRows[0]?.c || 0) >= 8) {
      totalLinks += linkCountRows[0].c;
      continue;
    }

    if (def.pick === 'veg') {
      const picked = await pickRestaurants(pool, def.pick);
      let ids = picked.rows.map((r) => r.id);
      if (ids.length < 8) {
        const fallback = await pool.query(
          `SELECT id FROM restaurants WHERE is_active = TRUE ORDER BY rating DESC LIMIT $1`,
          [TARGET_PER_COLLECTION]
        );
        ids = [...new Set([...ids, ...fallback.rows.map((r) => r.id)])].slice(0, TARGET_PER_COLLECTION);
      }
      await ensureVegMenuFlags(pool, ids);
      for (let i = 0; i < ids.length; i++) {
        await pool.query(
          `INSERT INTO collection_restaurants (collection_id, restaurant_id, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (collection_id, restaurant_id) DO NOTHING`,
          [collectionId, ids[i], i + 1]
        );
      }
      totalLinks += ids.length;
      continue;
    }

    let { rows: picked } = await pickRestaurants(pool, def.pick);
    if (picked.length < 8) {
      const fallback = await pool.query(
        `SELECT id FROM restaurants WHERE is_active = TRUE ORDER BY rating DESC LIMIT $1`,
        [TARGET_PER_COLLECTION]
      );
      const merged = [...picked, ...fallback.rows.filter((r) => !picked.find((p) => p.id === r.id))];
      picked = merged.slice(0, TARGET_PER_COLLECTION);
    }

    for (let i = 0; i < picked.length; i++) {
      await pool.query(
        `INSERT INTO collection_restaurants (collection_id, restaurant_id, sort_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (collection_id, restaurant_id) DO NOTHING`,
        [collectionId, picked[i].id, i + 1]
      );
    }
    totalLinks += picked.length;
  }

  if (existingLinks === 0 && totalLinks > 0) {
    console.log(`[COLLECTIONS] Seeded ${COLLECTION_DEFS.length} collections with ${totalLinks} restaurant links`);
  }

  return { collections: COLLECTION_DEFS.length, links: totalLinks };
}

module.exports = { seedCollectionRestaurants, COLLECTION_DEFS };
