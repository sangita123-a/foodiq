/**
 * Seeds the Foodiq database with demo data and real bcrypt password hashes.
 * Run: node database/seed.js
 * Demo logins (password for all): Password123
 *   - customer@foodiq.com (customer)
 *   - owner@foodiq.com (restaurant_owner)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash('Password123', 10);

    await client.query('BEGIN');

    // Clear dependent data for a clean seed (dev only)
    await client.query(`
      TRUNCATE coupon_history, offer_usage, offer_items, offer_restaurants, offers,
        live_deals, restaurant_coupons, cuisine_items,
        reward_history, rewards, notifications, reviews, favorites,
        order_tracking, delivery_partners, payments, order_items, coupon_usage,
        orders, cart_items, cart, coupons, menu_items, menu_categories,
        restaurants, restaurant_categories, addresses, user_settings, users,
        support_tickets, contact_messages
      RESTART IDENTITY CASCADE
    `);

    const ownerRes = await client.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['owner@foodiq.com', passwordHash, 'John Owner', '9876543210', 'restaurant_owner']
    );
    const customerRes = await client.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['customer@foodiq.com', passwordHash, 'Jane Customer', '9876543211', 'customer']
    );
    const ownerId = ownerRes.rows[0].id;
    const customerId = customerRes.rows[0].id;

    await client.query(
      `INSERT INTO user_settings (user_id) VALUES ($1), ($2)`,
      [ownerId, customerId]
    );

    await client.query(
      `INSERT INTO rewards (user_id, points_balance, total_earned) VALUES ($1, 250, 250)`,
      [customerId]
    );

    const cats = await client.query(
      `INSERT INTO restaurant_categories (name, slug, description, image_url, sort_order) VALUES
        ('Chinese', 'chinese', 'Wok-tossed noodles, momos and Indo-Chinese favorites', 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800', 1),
        ('Desserts', 'desserts', 'Cakes, ice cream, pastries and sweet treats', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800', 2),
        ('Fast Food', 'fast-food', 'Burgers, pizza, wraps and quick bites', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 3),
        ('Healthy', 'healthy', 'Salads, smoothie bowls and nutritious meals', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 4),
        ('Italian', 'italian', 'Authentic Italian pizzas and pastas', 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800', 5),
        ('Indian', 'indian', 'Rich curries and classic Indian flavors', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', 6),
        ('Pizza', 'pizza', 'Wood-fired and cheesy pizzas for every craving', 'https://images.unsplash.com/photo-1513104890138-7c049485ea28?w=800', 7),
        ('Biryani', 'biryani', 'Aromatic dum biryanis and royal rice dishes', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', 8),
        ('South Indian', 'south-indian', 'Dosas, idlis and South Indian meals', 'https://images.unsplash.com/photo-1630384086597-8979abcdbca0?w=800', 9),
        ('North Indian', 'north-indian', 'Tandoori, kebabs and North Indian curries', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', 10),
        ('Mexican', 'mexican', 'Tacos, burritos and zesty Mexican plates', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800', 11),
        ('Street Food', 'street-food', 'Chaat, rolls and local street favorites', 'https://images.unsplash.com/photo-1606491956689-2ea866880f44?w=800', 12),
        ('Seafood', 'seafood', 'Fresh fish, prawns and coastal delicacies', 'https://images.unsplash.com/photo-1519708226918-03f9baf3230e?w=800', 13),
        ('Bakery', 'bakery', 'Fresh breads, pastries and baked goods', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', 14),
        ('Beverages', 'beverages', 'Coffee, shakes, juices and refreshing drinks', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800', 15)
       RETURNING id, name, slug`
    );
    const catByName = Object.fromEntries(cats.rows.map((c) => [c.name, c.id]));
    const catBySlug = Object.fromEntries(cats.rows.map((c) => [c.slug, c.id]));

    const pizzaRes = await client.query(
      `INSERT INTO restaurants (name, owner_id, category_id, description, address, phone, rating, estimated_delivery_time, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING id`,
      [
        "Luigi's Pizza",
        ownerId,
        catByName.Italian,
        'Best wood-fired pizza in town',
        '123 Main St, Hyderabad',
        '0401234567',
        4.5,
        30,
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
      ]
    );
    const curryRes = await client.query(
      `INSERT INTO restaurants (name, owner_id, category_id, description, address, phone, rating, estimated_delivery_time, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING id`,
      [
        'Spicy Curry House',
        ownerId,
        catByName.Indian,
        'Authentic Indian flavors',
        '456 Curry Ave, Hyderabad',
        '0407654321',
        4.7,
        35,
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      ]
    );
    const burgerRes = await client.query(
      `INSERT INTO restaurants (name, owner_id, category_id, description, address, phone, rating, estimated_delivery_time, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING id`,
      [
        'Burger Lab',
        ownerId,
        catByName['Fast Food'],
        'Juicy smash burgers and fries',
        '78 Food Street, Hyderabad',
        '0401112233',
        4.3,
        25,
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
      ]
    );

    const restPizza = pizzaRes.rows[0].id;
    const restCurry = curryRes.rows[0].id;
    const restBurger = burgerRes.rows[0].id;

    const extraRestaurants = await client.query(
      `INSERT INTO restaurants (name, owner_id, category_id, description, address, phone, rating, estimated_delivery_time, price_range, image_url, is_active) VALUES
        ('Tokyo Sushi Bar', $1, $2, 'Fresh sushi and Japanese rolls', '12 Jubilee Hills, Hyderabad', '0402223344', 4.6, 40, 3, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', true),
        ('Green Bowl Cafe', $1, $3, 'Healthy salads and smoothie bowls', '45 Road No 2, Hyderabad', '0403334455', 4.4, 28, 2, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', true),
        ('Wok This Way', $1, $4, 'Authentic Chinese noodles and dumplings', '88 Hitech City, Hyderabad', '0404445566', 4.5, 32, 2, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800', true),
        ('Sweet Cravings', $1, $5, 'Desserts, cakes, and ice cream', '9 Gachibowli, Hyderabad', '0405556677', 4.8, 22, 2, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800', true),
        ('Paradise Biryani', $1, $6, 'Legendary Hyderabadi dum biryani', '101 Secunderabad, Hyderabad', '0406667788', 4.9, 38, 3, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', true),
        ('Cafe Mocha', $1, $2, 'Italian pastas and wood-fired pizzas', '55 Kondapur, Hyderabad', '0407778899', 4.2, 35, 2, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800', true),
        ('Mehfil Biryani', $1, $6, 'Hyderabadi biryani specialists', '22 Madhapur, Hyderabad', '0408889900', 4.7, 36, 3, 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?w=800', true),
        ('Pizza Express', $1, $2, 'Thin crust pizzas and garlic bread', '14 Banjara Hills, Hyderabad', '0409990011', 4.1, 28, 2, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800', true),
        ('Tandoori Nights', $1, $6, 'North Indian tandoor specials', '67 Miyapur, Hyderabad', '0401112234', 4.6, 40, 3, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', true),
        ('Noodle House', $1, $4, 'Pan-Asian noodles and fried rice', '90 Kukatpally, Hyderabad', '0402223345', 4.3, 30, 2, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800', true),
        ('Grill Junction', $1, $3, 'Grilled chicken and protein bowls', '33 Gachibowli, Hyderabad', '0403334456', 4.5, 32, 2, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', true),
        ('Ice Cream Parlour', $1, $5, 'Artisan ice creams and sundaes', '5 Begumpet, Hyderabad', '0404445567', 4.8, 20, 1, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800', true),
        ('South Spice', $1, $6, 'South Indian meals and dosas', '41 Ameerpet, Hyderabad', '0405556678', 4.4, 25, 2, 'https://images.unsplash.com/photo-1630384086597-8979abcdbca0?w=800', true),
        ('Kebab Corner', $1, $6, 'Mughlai kebabs and rolls', '18 LB Nagar, Hyderabad', '0406667789', 4.5, 35, 2, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800', true),
        ('Thai Basil', $1, $4, 'Thai curries and basil rice', '72 Hafeezpet, Hyderabad', '0407778890', 4.6, 38, 3, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800', true),
        ('Breakfast Club', $1, $3, 'All-day breakfast and coffee', '29 Kondapur, Hyderabad', '0408889901', 4.2, 22, 2, 'https://images.unsplash.com/photo-1533089860892-a7c10f39098a?w=800', true),
        ('Street Food Hub', $1, $3, 'Chaat, rolls and quick bites', '11 Charminar, Hyderabad', '0409990012', 4.0, 18, 1, 'https://images.unsplash.com/photo-1606491956689-2ea866880f44?w=800', true)
       RETURNING id, name`,
      [ownerId, catByName.Italian, catByName.Healthy, catByName.Chinese, catByName.Desserts, catByName.Indian]
    );

    const mcPizza = (
      await client.query(
        `INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, 'Wood Fired Pizzas') RETURNING id`,
        [restPizza]
      )
    ).rows[0].id;
    const mcCurry = (
      await client.query(
        `INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, 'Main Course') RETURNING id`,
        [restCurry]
      )
    ).rows[0].id;
    const mcBurger = (
      await client.query(
        `INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, 'Burgers') RETURNING id`,
        [restBurger]
      )
    ).rows[0].id;

    await client.query(
      `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, is_vegetarian, calories, image_url) VALUES
        ($1, $2, 'Margherita Pizza', 'Classic cheese and tomato', 299.00, 249.00, TRUE, 650, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d264?w=400'),
        ($1, $2, 'Pepperoni Pizza', 'Double pepperoni', 399.00, NULL, FALSE, 820, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400'),
        ($3, $4, 'Chicken Tikka Masala', 'Creamy and spicy', 349.00, NULL, FALSE, 720, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
        ($3, $4, 'Paneer Butter Masala', 'Vegetarian delight', 299.00, 269.00, TRUE, 680, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400'),
        ($5, $6, 'Classic Smash Burger', 'Double patty with cheese', 249.00, NULL, FALSE, 780, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
        ($5, $6, 'Veggie Deluxe', 'Crispy veg patty', 199.00, 179.00, TRUE, 520, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400')`,
      [restPizza, mcPizza, restCurry, mcCurry, restBurger, mcBurger]
    );

    const restByName = Object.fromEntries(
      [
        { name: "Luigi's Pizza", id: restPizza },
        { name: 'Spicy Curry House', id: restCurry },
        { name: 'Burger Lab', id: restBurger },
        ...extraRestaurants.rows,
      ].map((r) => [r.name, r.id])
    );

    const wokId = restByName['Wok This Way'];
    const noodleId = restByName['Noodle House'];
    const sweetId = restByName['Sweet Cravings'];
    const paradiseId = restByName['Paradise Biryani'];
    const cafeMochaId = restByName['Cafe Mocha'];
    const breakfastId = restByName['Breakfast Club'];
    const kebabId = restByName['Kebab Corner'];
    const iceCreamId = restByName['Ice Cream Parlour'];

    const extraCats = await client.query(
      `INSERT INTO menu_categories (restaurant_id, name) VALUES
        ($1, 'Chinese'), ($2, 'Rice & Noodles'), ($3, 'Desserts'), ($4, 'Biryani'),
        ($5, 'Pasta'), ($6, 'Breakfast'), ($7, 'Rolls'), ($8, 'Ice Cream')
       RETURNING id, restaurant_id`,
      [wokId, noodleId, sweetId, paradiseId, cafeMochaId, breakfastId, kebabId, iceCreamId]
    );
    const catByRest = Object.fromEntries(extraCats.rows.map((c) => [c.restaurant_id, c.id]));

    await client.query(
      `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, image_url) VALUES
        ($1, $2, 'Veg Momos', 'Steamed dumplings with spicy chutney', 149.00, TRUE, 'https://images.unsplash.com/photo-1496116218417-1a781b1d4160?w=400'),
        ($3, $4, 'Chicken Fried Rice', 'Wok-tossed fried rice', 199.00, FALSE, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400'),
        ($3, $4, 'Hakka Noodles', 'Stir-fried noodles', 179.00, TRUE, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
        ($5, $6, 'Chocolate Brownie', 'Warm fudge brownie', 149.00, TRUE, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400'),
        ($5, $6, 'Red Velvet Cake', 'Cream cheese frosted slice', 299.00, TRUE, 'https://images.unsplash.com/photo-1586788680434-30d324b2d90a?w=400'),
        ($5, $6, 'Vanilla Shake', 'Thick vanilla milkshake', 99.00, TRUE, 'https://images.unsplash.com/photo-1572490122747-3964b3750a98?w=400'),
        ($7, $8, 'Hyderabadi Biryani', 'Dum-cooked aromatic biryani', 349.00, FALSE, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400'),
        ($9, $10, 'Alfredo Pasta', 'Creamy white sauce pasta', 279.00, TRUE, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400'),
        ($11, $12, 'Club Sandwich', 'Triple decker veg sandwich', 159.00, TRUE, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400'),
        ($11, $12, 'Cappuccino', 'Freshly brewed coffee', 129.00, TRUE, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400'),
        ($13, $14, 'Chicken Roll', 'Tandoori chicken kathi roll', 129.00, FALSE, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400'),
        ($15, $16, 'Ice Cream Sundae', 'Belgian chocolate sundae', 179.00, TRUE, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400')`,
      [
        wokId, catByRest[wokId],
        noodleId, catByRest[noodleId],
        sweetId, catByRest[sweetId],
        paradiseId, catByRest[paradiseId],
        cafeMochaId, catByRest[cafeMochaId],
        breakfastId, catByRest[breakfastId],
        kebabId, catByRest[kebabId],
        iceCreamId, catByRest[iceCreamId],
      ]
    );

    const menuByName = Object.fromEntries(
      (await client.query('SELECT id, name FROM menu_items')).rows.map((m) => [m.name, m.id])
    );

    const couponsRes = await client.query(
      `INSERT INTO coupons (code, discount_amount, discount_type, min_order_amount, is_active, valid_until) VALUES
        ('WELCOME50', 50.00, 'percentage', 200.00, TRUE, NOW() + INTERVAL '90 days'),
        ('FLAT10', 10.00, 'fixed', 100.00, TRUE, NULL),
        ('FOODIQ20', 20.00, 'percentage', 300.00, TRUE, NULL),
        ('FREEDEL', 0.00, 'fixed', 500.00, TRUE, NOW() + INTERVAL '60 days'),
        ('BOGO', 50.00, 'percentage', 150.00, TRUE, NOW() + INTERVAL '45 days'),
        ('DOM50', 50.00, 'percentage', 299.00, TRUE, NOW() + INTERVAL '7 days'),
        ('KFCB1G1', 50.00, 'percentage', 199.00, TRUE, NOW() + INTERVAL '7 days'),
        ('BKFREE', 79.00, 'fixed', 199.00, TRUE, NOW() + INTERVAL '7 days'),
        ('BIRYANI150', 150.00, 'fixed', 349.00, TRUE, NOW() + INTERVAL '7 days')
       RETURNING id, code`
    );
    const couponByCode = Object.fromEntries(couponsRes.rows.map((c) => [c.code, c.id]));

    const offersRes = await client.query(
      `INSERT INTO offers (slug, title, subtitle, description, banner_url, coupon_id, terms, color_gradient, min_order_amount, valid_until) VALUES
        ('welcome50', 'Flat 50% OFF', 'On your first order',
         'Get a flat 50% discount on your first order from selected restaurants. Maximum savings on pizzas, burgers, biryani, pasta, momos and sandwiches.',
         'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1200',
         $1,
         'Valid on first order only. Minimum order ₹200. Applicable on selected menu items. Cannot be combined with other offers.',
         'from-rose-500 to-red-600', 200.00, NOW() + INTERVAL '90 days'),
        ('freedelivery', 'Free Delivery', 'On orders above ₹500',
         'Enjoy zero delivery charges on orders above ₹500 from participating Chinese, rolls, rice, noodles and pizza restaurants.',
         'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200',
         $2,
         'Minimum order ₹500. Free delivery applied at checkout. Valid at eligible restaurants only.',
         'from-indigo-500 to-blue-600', 500.00, NOW() + INTERVAL '60 days'),
        ('bogo', 'Buy 1 Get 1', 'On selected desserts',
         'Buy one dessert and get 50% off on the second. Perfect for ice cream, brownies, cakes, shakes and coffee.',
         'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=1200',
         $3,
         'Minimum order ₹150. Applicable on dessert menu items. One redemption per order.',
         'from-amber-500 to-orange-600', 150.00, NOW() + INTERVAL '45 days')
       RETURNING id, slug`,
      [couponByCode.WELCOME50, couponByCode.FREEDEL, couponByCode.BOGO]
    );
    const offerBySlug = Object.fromEntries(offersRes.rows.map((o) => [o.slug, o.id]));

    const offerItemMap = {
      welcome50: [
        'Margherita Pizza', 'Pepperoni Pizza', 'Classic Smash Burger',
        'Hyderabadi Biryani', 'Alfredo Pasta', 'Veg Momos', 'Club Sandwich',
      ],
      freedelivery: [
        'Veg Momos', 'Chicken Roll', 'Chicken Fried Rice', 'Hakka Noodles', 'Margherita Pizza',
      ],
      bogo: [
        'Ice Cream Sundae', 'Chocolate Brownie', 'Red Velvet Cake', 'Vanilla Shake', 'Cappuccino',
      ],
    };

    for (const [slug, names] of Object.entries(offerItemMap)) {
      const offerId = offerBySlug[slug];
      for (let i = 0; i < names.length; i++) {
        const menuId = menuByName[names[i]];
        if (menuId) {
          await client.query(
            'INSERT INTO offer_items (offer_id, menu_item_id, display_order) VALUES ($1, $2, $3)',
            [offerId, menuId, i + 1]
          );
        }
      }
    }

    const offerRestaurantMap = {
      welcome50: ["Luigi's Pizza", 'Burger Lab', 'Paradise Biryani', 'Cafe Mocha', 'Wok This Way', 'Breakfast Club'],
      freedelivery: ['Wok This Way', 'Kebab Corner', 'Noodle House', "Luigi's Pizza"],
      bogo: ['Sweet Cravings', 'Ice Cream Parlour', 'Breakfast Club'],
    };

    for (const [slug, names] of Object.entries(offerRestaurantMap)) {
      const offerId = offerBySlug[slug];
      for (const name of names) {
        const restId = restByName[name];
        if (restId) {
          await client.query(
            'INSERT INTO offer_restaurants (offer_id, restaurant_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [offerId, restId]
          );
        }
      }
    }

    const liveBrandRestaurants = await client.query(
      `INSERT INTO restaurants (name, owner_id, category_id, description, address, phone, rating, estimated_delivery_time, price_range, image_url, is_active) VALUES
        ('Domino''s Pizza', $1, $2, 'Pizzas, sides and desserts', '42 Jubilee Hills, Hyderabad', '0401001001', 4.4, 30, 2, 'https://images.unsplash.com/photo-1513104890138-7c049485ea28?w=800', true),
        ('KFC', $1, $3, 'Fried chicken and buckets', '18 Gachibowli, Hyderabad', '0401001002', 4.3, 25, 2, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800', true),
        ('Burger King', $1, $3, 'Flame-grilled burgers and fries', '55 Banjara Hills, Hyderabad', '0401001003', 4.2, 20, 2, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', true),
        ('Behrouz Biryani', $1, $4, 'Royal dum biryani and kebabs', '9 Hitech City, Hyderabad', '0401001004', 4.7, 40, 3, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', true)
       RETURNING id, name`,
      [ownerId, catByName.Italian, catByName['Fast Food'], catByName.Indian]
    );
    const liveRestByName = Object.fromEntries(liveBrandRestaurants.rows.map((r) => [r.name, r.id]));

    const dominosId = liveRestByName["Domino's Pizza"];
    const kfcId = liveRestByName['KFC'];
    const burgerKingId = liveRestByName['Burger King'];
    const behrouzId = liveRestByName['Behrouz Biryani'];

    const liveCats = await client.query(
      `INSERT INTO menu_categories (restaurant_id, name) VALUES
        ($1, 'Pizzas'), ($2, 'Chicken'), ($3, 'Burgers'), ($4, 'Biryani')
       RETURNING id, restaurant_id`,
      [dominosId, kfcId, burgerKingId, behrouzId]
    );
    const liveCatByRest = Object.fromEntries(liveCats.rows.map((c) => [c.restaurant_id, c.id]));

    await client.query(
      `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, is_vegetarian, image_url) VALUES
        ($1, $2, 'Margherita Medium', 'Classic cheese and tomato', 299.00, 249.00, TRUE, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d264?w=400'),
        ($1, $2, 'Pepperoni Feast', 'Loaded pepperoni pizza', 449.00, NULL, FALSE, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400'),
        ($1, $2, 'Farmhouse Veg', 'Loaded veggie pizza', 399.00, NULL, TRUE, 'https://images.unsplash.com/photo-1513104890138-7c049485ea28?w=400'),
        ($1, $2, 'Cheese Burst', 'Extra cheese stuffed crust', 499.00, NULL, TRUE, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
        ($3, $4, 'Chicken Zinger Bucket', '8 pc crispy chicken bucket', 399.00, NULL, FALSE, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400'),
        ($3, $4, 'Hot Wings 6pc', 'Spicy fried wings', 249.00, NULL, FALSE, 'https://images.unsplash.com/photo-1567620832904-9fe5cf23db13?w=400'),
        ($3, $4, 'Popcorn Chicken', 'Bite-sized crispy chicken', 179.00, NULL, FALSE, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400'),
        ($3, $4, 'Crispy Chicken Burger', 'Classic chicken burger meal', 219.00, 199.00, FALSE, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
        ($5, $6, 'Whopper Meal', 'Flame-grilled whopper with fries', 299.00, NULL, FALSE, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
        ($5, $6, 'Chicken Royale', 'Crispy chicken burger', 249.00, NULL, FALSE, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400'),
        ($5, $6, 'Veg Crispy Burger', 'Crispy veg patty burger', 199.00, 179.00, TRUE, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400'),
        ($5, $6, 'Medium Fries', 'Golden crispy fries', 99.00, NULL, TRUE, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400'),
        ($7, $8, 'Chicken Dum Biryani', 'Slow-cooked royal biryani', 349.00, NULL, FALSE, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400'),
        ($7, $8, 'Mutton Dum Biryani', 'Aromatic mutton biryani', 449.00, NULL, FALSE, 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?w=400'),
        ($7, $8, 'Veg Dum Biryani', 'Fragrant veg biryani', 299.00, 269.00, TRUE, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400'),
        ($7, $8, 'Keema Biryani', 'Minced meat biryani', 399.00, NULL, FALSE, 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?w=400')`,
      [
        dominosId, liveCatByRest[dominosId],
        kfcId, liveCatByRest[kfcId],
        burgerKingId, liveCatByRest[burgerKingId],
        behrouzId, liveCatByRest[behrouzId],
      ]
    );

    const liveDealRows = [
      ['dominos', dominosId, 'DOM50', '🔥 Flat 50% OFF', 'Get flat 50% off on all medium and large pizzas.', 'https://logo.clearbit.com/dominos.co.in', 'https://images.unsplash.com/photo-1513104890138-7c049485ea28?w=800', '30 min', 1 * 3600 + 45 * 60 + 28, 1],
      ['kfc', kfcId, 'KFCB1G1', '🍗 Buy 1 Get 1', 'Buy any bucket and get another absolutely free.', 'https://logo.clearbit.com/kfc.co.in', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800', '25 min', 0 * 3600 + 58 * 60 + 12, 2],
      ['burgerking', burgerKingId, 'BKFREE', '🍔 Free Fries', 'Free medium fries with any Whopper meal.', 'https://logo.clearbit.com/burgerking.in', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', '20 min', 2 * 3600 + 10 * 60 + 45, 3],
      ['behrouz', behrouzId, 'BIRYANI150', '🍛 ₹150 OFF', 'Save ₹150 on your first royal biryani order.', 'https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/g1uompslbfswsnhm8pys', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', '40 min', 3 * 3600 + 25 * 60 + 18, 4],
    ];

    for (const [dealKey, restId, couponCode, title, desc, logo, banner, delivery, timer, sort] of liveDealRows) {
      const couponId = couponByCode[couponCode];
      await client.query(
        `INSERT INTO live_deals (deal_key, restaurant_id, coupon_id, offer_title, description, logo_url, banner_url, delivery_time_label, timer_seconds, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [dealKey, restId, couponId, title, desc, logo, banner, delivery, timer, sort]
      );
      await client.query(
        'INSERT INTO restaurant_coupons (restaurant_id, coupon_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [restId, couponId]
      );
    }

    const greenBowlId = restByName['Green Bowl Cafe'];
    const southSpiceId = restByName['South Spice'];
    const streetFoodId = restByName['Street Food Hub'];
    const tokyoId = restByName['Tokyo Sushi Bar'];
    const breakfastClubId = restByName['Breakfast Club'];
    const burgerKingRestId = liveRestByName['Burger King'];

    const extraCuisineCats = await client.query(
      `INSERT INTO menu_categories (restaurant_id, name) VALUES
        ($1, 'Bowls'), ($2, 'South Indian'), ($3, 'Street Snacks'), ($4, 'Seafood'), ($5, 'Mexican'), ($6, 'Bakery')
       RETURNING id, restaurant_id`,
      [greenBowlId, southSpiceId, streetFoodId, tokyoId, wokId, sweetId]
    );
    const extraCatByRest = Object.fromEntries(extraCuisineCats.rows.map((c) => [c.restaurant_id, c.id]));

    await client.query(
      `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, is_vegetarian, image_url) VALUES
        ($1, $2, 'Veg Manchurian', 'Crispy veg balls in spicy sauce', 189.00, NULL, TRUE, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400'),
        ($1, $2, 'Spring Rolls', 'Crispy vegetable spring rolls', 149.00, NULL, TRUE, 'https://images.unsplash.com/photo-1529042410759-b6871208b852?w=400'),
        ($1, $2, 'Schezwan Fried Rice', 'Spicy schezwan fried rice', 209.00, NULL, TRUE, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400'),
        ($1, $2, 'Sweet Corn Soup', 'Classic Indo-Chinese soup', 99.00, NULL, TRUE, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400'),
        ($1, $2, 'Steamed Dumplings', 'Delicate steamed dumplings', 169.00, NULL, TRUE, 'https://images.unsplash.com/photo-1496116218417-1a781b1d4160?w=400'),
        ($3, $4, 'Glazed Donut', 'Soft glazed donut', 79.00, NULL, TRUE, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400'),
        ($3, $4, 'Chocolate Pastry', 'Flaky chocolate pastry', 129.00, NULL, TRUE, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'),
        ($3, $4, 'Belgian Waffle', 'Crispy waffle with syrup', 199.00, NULL, TRUE, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400'),
        ($3, $4, 'Gulab Jamun', 'Warm milk dumplings in syrup', 89.00, NULL, TRUE, 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?w=400'),
        ($3, $4, 'Cheesecake Slice', 'Creamy New York cheesecake', 249.00, NULL, TRUE, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400'),
        ($5, $6, 'Garden Fresh Salad', 'Mixed greens and veggies', 199.00, 179.00, TRUE, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400'),
        ($5, $6, 'Berry Smoothie Bowl', 'Acai smoothie bowl', 249.00, NULL, TRUE, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400'),
        ($5, $6, 'Overnight Oats', 'Oats with fruits and nuts', 179.00, NULL, TRUE, 'https://images.unsplash.com/photo-1511690743698-d9d85f2b0f0d?w=400'),
        ($5, $6, 'Tropical Fruit Bowl', 'Seasonal fresh fruits', 219.00, NULL, TRUE, 'https://images.unsplash.com/photo-1610348727011-843f3a958fa0?w=400'),
        ($5, $6, 'Grilled Protein Bowl', 'Chicken and quinoa bowl', 299.00, NULL, FALSE, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'),
        ($7, $8, 'Masala Dosa', 'Crispy rice crepe with potato', 129.00, NULL, TRUE, 'https://images.unsplash.com/photo-1630384086597-8979abcdbca0?w=400'),
        ($7, $8, 'Idli Sambar', 'Steamed rice cakes with sambar', 99.00, NULL, TRUE, 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?w=400'),
        ($7, $8, 'Medu Vada', 'Crispy lentil donuts', 89.00, NULL, TRUE, 'https://images.unsplash.com/photo-1606491956689-2ea866880f44?w=400'),
        ($9, $10, 'Pani Puri', 'Tangy street pani puri', 79.00, NULL, TRUE, 'https://images.unsplash.com/photo-1606491956689-2ea866880f44?w=400'),
        ($9, $10, 'Veg Frankie', 'Spiced veggie wrap roll', 99.00, NULL, TRUE, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400'),
        ($11, $12, 'Grilled Prawns', 'Butter garlic prawns', 399.00, NULL, FALSE, 'https://images.unsplash.com/photo-1519708226918-03f9baf3230e?w=400'),
        ($11, $12, 'Fish Curry', 'Coastal style fish curry', 349.00, NULL, FALSE, 'https://images.unsplash.com/photo-1519708226918-03f9baf3230e?w=400'),
        ($13, $14, 'Chicken Tacos', 'Soft shell chicken tacos', 249.00, NULL, FALSE, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400'),
        ($13, $14, 'Veg Burrito Bowl', 'Loaded Mexican burrito bowl', 279.00, NULL, TRUE, 'https://images.unsplash.com/photo-1513456852971-3c5c0c4c8b3e?w=400'),
        ($15, $16, 'Croissant', 'Buttery baked croissant', 119.00, NULL, TRUE, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'),
        ($15, $16, 'Garlic Bread', 'Fresh baked garlic bread', 99.00, NULL, TRUE, 'https://images.unsplash.com/photo-1573140247632-f8fdff97d642?w=400'),
        ($17, $18, 'Cold Coffee', 'Iced blended coffee', 149.00, NULL, TRUE, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
        ($17, $18, 'Mango Smoothie', 'Fresh mango smoothie', 129.00, NULL, TRUE, 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400'),
        ($19, $20, 'Chicken Wrap', 'Grilled chicken wrap', 199.00, NULL, FALSE, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400'),
        ($19, $20, 'French Fries', 'Crispy golden fries', 99.00, NULL, TRUE, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400'),
        ($21, $22, 'Tandoori Chicken', 'Clay oven roasted chicken', 329.00, NULL, FALSE, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400'),
        ($21, $22, 'Paneer Tikka', 'Grilled cottage cheese tikka', 279.00, NULL, TRUE, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400')`,
      [
        wokId, catByRest[wokId],
        sweetId, extraCatByRest[sweetId],
        greenBowlId, extraCatByRest[greenBowlId],
        southSpiceId, extraCatByRest[southSpiceId],
        streetFoodId, extraCatByRest[streetFoodId],
        tokyoId, extraCatByRest[tokyoId],
        wokId, extraCatByRest[wokId],
        sweetId, extraCatByRest[sweetId],
        breakfastClubId, catByRest[breakfastClubId],
        burgerKingRestId, liveCatByRest[burgerKingRestId],
        kebabId, catByRest[kebabId],
      ]
    );

    const allMenuByName = Object.fromEntries(
      (await client.query('SELECT id, name FROM menu_items')).rows.map((m) => [m.name, m.id])
    );

    const cuisineItemMap = {
      chinese: ['Veg Momos', 'Chicken Fried Rice', 'Hakka Noodles', 'Veg Manchurian', 'Spring Rolls', 'Schezwan Fried Rice', 'Sweet Corn Soup', 'Steamed Dumplings'],
      desserts: ['Ice Cream Sundae', 'Chocolate Brownie', 'Red Velvet Cake', 'Vanilla Shake', 'Glazed Donut', 'Chocolate Pastry', 'Belgian Waffle', 'Gulab Jamun', 'Cheesecake Slice'],
      'fast-food': ['Classic Smash Burger', 'Veggie Deluxe', 'Margherita Pizza', 'Pepperoni Pizza', 'Club Sandwich', 'French Fries', 'Chicken Wrap', 'Whopper Meal', 'Chicken Royale'],
      healthy: ['Garden Fresh Salad', 'Berry Smoothie Bowl', 'Overnight Oats', 'Tropical Fruit Bowl', 'Grilled Protein Bowl'],
      pizza: ['Margherita Pizza', 'Pepperoni Pizza', 'Margherita Medium', 'Pepperoni Feast', 'Farmhouse Veg', 'Cheese Burst'],
      biryani: ['Hyderabadi Biryani', 'Chicken Dum Biryani', 'Mutton Dum Biryani', 'Veg Dum Biryani', 'Keema Biryani'],
      'south-indian': ['Masala Dosa', 'Idli Sambar', 'Medu Vada'],
      'north-indian': ['Chicken Tikka Masala', 'Paneer Butter Masala', 'Tandoori Chicken', 'Paneer Tikka'],
      italian: ['Alfredo Pasta', 'Margherita Pizza', 'Pepperoni Pizza'],
      indian: ['Chicken Tikka Masala', 'Paneer Butter Masala', 'Chicken Dum Biryani'],
      mexican: ['Chicken Tacos', 'Veg Burrito Bowl'],
      'street-food': ['Pani Puri', 'Veg Frankie', 'Chicken Roll', 'Veg Momos'],
      seafood: ['Grilled Prawns', 'Fish Curry'],
      bakery: ['Croissant', 'Garlic Bread', 'Chocolate Pastry', 'Glazed Donut'],
      beverages: ['Cappuccino', 'Cold Coffee', 'Mango Smoothie', 'Vanilla Shake'],
    };

    for (const [slug, names] of Object.entries(cuisineItemMap)) {
      const cuisineId = catBySlug[slug];
      if (!cuisineId) continue;
      for (let i = 0; i < names.length; i++) {
        const menuId = allMenuByName[names[i]];
        if (menuId) {
          await client.query(
            'INSERT INTO cuisine_items (cuisine_id, menu_item_id, display_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [cuisineId, menuId, i + 1]
          );
        }
      }
    }

    await client.query(
      `INSERT INTO addresses (user_id, full_name, phone_number, house_no, street, landmark, city, state, zip_code, address_type, is_default)
       VALUES ($1, 'Jane Customer', '9876543211', '12-A', 'Banjara Hills Road', 'Near Cafe Coffee Day', 'Hyderabad', 'Telangana', '500034', 'Home', TRUE)`,
      [customerId]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message, is_read) VALUES
        ($1, 'Welcome to Foodiq!', 'Your account is ready. Explore restaurants near you.', FALSE),
        ($1, 'Reward Points Credited', 'You earned 250 welcome bonus points.', FALSE)`,
      [customerId]
    );

    await client.query('COMMIT');
    console.log('Seed completed successfully.');
    console.log('Demo accounts (password: Password123):');
    console.log('  customer@foodiq.com');
    console.log('  owner@foodiq.com');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
