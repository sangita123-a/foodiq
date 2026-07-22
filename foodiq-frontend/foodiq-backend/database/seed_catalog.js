require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');
const migrateCatalog = require('./migrate_catalog');
const { cuisines, dishes, restaurants, isVegetarian } = require('./catalogData');

const slugify = (value) =>
  value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function syncCatalog() {
  await migrateCatalog();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cuisineIds = {};
    for (const cuisine of cuisines) {
      const { rows } = await client.query(
        `INSERT INTO restaurant_categories (name, slug, description, image_url, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) WHERE slug IS NOT NULL
         DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           image_url = EXCLUDED.image_url,
           sort_order = EXCLUDED.sort_order,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [cuisine.name, cuisine.slug, cuisine.description, cuisine.image, cuisine.sortOrder]
      );
      cuisineIds[cuisine.slug] = rows[0].id;
    }

    const owner = await client.query(
      `SELECT id FROM users WHERE role = 'restaurant_owner' ORDER BY created_at LIMIT 1`
    );
    const ownerId = owner.rows[0]?.id || null;
    const curatedRestaurantIds = [];
    for (const restaurant of restaurants) {
      const { rows } = await client.query(
        `INSERT INTO restaurants (
           slug, name, owner_id, category_id, description, address, phone, rating,
           estimated_delivery_time, price_range, is_active, image_url, logo_url,
           banner_url, distance_km, offer_text
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11,$12,$13,$14,$15)
         ON CONFLICT (slug) WHERE slug IS NOT NULL
         DO UPDATE SET
           name = EXCLUDED.name,
           category_id = EXCLUDED.category_id,
           description = EXCLUDED.description,
           address = EXCLUDED.address,
           phone = EXCLUDED.phone,
           rating = EXCLUDED.rating,
           estimated_delivery_time = EXCLUDED.estimated_delivery_time,
           image_url = EXCLUDED.image_url,
           logo_url = EXCLUDED.logo_url,
           banner_url = EXCLUDED.banner_url,
           distance_km = EXCLUDED.distance_km,
           offer_text = EXCLUDED.offer_text,
           is_active = TRUE,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          restaurant.slug,
          restaurant.name,
          ownerId,
          cuisineIds[restaurant.cuisineSlug],
          restaurant.description,
          restaurant.address,
          restaurant.phone,
          restaurant.rating,
          restaurant.deliveryTime,
          2,
          restaurant.image,
          restaurant.logo,
          restaurant.banner,
          restaurant.distanceKm,
          restaurant.offerText,
        ]
      );
      curatedRestaurantIds.push(rows[0].id);
    }

    await client.query(
      `UPDATE restaurants
       SET is_active = (id = ANY($1::uuid[])),
           updated_at = CURRENT_TIMESTAMP`,
      [curatedRestaurantIds]
    );

    const activeRestaurants = await client.query(
      `SELECT r.id, rc.slug AS cuisine_slug
       FROM restaurants r
       JOIN restaurant_categories rc ON rc.id = r.category_id
       WHERE r.is_active = TRUE
         AND rc.slug = ANY($1::text[])
       ORDER BY rc.slug, r.created_at, r.id`,
      [cuisines.map((cuisine) => cuisine.slug)]
    );
    const restaurantsByCuisine = {};
    for (const restaurant of activeRestaurants.rows) {
      restaurantsByCuisine[restaurant.cuisine_slug] ||= [];
      restaurantsByCuisine[restaurant.cuisine_slug].push(restaurant.id);
    }

    // Release prior catalog image paths before remapping dishes whose ordering
    // moved them to a different restaurant. The final cleanup deactivates any
    // stale rows while preserving historical order-item references.
    await client.query(`
      UPDATE menu_items
      SET image_url = '/images/catalog/legacy/' || id::text || '.webp'
      WHERE image_url LIKE '/images/catalog/dishes/%'
    `);

    let globalDishIndex = 0;
    const curatedItemIds = [];
    for (const cuisine of cuisines) {
      const cuisineRestaurants = restaurantsByCuisine[cuisine.slug];
      const cuisineDishes = dishes[cuisine.slug];
      if (!cuisineRestaurants?.length || cuisineDishes.length < 15) {
        throw new Error(`Catalog is incomplete for ${cuisine.slug}`);
      }
      await client.query(
        `DELETE FROM cuisine_items WHERE cuisine_id = $1`,
        [cuisineIds[cuisine.slug]]
      );

      for (let index = 0; index < cuisineDishes.length; index += 1) {
        const dish = cuisineDishes[index];
        const name = dish.name;
        const restaurantId = cuisineRestaurants[index % cuisineRestaurants.length];
        const category = await client.query(
          `INSERT INTO menu_categories (restaurant_id, name, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (restaurant_id, name)
           DO UPDATE SET description = EXCLUDED.description
           RETURNING id`,
          [restaurantId, cuisine.name, cuisine.description]
        );

        const basePrice = 119 + ((index * 37 + cuisine.sortOrder * 11) % 280);
        const discountPrice = index % 4 === 0 ? basePrice - 20 : null;
        const rating = Number((4.1 + ((index + cuisine.sortOrder) % 9) / 10).toFixed(1));
        const trending = globalDishIndex < 80;
        const image = dish.image;
        const description = `${name}, freshly prepared with quality ingredients and signature ${cuisine.name} flavours.`;
        const ingredients = `Fresh produce, signature ${cuisine.name} seasoning, herbs and chef-selected ingredients`;
        const galleryUrls = JSON.stringify(dish.gallery);

        const item = await client.query(
          `INSERT INTO menu_items (
             restaurant_id, category_id, slug, name, description, price, discount_price,
             preparation_time, calories, is_vegetarian, is_available, image_url, rating,
             is_trending, trending_score, ingredients, gallery_urls
           )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11,$12,$13,$14,$15,$16::jsonb)
           ON CONFLICT (restaurant_id, name)
           DO UPDATE SET
             category_id = EXCLUDED.category_id,
             slug = EXCLUDED.slug,
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             discount_price = EXCLUDED.discount_price,
             preparation_time = EXCLUDED.preparation_time,
             calories = EXCLUDED.calories,
             is_vegetarian = EXCLUDED.is_vegetarian,
             is_available = TRUE,
             image_url = EXCLUDED.image_url,
             rating = EXCLUDED.rating,
             is_trending = EXCLUDED.is_trending,
             trending_score = EXCLUDED.trending_score,
             ingredients = EXCLUDED.ingredients,
             gallery_urls = EXCLUDED.gallery_urls,
             updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [
            restaurantId,
            category.rows[0].id,
            `${slugify(name)}-${cuisine.slug}`,
            name,
            description,
            basePrice,
            discountPrice,
            15 + (index % 5) * 4,
            250 + (index % 8) * 70,
            isVegetarian(name),
            image,
            rating,
            trending,
            trending ? 1000 - globalDishIndex : 0,
            ingredients,
            galleryUrls,
          ]
        );
        curatedItemIds.push(item.rows[0].id);

        await client.query(
          `INSERT INTO cuisine_items (cuisine_id, menu_item_id, display_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (cuisine_id, menu_item_id)
           DO UPDATE SET display_order = EXCLUDED.display_order`,
          [cuisineIds[cuisine.slug], item.rows[0].id, index + 1]
        );
        globalDishIndex += 1;
      }
    }

    await client.query(
      `DELETE FROM cuisine_items
       WHERE menu_item_id IN (
         SELECT id
         FROM menu_items
         WHERE NOT (id = ANY($1::uuid[]))
           AND (
             slug IS NULL
             OR image_url LIKE '/images/catalog/dishes/%'
             OR image_url LIKE '/images/catalog/legacy/%'
           )
       )`,
      [curatedItemIds]
    );
    await client.query(
      `UPDATE menu_items
       SET is_available = FALSE,
           is_trending = FALSE,
           trending_score = 0
       WHERE NOT (id = ANY($1::uuid[]))
         AND (
           slug IS NULL
           OR image_url LIKE '/images/catalog/dishes/%'
           OR image_url LIKE '/images/catalog/legacy/%'
         )`,
      [curatedItemIds]
    );

    await client.query(`
      UPDATE restaurant_categories
      SET image_url = '/images/catalog/cuisines/indian.webp'
      WHERE image_url IS NULL OR BTRIM(image_url) = '';
      UPDATE restaurants
      SET image_url = COALESCE(NULLIF(image_url, ''), '/images/catalog/restaurants/rest-north-indian.jpg'),
          logo_url = COALESCE(NULLIF(logo_url, ''), '/images/catalog/dishes/indian/butter-chicken.webp'),
          banner_url = COALESCE(NULLIF(banner_url, ''), '/images/catalog/restaurants/rest-north-indian.jpg')
      WHERE image_url IS NULL OR BTRIM(image_url) = '';
    `);

    await client.query('COMMIT');
    console.log(`[CATALOG] Synced ${restaurants.length} restaurants and ${globalDishIndex} cuisine dishes`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  syncCatalog()
    .then(() => pool.end())
    .catch((error) => {
      console.error('[CATALOG] Sync failed:', error);
      pool.end().finally(() => process.exit(1));
    });
}

module.exports = syncCatalog;
