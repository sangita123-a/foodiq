/**
 * Idempotently seeds the 3 additional homepage offers:
 *   pizza-bogo   -> Buy 1 Get 1 Free Pizza (PIZZABOGO)
 *   biryani150   -> Flat ₹150 OFF on Biryani (BIRYANI150)
 *   free-dessert -> Free Dessert with Family Meal (FREEDESSERT)
 *
 * Offer items are pulled from active catalog restaurants of the matching
 * cuisine, so every offer page shows only foods included in that offer.
 *
 * Run: node database/seed_extra_offers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

const COUPONS = [
  { code: 'PIZZABOGO', discountAmount: 50, discountType: 'percentage', minOrder: 299 },
  { code: 'BIRYANI150', discountAmount: 150, discountType: 'fixed', minOrder: 499 },
  { code: 'FREEDESSERT', discountAmount: 99, discountType: 'fixed', minOrder: 599 },
];

const OFFERS = [
  {
    slug: 'pizza-bogo',
    title: 'Buy 1 Get 1 Free Pizza',
    subtitle: '50% OFF · Valid Today',
    description:
      'Order any pizza and get a second one free — effectively 50% off your pizza order. Valid today on all pizzas from our partner pizzerias.',
    bannerUrl: '/images/catalog/dishes/pizza/cheese-burst-pizza.webp',
    couponCode: 'PIZZABOGO',
    terms:
      'Valid today only. Minimum order ₹299. Applicable on pizza menu items from participating restaurants. Cannot be combined with other offers.',
    gradient: 'from-red-500 to-orange-500',
    minOrder: 299,
    validDays: 1,
    cuisineSlug: 'pizza',
  },
  {
    slug: 'biryani150',
    title: 'Flat ₹150 OFF on Biryani',
    subtitle: 'Minimum order ₹499',
    description:
      'Get a flat ₹150 discount on aromatic dum biryanis — chicken, mutton, veg and more from the best biryani houses in town.',
    bannerUrl: '/images/catalog/dishes/biryani/hyderabadi-biryani.webp',
    couponCode: 'BIRYANI150',
    terms:
      'Minimum order ₹499. Applicable on biryani menu items from participating restaurants. One redemption per order.',
    gradient: 'from-emerald-500 to-teal-600',
    minOrder: 499,
    validDays: 30,
    cuisineSlug: 'biryani',
  },
  {
    slug: 'free-dessert',
    title: 'Free Dessert with Family Meal',
    subtitle: 'Limited Time Offer',
    description:
      'Order a family meal worth ₹599 or more and enjoy a complimentary dessert — cakes, brownies, sundaes and classic Indian sweets.',
    bannerUrl: '/images/catalog/dishes/desserts/hot-chocolate-sundae.webp',
    couponCode: 'FREEDESSERT',
    terms:
      'Limited time offer. Minimum order ₹599. Free dessert value up to ₹99 applied as a discount at checkout. One redemption per order.',
    gradient: 'from-fuchsia-500 to-purple-600',
    minOrder: 599,
    validDays: 14,
    cuisineSlug: 'desserts',
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const couponIdByCode = {};
    for (const coupon of COUPONS) {
      const { rows } = await client.query(
        `INSERT INTO coupons (code, discount_amount, discount_type, min_order_amount, is_active, valid_until)
         VALUES ($1, $2, $3, $4, TRUE, NOW() + INTERVAL '30 days')
         ON CONFLICT (code) DO UPDATE
           SET discount_amount = EXCLUDED.discount_amount,
               discount_type = EXCLUDED.discount_type,
               min_order_amount = EXCLUDED.min_order_amount,
               is_active = TRUE,
               valid_until = GREATEST(coupons.valid_until, EXCLUDED.valid_until)
         RETURNING id`,
        [coupon.code, coupon.discountAmount, coupon.discountType, coupon.minOrder]
      );
      couponIdByCode[coupon.code] = rows[0].id;
    }

    for (const offer of OFFERS) {
      const { rows: offerRows } = await client.query(
        `INSERT INTO offers (slug, title, subtitle, description, banner_url, coupon_id, terms, color_gradient, min_order_amount, is_active, valid_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW() + ($10 || ' days')::interval)
         ON CONFLICT (slug) DO UPDATE
           SET title = EXCLUDED.title,
               subtitle = EXCLUDED.subtitle,
               description = EXCLUDED.description,
               banner_url = EXCLUDED.banner_url,
               coupon_id = EXCLUDED.coupon_id,
               terms = EXCLUDED.terms,
               color_gradient = EXCLUDED.color_gradient,
               min_order_amount = EXCLUDED.min_order_amount,
               is_active = TRUE,
               valid_until = EXCLUDED.valid_until,
               updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          offer.slug,
          offer.title,
          offer.subtitle,
          offer.description,
          offer.bannerUrl,
          couponIdByCode[offer.couponCode],
          offer.terms,
          offer.gradient,
          offer.minOrder,
          String(offer.validDays),
        ]
      );
      const offerId = offerRows[0].id;

      // Eligible foods: available dishes from active restaurants of the matching cuisine.
      const { rows: menuItems } = await client.query(
        `SELECT mi.id, mi.restaurant_id
         FROM menu_items mi
         JOIN restaurants r ON r.id = mi.restaurant_id
         JOIN restaurant_categories rc ON rc.id = r.category_id
         WHERE rc.slug = $1
           AND r.is_active = TRUE
           AND (mi.is_available IS NULL OR mi.is_available = TRUE)
         ORDER BY mi.name ASC
         LIMIT 12`,
        [offer.cuisineSlug]
      );

      if (menuItems.length === 0) {
        throw new Error(`No menu items found for cuisine "${offer.cuisineSlug}"`);
      }

      await client.query('DELETE FROM offer_items WHERE offer_id = $1', [offerId]);
      for (let i = 0; i < menuItems.length; i++) {
        await client.query(
          `INSERT INTO offer_items (offer_id, menu_item_id, display_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (offer_id, menu_item_id) DO UPDATE SET display_order = EXCLUDED.display_order`,
          [offerId, menuItems[i].id, i + 1]
        );
      }

      await client.query('DELETE FROM offer_restaurants WHERE offer_id = $1', [offerId]);
      const restaurantIds = [...new Set(menuItems.map((mi) => mi.restaurant_id))];
      for (const restaurantId of restaurantIds) {
        await client.query(
          `INSERT INTO offer_restaurants (offer_id, restaurant_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [offerId, restaurantId]
        );
      }

      console.log(
        `Offer "${offer.slug}" synced with ${menuItems.length} items across ${restaurantIds.length} restaurants.`
      );
    }

    await client.query('COMMIT');
    console.log('Extra offers seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Extra offers seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
