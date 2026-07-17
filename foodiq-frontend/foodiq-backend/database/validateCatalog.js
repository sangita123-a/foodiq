require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function validateCatalog() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM restaurants WHERE is_active = TRUE) AS restaurants,
      (SELECT COUNT(*)::int FROM menu_items WHERE is_available = TRUE) AS menu_items,
      (SELECT COUNT(*)::int FROM menu_items WHERE is_trending = TRUE) AS trending_items,
      (SELECT COUNT(*)::int FROM restaurant_categories WHERE slug IS NOT NULL) AS cuisines,
      (SELECT MIN(item_count)::int FROM (
        SELECT cuisine_id, COUNT(*) AS item_count FROM cuisine_items GROUP BY cuisine_id
      ) counts) AS minimum_cuisine_items,
      (SELECT COUNT(*)::int FROM restaurants
       WHERE image_url IS NULL OR BTRIM(image_url) = '') AS restaurants_missing_images,
      (SELECT COUNT(*)::int FROM menu_items
       WHERE is_available = TRUE
         AND (image_url IS NULL OR BTRIM(image_url) = '')) AS dishes_missing_images,
      (SELECT COUNT(*)::int FROM (
        SELECT image_url
        FROM menu_items
        WHERE is_available = TRUE
        GROUP BY image_url
        HAVING COUNT(*) > 1
      ) duplicate_images) AS duplicate_dish_images,
      (SELECT COUNT(*)::int FROM menu_items
       WHERE is_available = TRUE
         AND image_url NOT LIKE '/images/catalog/dishes/%') AS unsupported_dish_images
      ,
      (SELECT COUNT(*)::int
       FROM restaurants r
       WHERE r.is_active = TRUE
         AND NOT EXISTS (
           SELECT 1
           FROM menu_items mi
           WHERE mi.restaurant_id = r.id
             AND mi.is_available = TRUE
         )) AS restaurants_without_menu,
      (SELECT MIN(item_count)::int
       FROM (
         SELECT r.id, COUNT(mi.id) AS item_count
         FROM restaurants r
         JOIN menu_items mi
           ON mi.restaurant_id = r.id
          AND mi.is_available = TRUE
         WHERE r.is_active = TRUE
         GROUP BY r.id
       ) restaurant_menu_counts) AS minimum_restaurant_items,
      (SELECT COUNT(*)::int
       FROM menu_items mi
       JOIN restaurants r ON r.id = mi.restaurant_id
       JOIN restaurant_categories rc ON rc.id = r.category_id
       WHERE mi.is_available = TRUE
         AND mi.image_url NOT LIKE '/images/catalog/dishes/' || rc.slug || '/%')
       AS mismatched_menu_items
  `);
  const result = rows[0];
  const checks = [
    ['restaurants', result.restaurants, 20],
    ['menu_items', result.menu_items, 50],
    ['trending_items', result.trending_items, 50],
    ['cuisines', result.cuisines, 16],
    ['minimum_cuisine_items', result.minimum_cuisine_items, 15],
  ];
  const failures = checks.filter(([, actual, minimum]) => actual < minimum);
  if (result.restaurants_missing_images || result.dishes_missing_images) {
    failures.push(['missing_images', result.restaurants_missing_images + result.dishes_missing_images, 0]);
  }
  if (result.duplicate_dish_images) {
    failures.push(['duplicate_dish_images', result.duplicate_dish_images, 0]);
  }
  if (result.unsupported_dish_images) {
    failures.push(['unsupported_dish_images', result.unsupported_dish_images, 0]);
  }
  if (result.restaurants_without_menu) {
    failures.push(['restaurants_without_menu', result.restaurants_without_menu, 0]);
  }
  if (result.minimum_restaurant_items < 6) {
    failures.push(['minimum_restaurant_items', result.minimum_restaurant_items, 6]);
  }
  if (result.mismatched_menu_items) {
    failures.push(['mismatched_menu_items', result.mismatched_menu_items, 0]);
  }

  const { rows: dishImages } = await pool.query(`
    SELECT name, image_url
    FROM menu_items
    WHERE is_available = TRUE
    ORDER BY name
  `);
  const publicRoot = path.join(__dirname, '..', '..', '..', 'public');
  const hashes = new Map();
  const missingFiles = [];
  const duplicateFiles = [];
  for (const dish of dishImages) {
    const filePath = path.join(publicRoot, dish.image_url.replace(/^\/+/, ''));
    if (!fs.existsSync(filePath)) {
      missingFiles.push(dish.image_url);
      continue;
    }
    const digest = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    if (hashes.has(digest)) {
      duplicateFiles.push([dish.image_url, hashes.get(digest)]);
    } else {
      hashes.set(digest, dish.image_url);
    }
  }
  result.missing_image_files = missingFiles.length;
  result.duplicate_image_files = duplicateFiles.length;
  result.unique_image_files = hashes.size;
  if (missingFiles.length) failures.push(['missing_image_files', missingFiles.length, 0]);
  if (duplicateFiles.length) failures.push(['duplicate_image_files', duplicateFiles.length, 0]);

  console.log(JSON.stringify(result, null, 2));
  if (failures.length) {
    throw new Error(`Catalog validation failed: ${JSON.stringify(failures)}`);
  }
  console.log('[CATALOG] Validation passed');
}

if (require.main === module) {
  validateCatalog()
    .then(() => pool.end())
    .catch((error) => {
      console.error(error.message);
      pool.end().finally(() => process.exit(1));
    });
}

module.exports = validateCatalog;
