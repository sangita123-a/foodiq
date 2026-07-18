const { pool } = require('../config/db');

/**
 * Ensures critical columns/tables exist so checkout and related flows
 * work even if migrations were not run manually.
 */
async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_instructions TEXT
    `);
    await client.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS offer_id UUID,
        ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(20) DEFAULT 'Now',
        ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE
    `);
    await client.query(`
      ALTER TABLE restaurant_categories
        ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE restaurants
        ADD COLUMN IF NOT EXISTS slug VARCHAR(160),
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS banner_url TEXT,
        ADD COLUMN IF NOT EXISTS distance_km NUMERIC(5,2) DEFAULT 2.5,
        ADD COLUMN IF NOT EXISTS offer_text VARCHAR(160),
        ADD COLUMN IF NOT EXISTS delivery_radius_km NUMERIC(5,2) DEFAULT 5,
        ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS cuisine_types JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(10,2) DEFAULT 0
    `);
    await client.query(`
      ALTER TABLE menu_items
        ADD COLUMN IF NOT EXISTS slug VARCHAR(180),
        ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 4.5,
        ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS ingredients TEXT,
        ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_categories_restaurant_name
        ON menu_categories(restaurant_id, name)
    `);

    // Expand payments.method / status for Razorpay + refunds.
    await client.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'payments' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%method%'
        LIMIT 1;
        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE payments DROP CONSTRAINT %I', constraint_name);
        END IF;
        ALTER TABLE payments
          ADD CONSTRAINT payments_method_check
          CHECK (method IN ('credit_card', 'debit_card', 'upi', 'wallet', 'cod', 'net_banking', 'razorpay'));
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $$;
    `);
    await client.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'payments' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%status%'
        LIMIT 1;
        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE payments DROP CONSTRAINT %I', constraint_name);
        END IF;
        ALTER TABLE payments
          ADD CONSTRAINT payments_status_check
          CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded'));
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $$;
    `);
    await client.query(`
      ALTER TABLE payments
        ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
        ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
        ADD COLUMN IF NOT EXISTS transaction_time TIMESTAMP WITH TIME ZONE
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
        razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
        razorpay_payment_id VARCHAR(100),
        razorpay_signature TEXT,
        amount NUMERIC(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        payment_method VARCHAR(40),
        status VARCHAR(40) NOT NULL DEFAULT 'created',
        checkout_payload JSONB DEFAULT '{}'::jsonb,
        receipt VARCHAR(100),
        failure_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_user
        ON payment_transactions(user_id)
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(10,2) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'full',
        reason TEXT,
        status VARCHAR(40) NOT NULL DEFAULT 'processed',
        razorpay_refund_id VARCHAR(100),
        initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(100),
        phone_number VARCHAR(20),
        house_no VARCHAR(50),
        street VARCHAR(255) NOT NULL,
        landmark VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        address_type VARCHAR(20) DEFAULT 'Home',
        country VARCHAR(100) DEFAULT 'India',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        restaurant_id UUID REFERENCES restaurants(id),
        delivery_address_id UUID REFERENCES addresses(id),
        coupon_id UUID,
        offer_id UUID,
        status VARCHAR(50) DEFAULT 'pending',
        subtotal NUMERIC(10,2) NOT NULL,
        discount_amount NUMERIC(10,2) DEFAULT 0,
        delivery_fee NUMERIC(10,2) DEFAULT 0,
        total_amount NUMERIC(10,2) NOT NULL,
        delivery_instructions TEXT,
        delivery_mode VARCHAR(20) DEFAULT 'Now',
        scheduled_for TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id UUID REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        price_at_time NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure the Burger cuisine exists. Dish membership is owned by the
    // idempotent catalog sync so cuisines never leak items into each other.
    const fastFood = await client.query(
      `SELECT id FROM restaurant_categories WHERE slug = 'fast-food' LIMIT 1`
    );
    if (fastFood.rows[0]) {
      await client.query(
        `INSERT INTO restaurant_categories (name, slug, description, image_url, sort_order)
         SELECT 'Burger', 'burger', 'Juicy burgers, fries and loaded sandwiches',
                '/images/catalog/cuisines/burger.webp', 16
         WHERE NOT EXISTS (SELECT 1 FROM restaurant_categories WHERE slug = 'burger')`
      );

    }

    await client.query(`
      ALTER TABLE menu_items
        ALTER COLUMN image_url TYPE TEXT
    `).catch(() => {});
    await client.query(`
      ALTER TABLE restaurants
        ALTER COLUMN image_url TYPE TEXT
    `).catch(() => {});

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE
    `);
    await client.query(`
      ALTER TABLE restaurants
        ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'
    `);
    await client.query(`
      ALTER TABLE delivery_partners
        ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'
    `);
    await client.query(`
      ALTER TABLE restaurants
        ADD COLUMN IF NOT EXISTS current_lat NUMERIC(10,7),
        ADD COLUMN IF NOT EXISTS current_lng NUMERIC(10,7)
    `);
    await client.query(`
      ALTER TABLE addresses
        ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7),
        ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        delivery_partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        status VARCHAR(40) NOT NULL DEFAULT 'offered',
        offered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_assignments_partner_status
        ON delivery_assignments(delivery_partner_id, status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order
        ON delivery_assignments(order_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES delivery_assignments(id) ON DELETE SET NULL,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        delivery_partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
        status VARCHAR(40) NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_earnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        delivery_partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        assignment_id UUID REFERENCES delivery_assignments(id) ON DELETE SET NULL,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        base_fee NUMERIC(10,2) DEFAULT 0,
        incentive NUMERIC(10,2) DEFAULT 0,
        note TEXT,
        earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_earnings_order_partner
        ON delivery_earnings(order_id, delivery_partner_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        delivery_charge NUMERIC(10,2) DEFAULT 50,
        free_delivery_min NUMERIC(10,2) DEFAULT 500,
        tax_percent NUMERIC(5,2) DEFAULT 5,
        commission_percent NUMERIC(5,2) DEFAULT 15,
        app_name VARCHAR(100) DEFAULT 'Foodiq',
        support_email VARCHAR(255) DEFAULT 'support@foodiq.com',
        support_phone VARCHAR(30) DEFAULT '+91 1800 000 000',
        payment_cod_enabled BOOLEAN DEFAULT TRUE,
        payment_upi_enabled BOOLEAN DEFAULT TRUE,
        payment_card_enabled BOOLEAN DEFAULT TRUE,
        payment_razorpay_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      INSERT INTO admin_settings (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query(`
      ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS type VARCHAR(60) DEFAULT 'alert',
        ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT 'Orders',
        ADD COLUMN IF NOT EXISTS role VARCHAR(40),
        ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS dedupe_key VARCHAR(180)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created
        ON notifications(user_id, created_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
        ON notifications(user_id) WHERE is_read = FALSE
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        platform VARCHAR(30) NOT NULL DEFAULT 'web',
        device_info JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_device_tokens_user
        ON device_tokens(user_id) WHERE is_active = TRUE
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
        ON notification_queue(status, next_attempt_at)
    `);

    // Email / SMS preference columns + logging / OTP
    await client.query(`
      ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS notify_orders BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS notify_offers BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS notify_rewards BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'in',
        ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'inr',
        ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'ist',
        ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) DEFAULT '#FF2D3B',
        ADD COLUMN IF NOT EXISTS hide_profile BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS data_sharing BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS notify_order_updates BOOLEAN DEFAULT TRUE
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        to_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        template VARCHAR(80),
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        provider VARCHAR(40),
        provider_message_id VARCHAR(255),
        error TEXT,
        attempts INTEGER NOT NULL DEFAULT 1,
        meta JSONB DEFAULT '{}'::jsonb,
        related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_logs_user_created
        ON email_logs(user_id, created_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_logs_status
        ON email_logs(status, created_at DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        to_phone VARCHAR(30) NOT NULL,
        body TEXT NOT NULL,
        template VARCHAR(80),
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        provider VARCHAR(40),
        provider_message_id VARCHAR(255),
        error TEXT,
        attempts INTEGER NOT NULL DEFAULT 1,
        meta JSONB DEFAULT '{}'::jsonb,
        related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_logs_user_created
        ON sms_logs(user_id, created_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_logs_status
        ON sms_logs(status, created_at DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        destination VARCHAR(255) NOT NULL,
        channel VARCHAR(20) NOT NULL DEFAULT 'email',
        purpose VARCHAR(60) NOT NULL DEFAULT 'verification',
        code_hash VARCHAR(128) NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        consumed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_otp_destination_purpose
        ON otp_codes(destination, purpose, created_at DESC)
    `);

    // Cloud media library + delivery document URLs
    await client.query(`
      ALTER TABLE users
        ALTER COLUMN profile_image_url TYPE TEXT
    `).catch(() => {});

    await client.query(`
      ALTER TABLE delivery_partners
        ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS license_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS vehicle_rc_url TEXT,
        ADD COLUMN IF NOT EXISTS insurance_doc_url TEXT
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        purpose VARCHAR(60) NOT NULL DEFAULT 'other',
        folder VARCHAR(255),
        url TEXT NOT NULL,
        public_id TEXT NOT NULL,
        provider VARCHAR(40) NOT NULL DEFAULT 'mock',
        mime_type VARCHAR(100),
        file_type VARCHAR(30) NOT NULL DEFAULT 'image',
        file_size INTEGER DEFAULT 0,
        width INTEGER,
        height INTEGER,
        format VARCHAR(20),
        status VARCHAR(30) NOT NULL DEFAULT 'approved',
        entity_type VARCHAR(60),
        entity_id UUID,
        variants JSONB DEFAULT '{}'::jsonb,
        meta JSONB DEFAULT '{}'::jsonb,
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_media_user_created
        ON media_assets(user_id, created_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_media_purpose_status
        ON media_assets(purpose, status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_media_public_id
        ON media_assets(public_id)
    `);

    // Performance indexes (catalog / search / orders)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_restaurants_active_rating
        ON restaurants(is_active, rating DESC NULLS LAST)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_restaurants_category_active
        ON restaurants(category_id, is_active)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_available
        ON menu_items(restaurant_id, is_available)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_menu_items_trending
        ON menu_items(is_trending, trending_score DESC NULLS LAST)
      WHERE is_trending = TRUE
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_restaurant
        ON reviews(restaurant_id)
    `);

    // Maintenance phase: reviews moderation + feedback / bugs
    await client.query(`
      ALTER TABLE reviews
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'visible',
        ADD COLUMN IF NOT EXISTS admin_reply TEXT,
        ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE
    `).catch(() => {});
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_order
        ON reviews(user_id, order_id) WHERE order_id IS NOT NULL
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id)
    `).catch(() => {});

    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        delivery_partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(order_id)
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_reviews_partner
        ON delivery_reviews(delivery_partner_id, created_at DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        overall_rating INTEGER CHECK (overall_rating IS NULL OR (overall_rating >= 1 AND overall_rating <= 5)),
        comment TEXT,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        category VARCHAR(80) NOT NULL DEFAULT 'general',
        message TEXT NOT NULL,
        page_url TEXT,
        status VARCHAR(40) NOT NULL DEFAULT 'open',
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_status
        ON user_feedback(status, created_at DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bug_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        status VARCHAR(30) NOT NULL DEFAULT 'open',
        page_url TEXT,
        user_agent TEXT,
        error_event_id UUID,
        assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bug_reports_status_created
        ON bug_reports(status, created_at DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period VARCHAR(20) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_maintenance_reports_period
        ON maintenance_reports(period, created_at DESC)
    `);

    await client.query(`
      ALTER TABLE contact_messages
        ADD COLUMN IF NOT EXISTS phone VARCHAR(40),
        ADD COLUMN IF NOT EXISTS reason VARCHAR(80),
        ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'open'
    `).catch(() => {});
    await client.query(`
      ALTER TABLE support_tickets
        ADD COLUMN IF NOT EXISTS admin_notes TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_created
        ON orders(user_id, created_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status
        ON orders(restaurant_id, status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_active_valid
        ON offers(is_active, valid_until)
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order
        ON order_items(order_id)
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_menu
        ON order_items(menu_item_id)
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_slug
        ON offers(slug)
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_offer_items_offer
        ON offer_items(offer_id)
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_offer_restaurants_offer
        ON offer_restaurants(offer_id)
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_addresses_user
        ON addresses(user_id)
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_coupons_code
        ON coupons(code)
    `).catch(() => {});
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_partners_user
        ON delivery_partners(user_id)
    `).catch(() => {});
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_restaurants_name_trgm
          ON restaurants USING gin (name gin_trgm_ops)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_menu_items_name_trgm
          ON menu_items USING gin (name gin_trgm_ops)
      `);
    } catch {
      /* extension may be restricted on some hosts */
    }
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_user_created
        ON payments(user_id, created_at DESC)
    `).catch(() => {});

    // Monitoring / security tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        role VARCHAR(40),
        action VARCHAR(120) NOT NULL,
        category VARCHAR(60) DEFAULT 'general',
        resource_type VARCHAR(60),
        resource_id VARCHAR(120),
        status VARCHAR(30) DEFAULT 'success',
        message TEXT,
        ip_address VARCHAR(100),
        device VARCHAR(40),
        browser VARCHAR(60),
        user_agent TEXT,
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, created_at DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS error_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source VARCHAR(40) DEFAULT 'backend',
        type VARCHAR(60) DEFAULT 'exception',
        message TEXT NOT NULL,
        stack TEXT,
        status_code INTEGER,
        path TEXT,
        method VARCHAR(20),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        request_id VARCHAR(80),
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_error_events_created ON error_events(created_at DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        cpu_load NUMERIC(10,2),
        memory_used_mb INTEGER,
        error_rate NUMERIC(10,2),
        avg_response_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS security_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        severity VARCHAR(20) DEFAULT 'warning',
        type VARCHAR(80) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        status VARCHAR(30) DEFAULT 'open',
        meta JSONB DEFAULT '{}'::jsonb,
        acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
        acknowledged_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(128) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked_at TIMESTAMP WITH TIME ZONE,
        user_agent TEXT,
        ip_address VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
        ON refresh_tokens(user_id) WHERE revoked_at IS NULL
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS backup_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(40) NOT NULL DEFAULT 'database',
        status VARCHAR(30) NOT NULL DEFAULT 'success',
        location TEXT,
        size_bytes BIGINT,
        message TEXT,
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_name VARCHAR(255),
        device_type VARCHAR(50) DEFAULT 'desktop',
        browser VARCHAR(100),
        os VARCHAR(100),
        ip_address VARCHAR(100),
        location VARCHAR(255),
        is_current BOOLEAN DEFAULT FALSE,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    await client.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_name VARCHAR(255),
        ip_address VARCHAR(100),
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // Bootstrap demo users ONLY when explicitly allowed (never default in production).
    const allowBootstrap =
      String(process.env.ALLOW_BOOTSTRAP_USERS || '').toLowerCase() === 'true' ||
      (process.env.NODE_ENV !== 'production' &&
        String(process.env.ALLOW_BOOTSTRAP_USERS || 'true').toLowerCase() !== 'false');

    if (allowBootstrap) {
    // Ensure a default admin account exists for local/prod bootstrap.
    const bcrypt = require('bcrypt');
    const adminEmail = 'admin@foodiq.com';
    const existing = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [adminEmail]
    );
    if (!existing.rows[0]) {
      const hash = await bcrypt.hash('Password123', 12);
      const inserted = await client.query(
        `INSERT INTO users (email, password_hash, full_name, phone_number, role)
         VALUES ($1, $2, $3, $4, 'admin') RETURNING id`,
        [adminEmail, hash, 'Foodiq Admin', '9999999999']
      );
      await client.query(
        `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [inserted.rows[0].id]
      ).catch(() => {});
      console.log('[SCHEMA] Seeded admin@foodiq.com (dev bootstrap)');
    }

    const riderEmail = 'rider@foodiq.com';
    const riderExisting = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [riderEmail]
    );
    if (!riderExisting.rows[0]) {
      const hash = await bcrypt.hash('Password123', 12);
      const inserted = await client.query(
        `INSERT INTO users (email, password_hash, full_name, phone_number, role)
         VALUES ($1, $2, $3, $4, 'delivery_partner') RETURNING id`,
        [riderEmail, hash, 'Ravi Rider', '9888888888']
      );
      await client.query(
        `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [inserted.rows[0].id]
      ).catch(() => {});
      await client.query(
        `INSERT INTO delivery_partners (user_id, vehicle_details, vehicle_type, license_number, is_available, approval_status, current_lat, current_lng, rating)
         VALUES ($1, 'KA-01-AB-1234', 'Bike', 'DL-FOODIQ-001', TRUE, 'approved', 12.9716, 77.5946, 4.8)
         ON CONFLICT (user_id) DO NOTHING`,
        [inserted.rows[0].id]
      );
      console.log('[SCHEMA] Seeded rider@foodiq.com (dev bootstrap)');
    }
    } else {
      console.log('[SCHEMA] Bootstrap users skipped (production hardening)');
    }

    console.log('[SCHEMA] Critical schema checks completed');
  } catch (err) {
    console.error('[SCHEMA] ensureSchema warning:', err.message);
  } finally {
    client.release();
  }
}

module.exports = ensureSchema;
