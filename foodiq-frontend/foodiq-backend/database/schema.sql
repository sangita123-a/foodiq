-- Foodiq PostgreSQL Database Schema (idempotent)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'restaurant_owner', 'delivery_partner')),
    profile_image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 2. user_settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(20) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_user_settings_modtime ON user_settings;
CREATE TRIGGER update_user_settings_modtime BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 3. addresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    house_no VARCHAR(100),
    street VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    address_type VARCHAR(50) DEFAULT 'Home' CHECK (address_type IN ('Home', 'Work', 'Other')),
    country VARCHAR(100) DEFAULT 'India',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_addresses_modtime ON addresses;
CREATE TRIGGER update_addresses_modtime BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 4. restaurant_categories
CREATE TABLE IF NOT EXISTS restaurant_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_restaurant_categories_modtime ON restaurant_categories;
CREATE TRIGGER update_restaurant_categories_modtime BEFORE UPDATE ON restaurant_categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 5. restaurants (owner_id nullable so ON DELETE SET NULL is valid)
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES restaurant_categories(id) ON DELETE SET NULL,
    description TEXT,
    address VARCHAR(255),
    phone VARCHAR(20),
    rating DECIMAL(2,1) DEFAULT 0.0,
    estimated_delivery_time INTEGER DEFAULT 30,
    price_range INTEGER DEFAULT 2 CHECK (price_range >= 1 AND price_range <= 4),
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_restaurants_modtime ON restaurants;
CREATE TRIGGER update_restaurants_modtime BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 6. menu_categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_menu_categories_modtime ON menu_categories;
CREATE TRIGGER update_menu_categories_modtime BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 7. menu_items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    preparation_time INTEGER DEFAULT 15,
    calories INTEGER,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_menu_items_modtime ON menu_items;
CREATE TRIGGER update_menu_items_modtime BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 8. cart
CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_cart_modtime ON cart;
CREATE TRIGGER update_cart_modtime BEFORE UPDATE ON cart FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 9. cart_items
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_cart_items_modtime ON cart_items;
CREATE TRIGGER update_cart_items_modtime BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 10. coupons
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    min_order_amount DECIMAL(10,2) DEFAULT 0.0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_coupons_modtime ON coupons;
CREATE TRIGGER update_coupons_modtime BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 11. orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    delivery_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'On The Way', 'Delivered', 'Cancelled', 'pending', 'confirmed', 'cancelled')),
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.0,
    delivery_fee DECIMAL(10,2) DEFAULT 0.0,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_orders_modtime ON orders;
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 12. coupon_usage
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_coupon_usage_modtime ON coupon_usage;
CREATE TRIGGER update_coupon_usage_modtime BEFORE UPDATE ON coupon_usage FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 13. order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_order_items_modtime ON order_items;
CREATE TRIGGER update_order_items_modtime BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 14. payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    method VARCHAR(50) NOT NULL CHECK (method IN ('credit_card', 'debit_card', 'upi', 'wallet', 'cod', 'net_banking')),
    provider_transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_payments_modtime ON payments;
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 15. delivery_partners
CREATE TABLE IF NOT EXISTS delivery_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    vehicle_details VARCHAR(255),
    vehicle_type VARCHAR(50),
    license_number VARCHAR(100),
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_delivery_partners_modtime ON delivery_partners;
CREATE TRIGGER update_delivery_partners_modtime BEFORE UPDATE ON delivery_partners FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 16. order_tracking
CREATE TABLE IF NOT EXISTS order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
    delivery_partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
    current_status VARCHAR(100) NOT NULL,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_order_tracking_modtime ON order_tracking;
CREATE TRIGGER update_order_tracking_modtime BEFORE UPDATE ON order_tracking FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 17. favorites
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, menu_item_id)
);
DROP TRIGGER IF EXISTS update_favorites_modtime ON favorites;
CREATE TRIGGER update_favorites_modtime BEFORE UPDATE ON favorites FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 18. reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_reviews_modtime ON reviews;
CREATE TRIGGER update_reviews_modtime BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 19. notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_notifications_modtime ON notifications;
CREATE TRIGGER update_notifications_modtime BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 20. rewards
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    points_balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_redeemed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_rewards_modtime ON rewards;
CREATE TRIGGER update_rewards_modtime BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 21. reward_history
CREATE TABLE IF NOT EXISTS reward_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('earned', 'redeemed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. contact_messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
