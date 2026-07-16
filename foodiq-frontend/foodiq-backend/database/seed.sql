-- Foodiq PostgreSQL Database Seed Data

-- 1. Insert Restaurant Categories
INSERT INTO restaurant_categories (id, name, description) VALUES
(gen_random_uuid(), 'Italian', 'Authentic Italian pizzas and pastas'),
(gen_random_uuid(), 'Indian', 'Rich and spicy Indian curries'),
(gen_random_uuid(), 'Fast Food', 'Quick bites and burgers'),
(gen_random_uuid(), 'Healthy', 'Salads, bowls, and smoothies');

-- 2. Insert Users (Restaurant Owner and Customer)
INSERT INTO users (id, email, password_hash, full_name, phone_number, role) VALUES
(gen_random_uuid(), 'owner@foodiq.com', 'hashed_password_placeholder', 'John Owner', '1234567890', 'restaurant_owner'),
(gen_random_uuid(), 'customer@foodiq.com', 'hashed_password_placeholder', 'Jane Customer', '0987654321', 'customer');

-- Use DO block to safely insert related data
DO $$
DECLARE
    owner_id UUID;
    customer_id UUID;
    cat_italian UUID;
    cat_indian UUID;
    rest_pizza UUID;
    rest_curry UUID;
    menu_cat_pizza UUID;
    menu_cat_curry UUID;
BEGIN
    SELECT id INTO owner_id FROM users WHERE email = 'owner@foodiq.com';
    SELECT id INTO customer_id FROM users WHERE email = 'customer@foodiq.com';
    SELECT id INTO cat_italian FROM restaurant_categories WHERE name = 'Italian';
    SELECT id INTO cat_indian FROM restaurant_categories WHERE name = 'Indian';

    -- 3. Insert Restaurants
    INSERT INTO restaurants (id, name, owner_id, category_id, description, address, rating) VALUES
    (gen_random_uuid(), 'Luigis Pizza', owner_id, cat_italian, 'Best pizza in town', '123 Main St', 4.5) RETURNING id INTO rest_pizza;
    
    INSERT INTO restaurants (id, name, owner_id, category_id, description, address, rating) VALUES
    (gen_random_uuid(), 'Spicy Curry House', owner_id, cat_indian, 'Authentic Indian flavors', '456 Curry Ave', 4.7) RETURNING id INTO rest_curry;

    -- 4. Insert Menu Categories
    INSERT INTO menu_categories (id, restaurant_id, name) VALUES
    (gen_random_uuid(), rest_pizza, 'Wood Fired Pizzas') RETURNING id INTO menu_cat_pizza;
    
    INSERT INTO menu_categories (id, restaurant_id, name) VALUES
    (gen_random_uuid(), rest_curry, 'Main Course') RETURNING id INTO menu_cat_curry;

    -- 5. Insert Menu Items
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian) VALUES
    (rest_pizza, menu_cat_pizza, 'Margherita Pizza', 'Classic cheese and tomato', 12.99, TRUE),
    (rest_pizza, menu_cat_pizza, 'Pepperoni Pizza', 'Double pepperoni', 15.99, FALSE),
    (rest_curry, menu_cat_curry, 'Chicken Tikka Masala', 'Creamy and spicy', 14.50, FALSE),
    (rest_curry, menu_cat_curry, 'Paneer Butter Masala', 'Vegetarian delight', 13.50, TRUE);

    -- 6. Insert Coupons
    INSERT INTO coupons (code, discount_amount, discount_type, min_order_amount) VALUES
    ('WELCOME50', 50.00, 'percentage', 20.00),
    ('FLAT10', 10.00, 'fixed', 50.00);

END $$;
