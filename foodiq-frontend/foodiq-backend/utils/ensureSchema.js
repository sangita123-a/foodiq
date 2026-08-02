const { pool } = require('../config/db');

/**
 * Ensures critical columns/tables exist so checkout and related flows
 * work even if migrations were not run manually.
 */
async function ensureSchema() {
  const client = await pool.connect();
  const q = async (sql, params) => {
    try {
      return await client.query(sql, params);
    } catch (err) {
      console.warn('[SCHEMA] statement skipped:', err.message);
      return null;
    }
  };
  try {
    // ── Delivery Partners table ───────────────────────────────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        full_name VARCHAR(255),
        email VARCHAR(255),
        phone_number VARCHAR(20),
        password_hash VARCHAR(255),
        vehicle_type VARCHAR(50),
        vehicle_number VARCHAR(50),
        vehicle_details TEXT,
        driving_license_number VARCHAR(100),
        license_number VARCHAR(100),
        aadhaar_number VARCHAR(50),
        profile_photo TEXT,
        profile_photo_url TEXT,
        vehicle_photo_url TEXT,
        license_photo_url TEXT,
        vehicle_rc_url TEXT,
        insurance_doc_url TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        address TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        is_online BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT FALSE,
        status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
        approval_status VARCHAR(20) DEFAULT 'approved',
        rating DECIMAL(3,2) DEFAULT 5.0,
        wallet_balance DECIMAL(10,2) DEFAULT 0,
        current_lat NUMERIC(10,7),
        current_lng NUMERIC(10,7),
        bank_account_name TEXT,
        bank_account_number TEXT,
        bank_ifsc TEXT,
        upi_id TEXT,
        aadhaar_last4 VARCHAR(4),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure all columns exist even if delivery_partners was created previously
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS vehicle_details TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS driving_license_number VARCHAR(100)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS license_number VARCHAR(100)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(50)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS profile_photo TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS profile_photo_url TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS license_photo_url TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS vehicle_rc_url TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS insurance_doc_url TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS city VARCHAR(100)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS state VARCHAR(100)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS address TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT FALSE`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending'`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS current_lat NUMERIC(10,7)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS current_lng NUMERIC(10,7)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS bank_account_name TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS bank_account_number TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS bank_ifsc TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS upi_id TEXT`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS aadhaar_last4 VARCHAR(4)`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
    await q(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);

    // Data sync routines for existing production rows
    await q(`
      UPDATE delivery_partners dp
      SET
        email = COALESCE(dp.email, u.email),
        password_hash = COALESCE(dp.password_hash, u.password_hash),
        full_name = COALESCE(dp.full_name, u.full_name),
        phone_number = COALESCE(dp.phone_number, u.phone_number)
      FROM users u
      WHERE u.id = dp.user_id
        AND (dp.email IS NULL OR dp.password_hash IS NULL OR dp.full_name IS NULL OR dp.phone_number IS NULL)
    `);
    await q(`
      UPDATE delivery_partners
      SET
        driving_license_number = COALESCE(driving_license_number, license_number),
        license_number = COALESCE(license_number, driving_license_number)
      WHERE driving_license_number IS NULL OR license_number IS NULL
    `);
    await q(`
      UPDATE delivery_partners
      SET
        status = COALESCE(status, approval_status, 'pending'),
        approval_status = COALESCE(approval_status, status, 'approved')
    `);
    await q(`
      UPDATE delivery_partners
      SET
        is_online = COALESCE(is_online, is_available, FALSE),
        is_available = COALESCE(is_available, is_online, FALSE)
    `);

    await q(`CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_partners_email ON delivery_partners(email) WHERE email IS NOT NULL`);
    await q(`CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_partners_phone ON delivery_partners(phone_number) WHERE phone_number IS NOT NULL`);
    await q(`CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_partners_dl ON delivery_partners(driving_license_number) WHERE driving_license_number IS NOT NULL`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_partners_user_id ON delivery_partners(user_id) WHERE user_id IS NOT NULL`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_partners_status ON delivery_partners(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_partners_online ON delivery_partners(is_online)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_partners_available ON delivery_partners(is_available)`);

    // ── OTP / SMS / Email tables (must exist before any auth request) ──────────
    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_otp_codes_dest_purpose
      ON otp_codes(destination, purpose, consumed_at)
      WHERE consumed_at IS NULL
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_otp_codes_expires
      ON otp_codes(expires_at)
      WHERE consumed_at IS NULL
    `);
    await q(`
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
    await q(`
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
    // ── Orders ────────────────────────────────────────────────────────────────
    await q(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_instructions TEXT
    `);
    await q(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS offer_id UUID,
        ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(20) DEFAULT 'Now',
        ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE
    `);
    await q(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS delivery_otp_hash VARCHAR(255),
        ADD COLUMN IF NOT EXISTS delivery_otp_expires_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS delivery_otp_attempts INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS delivery_verified_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(10)
    `);
    await q(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
        restaurant_name VARCHAR(255),
        dish_name VARCHAR(255),
        city VARCHAR(120),
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review_text TEXT NOT NULL,
        user_name VARCHAR(255),
        profile_image_url TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
        helpful_count INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        order_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured) WHERE status = 'approved'`);
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_testimonials_user_order
      ON testimonials(user_id, order_id)
      WHERE order_id IS NOT NULL
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS review_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_review_images_testimonial ON review_images(testimonial_id)`);
    await q(`
      CREATE TABLE IF NOT EXISTS helpful_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (testimonial_id, user_id)
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS reported_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
        reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        reason TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'open'
          CHECK (status IN ('open', 'reviewed', 'dismissed', 'actioned')),
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_reported_reviews_status ON reported_reviews(status)`);
    await q(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(40) NOT NULL UNIQUE,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(10,2) NOT NULL,
        tax_amount NUMERIC(10,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(30) NOT NULL DEFAULT 'issued',
        issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id)`);
    await q(`
      ALTER TABLE restaurant_categories
        ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);
    await q(`
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
    await q(`
      ALTER TABLE menu_items
        ADD COLUMN IF NOT EXISTS slug VARCHAR(180),
        ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 4.5,
        ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS ingredients TEXT,
        ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb
    `);
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_categories_restaurant_name
        ON menu_categories(restaurant_id, name)
    `);

    // Expand payments.method / status for Razorpay + refunds.
    await q(`
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
    await q(`
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
    await q(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'orders' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%status%'
        LIMIT 1;
        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', constraint_name);
        END IF;
        ALTER TABLE orders
          ADD CONSTRAINT orders_status_check
          CHECK (status IN ('Pending', 'Paid', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'On The Way', 'Out for Delivery', 'Delivered', 'Cancelled', 'pending', 'paid', 'confirmed', 'cancelled'));
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $$;
    `);
    await q(`
      ALTER TABLE payments
        ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
        ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
        ADD COLUMN IF NOT EXISTS transaction_time TIMESTAMP WITH TIME ZONE
    `);
    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_user
        ON payment_transactions(user_id)
    `);
    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id)
    `);

    await q(`
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

    await q(`
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

    await q(`
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
    const fastFood = await q(
      `SELECT id FROM restaurant_categories WHERE slug = 'fast-food' LIMIT 1`
    );
    if (fastFood.rows[0]) {
      await q(
        `INSERT INTO restaurant_categories (name, slug, description, image_url, sort_order)
         SELECT 'Burger', 'burger', 'Juicy burgers, fries and loaded sandwiches',
                '/images/catalog/cuisines/burger.webp', 16
         WHERE NOT EXISTS (SELECT 1 FROM restaurant_categories WHERE slug = 'burger')`
      );

    }

    await q(`
      ALTER TABLE menu_items
        ALTER COLUMN image_url TYPE TEXT
    `);
    await q(`
      ALTER TABLE restaurants
        ALTER COLUMN image_url TYPE TEXT
    `);

    await q(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS date_of_birth DATE,
        ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
        ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE
    `);
    await q(`
      ALTER TABLE restaurants
        ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'
    `);
    await q(`
      ALTER TABLE delivery_partners
        ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'
    `);
    await q(`
      ALTER TABLE restaurants
        ADD COLUMN IF NOT EXISTS current_lat NUMERIC(10,7),
        ADD COLUMN IF NOT EXISTS current_lng NUMERIC(10,7)
    `);
    await q(`
      ALTER TABLE addresses
        ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7),
        ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7)
    `);

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_assignments_partner_status
        ON delivery_assignments(delivery_partner_id, status)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order
        ON delivery_assignments(order_id)
    `);

    await q(`
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

    await q(`
      CREATE TABLE IF NOT EXISTS driver_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        latitude NUMERIC(10,7) NOT NULL,
        longitude NUMERIC(10,7) NOT NULL,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_time
        ON driver_locations(driver_id, last_updated DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_driver_locations_order
        ON driver_locations(order_id, last_updated DESC)
    `);

    // ── Live Delivery Tracking: GPS ping history (accuracy/speed/heading) ─────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        latitude NUMERIC(10,7) NOT NULL,
        longitude NUMERIC(10,7) NOT NULL,
        accuracy NUMERIC(10,2),
        speed NUMERIC(10,2),
        heading NUMERIC(6,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_locations_partner_time
        ON delivery_locations(partner_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_locations_order_time
        ON delivery_locations(order_id, created_at DESC)
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS order_tracking_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(80) NOT NULL,
        note TEXT,
        actor_type VARCHAR(40),
        actor_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_order_tracking_history_order
        ON order_tracking_history(order_id, created_at ASC)
    `);

    await q(`
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
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_earnings_order_partner
        ON delivery_earnings(order_id, delivery_partner_id)
    `);

    await q(`
      ALTER TABLE delivery_partners
        ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
        ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
        ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
        ADD COLUMN IF NOT EXISTS upi_id TEXT,
        ADD COLUMN IF NOT EXISTS aadhaar_last4 VARCHAR(4)
    `);

    // Superseded by delivery_wallets / delivery_transactions / withdrawal_requests below.
    await q(`DROP TABLE IF EXISTS driver_withdrawal_requests CASCADE`);
    await q(`DROP TABLE IF EXISTS driver_wallet_transactions CASCADE`);
    await q(`DROP TABLE IF EXISTS driver_wallets CASCADE`);

    // ── Delivery Partner Wallet & Earnings ────────────────────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL UNIQUE REFERENCES delivery_partners(id) ON DELETE CASCADE,
        available_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
        pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
        lifetime_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS delivery_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
        amount NUMERIC(12,2) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_transactions_partner ON delivery_transactions(partner_id, created_at DESC)`);

    await q(`
      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        bank_account_id UUID,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_note TEXT,
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP WITH TIME ZONE
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_partner ON withdrawal_requests(partner_id, requested_at DESC)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status)`);

    // ── Delivery Partner Notification System ──────────────────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN (
          'new_order', 'order_assigned', 'order_cancelled', 'order_updated',
          'delivery_completed', 'wallet_credit', 'withdrawal_approved',
          'withdrawal_rejected', 'kyc_approved', 'kyc_rejected', 'admin_message',
          'support_ticket_reply', 'support_ticket_resolved'
        )),
        related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        action_url TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_notifications_partner ON delivery_notifications(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_notifications_is_read ON delivery_notifications(is_read)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_notifications_created_at ON delivery_notifications(created_at DESC)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_notifications_partner_created ON delivery_notifications(partner_id, created_at DESC)`);
    // Migrate pre-existing installs: add action_url and widen the type CHECK to include support ticket types.
    await q(`ALTER TABLE delivery_notifications ADD COLUMN IF NOT EXISTS action_url TEXT`);
    await q(`ALTER TABLE delivery_notifications DROP CONSTRAINT IF EXISTS delivery_notifications_type_check`);
    await q(`
      ALTER TABLE delivery_notifications ADD CONSTRAINT delivery_notifications_type_check CHECK (type IN (
        'new_order', 'order_assigned', 'order_cancelled', 'order_updated',
        'delivery_completed', 'wallet_credit', 'withdrawal_approved',
        'withdrawal_rejected', 'kyc_approved', 'kyc_rejected', 'admin_message',
        'support_ticket_reply', 'support_ticket_resolved',
        'referral_registered', 'reward_credited', 'referral_expired', 'first_delivery_completed'
      ))
    `);

    // ── Delivery Partner Referral Module Tables & Indexes ──────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
        referred_partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
        referral_code VARCHAR(30) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'kyc_completed', 'first_delivery_completed', 'rewarded', 'expired')),
        reward_amount NUMERIC(10, 2) DEFAULT 500.00,
        reward_type VARCHAR(50) DEFAULT 'cash',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS delivery_referral_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
        referral_id UUID REFERENCES delivery_referrals(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        wallet_transaction_id UUID,
        status VARCHAR(50) DEFAULT 'credited' CHECK (status IN ('pending', 'credited', 'cancelled')),
        credited_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS delivery_referral_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        default_reward_amount NUMERIC(10, 2) DEFAULT 500.00,
        reward_type VARCHAR(50) DEFAULT 'cash',
        expiry_days INTEGER DEFAULT 30,
        min_deliveries_required INTEGER DEFAULT 1,
        auto_credit_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      INSERT INTO delivery_referral_settings (default_reward_amount, reward_type, expiry_days, min_deliveries_required, auto_credit_enabled)
      SELECT 500.00, 'cash', 30, 1, TRUE
      WHERE NOT EXISTS (SELECT 1 FROM delivery_referral_settings)
    `);

    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_partner_id ON delivery_referrals(referrer_partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_referred_id ON delivery_referrals(referred_partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_code ON delivery_referrals(referral_code)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_status ON delivery_referrals(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_created_at ON delivery_referrals(created_at DESC)`);

    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referral_rewards_partner_id ON delivery_referral_rewards(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referral_rewards_referral_id ON delivery_referral_rewards(referral_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referral_rewards_status ON delivery_referral_rewards(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referral_rewards_created_at ON delivery_referral_rewards(created_at DESC)`);


    // ── Delivery Partner Support Tickets (Full Chat Module) ────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(30) UNIQUE NOT NULL,
        partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        assigned_admin UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP WITH TIME ZONE
      )
    `);
    await q(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE`);
    await q(`CREATE INDEX IF NOT EXISTS idx_support_tickets_partner_id ON support_tickets(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC)`);

    await q(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('partner', 'admin')),
        sender_id UUID NOT NULL,
        message TEXT,
        attachment_url TEXT,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at ASC)`);

    await q(`
      CREATE TABLE IF NOT EXISTS support_ticket_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        performed_by UUID,
        old_status VARCHAR(20),
        new_status VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_support_ticket_logs_ticket_id ON support_ticket_logs(ticket_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_support_ticket_logs_created_at ON support_ticket_logs(created_at DESC)`);

    // Legacy table compatibility
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
        admin_reply TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_support_tickets_partner ON delivery_support_tickets(partner_id, created_at DESC)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_support_tickets_status ON delivery_support_tickets(status)`);


    await q(`
      CREATE TABLE IF NOT EXISTS customer_wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance NUMERIC(12,2) NOT NULL DEFAULT 0,
        cashback_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
        refund_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(40) NOT NULL,
        category VARCHAR(40) DEFAULT 'general',
        amount NUMERIC(12,2) NOT NULL,
        balance_after NUMERIC(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'completed',
        reference_type VARCHAR(40),
        reference_id VARCHAR(120),
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        dedupe_key VARCHAR(200),
        note TEXT,
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_transactions_dedupe
        ON wallet_transactions(dedupe_key) WHERE dedupe_key IS NOT NULL
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user
        ON wallet_transactions(user_id, created_at DESC)
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS refund_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        refund_type VARCHAR(30) NOT NULL DEFAULT 'full',
        refund_method VARCHAR(30) NOT NULL DEFAULT 'wallet',
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        reason TEXT,
        initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        dedupe_key VARCHAR(200),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP WITH TIME ZONE
      )
    `);
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_requests_dedupe
        ON refund_requests(dedupe_key) WHERE dedupe_key IS NOT NULL
    `);
    await q(`
      ALTER TABLE refunds
        ADD COLUMN IF NOT EXISTS refund_method VARCHAR(30) DEFAULT 'original',
        ADD COLUMN IF NOT EXISTS refund_request_id UUID
    `);
    await q(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS wallet_amount_used NUMERIC(12,2) DEFAULT 0
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        delivery_charge NUMERIC(10,2) DEFAULT 50,
        free_delivery_min NUMERIC(10,2) DEFAULT 500,
        tax_percent NUMERIC(5,2) DEFAULT 5,
        commission_percent NUMERIC(5,2) DEFAULT 15,
        app_name VARCHAR(100) DEFAULT 'Foodiq',
        support_email VARCHAR(255) DEFAULT 'ssangitasahoo48@gmail.com',
        support_phone VARCHAR(30) DEFAULT '+91 6371115043',
        payment_cod_enabled BOOLEAN DEFAULT TRUE,
        payment_upi_enabled BOOLEAN DEFAULT TRUE,
        payment_card_enabled BOOLEAN DEFAULT TRUE,
        payment_razorpay_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      INSERT INTO admin_settings (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);

    const siteSettingColumns = [
      ['logo_url', 'TEXT'],
      ['website_url', "VARCHAR(500) DEFAULT 'https://foodiq.com'"],
      ['office_address', 'TEXT'],
      ['whatsapp_number', 'VARCHAR(30)'],
      ['google_maps_embed_url', 'TEXT'],
      ['business_hours', "TEXT DEFAULT 'Mon - Sun: 24/7 Support'"],
      ['facebook_url', 'VARCHAR(500)'],
      ['instagram_url', 'VARCHAR(500)'],
      ['twitter_url', 'VARCHAR(500)'],
      ['linkedin_url', 'VARCHAR(500)'],
      ['youtube_url', 'VARCHAR(500)'],
      ['theme_color', "VARCHAR(20) DEFAULT '#E23744'"],
      ['footer_content', 'TEXT'],
      ['privacy_policy_text', 'TEXT'],
      ['terms_of_service_text', 'TEXT'],
      ['company_name', "VARCHAR(255) DEFAULT 'Foodiq'"],
    ];
    for (const [col, typ] of siteSettingColumns) {
      await q(`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS ${col} ${typ}`);
    }

    await q(`
      UPDATE admin_settings SET
        support_phone = '+91 6371115043',
        support_email = 'ssangitasahoo48@gmail.com',
        whatsapp_number = '+91 6371115043',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line VARCHAR(255)`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100)`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(20)`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_banner_url TEXT`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(30)`);
    await q(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role VARCHAR(40)
        CHECK (admin_role IS NULL OR admin_role IN (
          'super_admin', 'admin', 'support_executive', 'finance_manager', 'marketing_manager'
        ))
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS cms_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_key VARCHAR(80) NOT NULL UNIQUE,
        content_type VARCHAR(40) NOT NULL DEFAULT 'block',
        title VARCHAR(200),
        body JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(160) NOT NULL,
        channel VARCHAR(40) NOT NULL CHECK (channel IN ('push', 'email', 'sms', 'banner')),
        audience VARCHAR(40) DEFAULT 'all',
        subject VARCHAR(200),
        message TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'draft',
        scheduled_at TIMESTAMP WITH TIME ZONE,
        sent_count INTEGER DEFAULT 0,
        meta JSONB DEFAULT '{}'::jsonb,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        points_balance INTEGER DEFAULT 0,
        total_earned INTEGER DEFAULT 0,
        total_redeemed INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS reward_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        points INTEGER NOT NULL,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
        source VARCHAR(60),
        reference_id VARCHAR(120),
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_history_order_earn
        ON reward_history(user_id, order_id, source)
        WHERE order_id IS NOT NULL AND transaction_type = 'earned' AND source = 'order_delivered'
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS membership_tiers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(40) NOT NULL UNIQUE,
        name VARCHAR(80) NOT NULL,
        min_lifetime_points INTEGER NOT NULL DEFAULT 0,
        benefits JSONB DEFAULT '{}'::jsonb,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS loyalty_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_key VARCHAR(60) NOT NULL UNIQUE,
        label VARCHAR(120) NOT NULL,
        points INTEGER NOT NULL DEFAULT 0,
        multiplier NUMERIC(5,2) DEFAULT 1,
        conditions JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS loyalty_ledger (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        delta INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        source VARCHAR(60) NOT NULL,
        reference_id VARCHAR(120),
        description TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_user ON loyalty_ledger(user_id, created_at DESC)
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS loyalty_redemptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        points_used INTEGER NOT NULL,
        discount_amount NUMERIC(10,2) NOT NULL,
        redemption_type VARCHAR(30) DEFAULT 'points',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`ALTER TABLE reward_history ADD COLUMN IF NOT EXISTS source VARCHAR(60)`);
    await q(`ALTER TABLE reward_history ADD COLUMN IF NOT EXISTS reference_id VARCHAR(120)`);
    await q(`ALTER TABLE reward_history ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE`);

    await q(`
      CREATE TABLE IF NOT EXISTS support_live_chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(30) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'closed')),
        subject VARCHAR(200),
        satisfaction_score INTEGER CHECK (satisfaction_score IS NULL OR (satisfaction_score >= 1 AND satisfaction_score <= 5)),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS support_live_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID NOT NULL REFERENCES support_live_chats(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        sender_role VARCHAR(20) NOT NULL DEFAULT 'customer',
        message TEXT NOT NULL,
        attachment_url TEXT,
        attachment_type VARCHAR(40),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE INDEX IF NOT EXISTS idx_support_live_messages_chat
        ON support_live_messages(chat_id, created_at ASC)
    `);

    await q(`
      ALTER TABLE support_tickets
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
        ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER,
        ADD COLUMN IF NOT EXISTS ai_session_id UUID,
        ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20),
        ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE
    `);

    await q(`CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START 1000`);

    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_support_tickets_number
        ON support_tickets(ticket_number) WHERE ticket_number IS NOT NULL
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS support_ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        sender_role VARCHAR(30) NOT NULL,
        message TEXT NOT NULL,
        attachment_urls JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket
        ON support_ticket_messages(ticket_id, created_at ASC)
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS support_auto_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trigger_pattern VARCHAR(200) NOT NULL UNIQUE,
        response TEXT NOT NULL,
        category VARCHAR(60) DEFAULT 'general',
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      INSERT INTO support_auto_responses (trigger_pattern, response, category, sort_order) VALUES
        ('where is my order|track order|order status', 'You can track your order in real time from My Orders → select your active order. I can also look up your latest order if you are signed in.', 'order', 1),
        ('how do i cancel|cancel order', 'Cancel from My Orders while status is Pending or within 60 seconds of placing. If the restaurant has started preparing, a small fee may apply.', 'order', 2),
        ('refund|get refund|money back', 'Refunds are initiated automatically for cancelled orders. UPI/wallets: 2–4 hours. Cards: 5–7 business days.', 'refund', 3),
        ('coupon|promo code|discount code', 'Apply coupons at checkout under Apply Coupon, or visit /rewards for membership offers. Enter the code and tap Apply.', 'coupon', 4),
        ('membership|loyalty|reward points|silver|gold|platinum', 'Foodiq Rewards offers Silver, Gold, and Platinum tiers. Earn points on orders, referrals, and reviews. Visit /rewards for your wallet and benefits.', 'membership', 5),
        ('payment|upi|card|razorpay', 'We accept UPI, credit/debit cards, net banking, wallets, and COD where enabled. Payment issues? Share your order ID and we will investigate.', 'payment', 6),
        ('delivery|late|driver|rider', 'For delivery delays, check live tracking on your order. If the order is significantly late, submit a Delivery Complaint ticket and we will assist.', 'delivery', 7)
      ON CONFLICT DO NOTHING
    `);

    await q(`
      INSERT INTO membership_tiers (slug, name, min_lifetime_points, benefits, sort_order) VALUES
        ('silver', 'Foodiq Silver', 0, '{"free_delivery": false, "extra_discount_percent": 0, "priority_support": false, "exclusive_coupons": false, "birthday_reward_points": 50}'::jsonb, 1),
        ('gold', 'Foodiq Gold', 1000, '{"free_delivery": true, "extra_discount_percent": 5, "priority_support": true, "exclusive_coupons": true, "birthday_reward_points": 150}'::jsonb, 2),
        ('platinum', 'Foodiq Platinum', 5000, '{"free_delivery": true, "extra_discount_percent": 10, "priority_support": true, "exclusive_coupons": true, "birthday_reward_points": 300}'::jsonb, 3)
      ON CONFLICT (slug) DO NOTHING
    `);

    await q(`
      INSERT INTO loyalty_rules (rule_key, label, points, multiplier, conditions) VALUES
        ('order_delivered', 'Every Order', 0, 1, '{"rate_per_100": 1}'::jsonb),
        ('referral', 'Referral Bonus', 100, 1, '{}'::jsonb),
        ('referral_welcome', 'Referral Welcome', 50, 1, '{}'::jsonb),
        ('first_order', 'First Order Bonus', 200, 1, '{}'::jsonb),
        ('campaign', 'Festival Campaign', 0, 1.5, '{}'::jsonb),
        ('birthday', 'Birthday Order', 250, 1, '{}'::jsonb),
        ('review', 'Product Review', 50, 1, '{}'::jsonb),
        ('daily_login', 'Daily Login', 10, 1, '{}'::jsonb),
        ('signup', 'Welcome Bonus', 50, 1, '{}'::jsonb)
      ON CONFLICT (rule_key) DO NOTHING
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS inventory_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(restaurant_id, name)
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS inventory_suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(160) NOT NULL,
        contact_person VARCHAR(120),
        phone VARCHAR(30),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS restaurant_inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
        name VARCHAR(160) NOT NULL,
        quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
        unit VARCHAR(40) NOT NULL DEFAULT 'pieces',
        purchase_price NUMERIC(12,2) DEFAULT 0,
        supplier_id UUID REFERENCES inventory_suppliers(id) ON DELETE SET NULL,
        expiry_date DATE,
        reorder_level NUMERIC(12,3) DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        inventory_item_id UUID NOT NULL REFERENCES restaurant_inventory_items(id) ON DELETE CASCADE,
        quantity_required NUMERIC(12,3) NOT NULL DEFAULT 1,
        unit VARCHAR(40),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(menu_item_id, inventory_item_id)
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS inventory_purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        supplier_id UUID REFERENCES inventory_suppliers(id) ON DELETE SET NULL,
        status VARCHAR(40) DEFAULT 'draft',
        total_amount NUMERIC(12,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        received_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS inventory_purchase_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_order_id UUID NOT NULL REFERENCES inventory_purchase_orders(id) ON DELETE CASCADE,
        inventory_item_id UUID REFERENCES restaurant_inventory_items(id) ON DELETE SET NULL,
        item_name VARCHAR(160),
        quantity NUMERIC(12,3) NOT NULL,
        unit VARCHAR(40) DEFAULT 'pieces',
        unit_price NUMERIC(12,2) DEFAULT 0
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        inventory_item_id UUID NOT NULL REFERENCES restaurant_inventory_items(id) ON DELETE CASCADE,
        transaction_type VARCHAR(40) NOT NULL,
        quantity NUMERIC(12,3) NOT NULL,
        reference_id UUID,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS kitchen_order_timers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        started_at TIMESTAMP WITH TIME ZONE,
        ready_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        prep_minutes INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(order_id)
      )
    `);

    await q(`
      CREATE INDEX IF NOT EXISTS idx_restaurant_inventory_restaurant
        ON restaurant_inventory_items(restaurant_id, name)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item
        ON inventory_transactions(inventory_item_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_menu
        ON recipe_ingredients(menu_item_id)
    `);

    await q(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS admin_reply TEXT`);
    await q(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);

    await q(`
      ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS type VARCHAR(60) DEFAULT 'alert',
        ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT 'Orders',
        ADD COLUMN IF NOT EXISTS role VARCHAR(40),
        ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS dedupe_key VARCHAR(180)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created
        ON notifications(user_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
        ON notifications(user_id) WHERE is_read = FALSE
    `);
    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_device_tokens_user
        ON device_tokens(user_id) WHERE is_active = TRUE
    `);
    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
        ON notification_queue(status, next_attempt_at)
    `);

    // Email / SMS preference columns + logging / OTP
    await q(`
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

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_email_logs_user_created
        ON email_logs(user_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_email_logs_status
        ON email_logs(status, created_at DESC)
    `);

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_sms_logs_user_created
        ON sms_logs(user_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_sms_logs_status
        ON sms_logs(status, created_at DESC)
    `);

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_otp_destination_purpose
        ON otp_codes(destination, purpose, created_at DESC)
    `);

    // Cloud media library + delivery document URLs
    await q(`
      ALTER TABLE users
        ALTER COLUMN profile_image_url TYPE TEXT
    `);

    await q(`
      ALTER TABLE delivery_partners
        ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS license_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS vehicle_rc_url TEXT,
        ADD COLUMN IF NOT EXISTS insurance_doc_url TEXT
    `);

    // ── Delivery Partner KYC & Vehicle Verification ───────────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_partner_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        document_type VARCHAR(30) NOT NULL
          CHECK (document_type IN ('aadhaar', 'pan', 'driving_license', 'rc', 'insurance', 'profile_photo')),
        document_number VARCHAR(100),
        file_url TEXT NOT NULL,
        verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (verification_status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        expiry_date DATE,
        verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
        verified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      DROP TRIGGER IF EXISTS update_delivery_partner_documents_modtime ON delivery_partner_documents
    `);
    await q(`
      CREATE TRIGGER update_delivery_partner_documents_modtime
        BEFORE UPDATE ON delivery_partner_documents
        FOR EACH ROW EXECUTE PROCEDURE update_modified_column()
    `);
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_partner_documents_partner_type
        ON delivery_partner_documents(partner_id, document_type)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_partner_documents_partner
        ON delivery_partner_documents(partner_id)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_partner_documents_status
        ON delivery_partner_documents(verification_status)
    `);

    // ── Delivery Partner Bank Account & Payout Management ─────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_partner_bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        account_holder_name VARCHAR(150) NOT NULL,
        account_number_encrypted TEXT NOT NULL,
        account_number_last4 VARCHAR(4) NOT NULL,
        bank_name VARCHAR(150) NOT NULL,
        ifsc_code VARCHAR(20) NOT NULL,
        account_type VARCHAR(30) NOT NULL DEFAULT 'savings'
          CHECK (account_type IN ('savings', 'current')),
        upi_id TEXT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT TRUE,
        verification_status VARCHAR(30) NOT NULL DEFAULT 'pending'
          CHECK (verification_status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
        verified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      DROP TRIGGER IF EXISTS update_delivery_partner_bank_accounts_modtime ON delivery_partner_bank_accounts
    `);
    await q(`
      CREATE TRIGGER update_delivery_partner_bank_accounts_modtime
        BEFORE UPDATE ON delivery_partner_bank_accounts
        FOR EACH ROW EXECUTE PROCEDURE update_modified_column()
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_partner_bank_accounts_partner
        ON delivery_partner_bank_accounts(partner_id)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_partner_bank_accounts_partner_primary
        ON delivery_partner_bank_accounts(partner_id, is_primary)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_partner_bank_accounts_status
        ON delivery_partner_bank_accounts(verification_status)
    `);
    // Only one primary bank account per partner.
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_partner_bank_accounts_primary
        ON delivery_partner_bank_accounts(partner_id) WHERE is_primary = TRUE
    `);
    await q(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_withdrawal_requests_bank_account'
        ) THEN
          ALTER TABLE withdrawal_requests
            ADD CONSTRAINT fk_withdrawal_requests_bank_account
            FOREIGN KEY (bank_account_id) REFERENCES delivery_partner_bank_accounts(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_media_user_created
        ON media_assets(user_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_media_purpose_status
        ON media_assets(purpose, status)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_media_public_id
        ON media_assets(public_id)
    `);

    // Performance indexes (catalog / search / orders)
    await q(`
      CREATE INDEX IF NOT EXISTS idx_restaurants_active_rating
        ON restaurants(is_active, rating DESC NULLS LAST)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_restaurants_category_active
        ON restaurants(category_id, is_active)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_available
        ON menu_items(restaurant_id, is_available)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_menu_items_trending
        ON menu_items(is_trending, trending_score DESC NULLS LAST)
      WHERE is_trending = TRUE
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_reviews_restaurant
        ON reviews(restaurant_id)
    `);

    // Maintenance phase: reviews moderation + feedback / bugs
    await q(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'visible',
        admin_reply TEXT,
        replied_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      ALTER TABLE reviews
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'visible',
        ADD COLUMN IF NOT EXISTS admin_reply TEXT,
        ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(40),
        reason VARCHAR(80),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Open',
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS email_support (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ticket_number VARCHAR(20),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        attachment_url TEXT,
        status VARCHAR(40) NOT NULL DEFAULT 'Open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      ALTER TABLE support_tickets
        ADD COLUMN IF NOT EXISTS problem_type VARCHAR(80),
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS expected_resolution_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS attachment_urls JSONB DEFAULT '[]'::jsonb
    `);
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_order
        ON reviews(user_id, order_id) WHERE order_id IS NOT NULL
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id)
    `);

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_reviews_partner
        ON delivery_reviews(delivery_partner_id, created_at DESC)
    `);

    // ── Delivery Partner Ratings & Reviews (dedicated feature) ───────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_partner_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_partner_reviews_order
        ON delivery_partner_reviews(order_id)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_partner_reviews_partner
        ON delivery_partner_reviews(partner_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_partner_reviews_customer
        ON delivery_partner_reviews(customer_id)
    `);
    await q(`
      DROP TRIGGER IF EXISTS update_delivery_partner_reviews_modtime ON delivery_partner_reviews
    `);
    await q(`
      CREATE TRIGGER update_delivery_partner_reviews_modtime
        BEFORE UPDATE ON delivery_partner_reviews
        FOR EACH ROW EXECUTE PROCEDURE update_modified_column()
    `);
    await q(`
      ALTER TABLE delivery_partners
        ADD COLUMN IF NOT EXISTS review_average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_total_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_5_star_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_4_star_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_3_star_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_2_star_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_1_star_count INTEGER NOT NULL DEFAULT 0
    `);

    await q(`
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

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_status
        ON user_feedback(status, created_at DESC)
    `);

    await q(`
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
        stack_trace TEXT,
        api_endpoint TEXT,
        browser VARCHAR(120),
        device VARCHAR(120),
        fingerprint VARCHAR(64),
        occurrence_count INTEGER NOT NULL DEFAULT 1,
        duplicate_of_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      ALTER TABLE bug_reports
        ADD COLUMN IF NOT EXISTS stack_trace TEXT,
        ADD COLUMN IF NOT EXISTS api_endpoint TEXT,
        ADD COLUMN IF NOT EXISTS browser VARCHAR(120),
        ADD COLUMN IF NOT EXISTS device VARCHAR(120),
        ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(64),
        ADD COLUMN IF NOT EXISTS occurrence_count INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS duplicate_of_id UUID
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_bug_reports_status_created
        ON bug_reports(status, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_bug_reports_severity_status
        ON bug_reports(severity, status, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_bug_reports_fingerprint
        ON bug_reports(fingerprint)
        WHERE fingerprint IS NOT NULL AND duplicate_of_id IS NULL
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_bug_reports_error_event
        ON bug_reports(error_event_id)
        WHERE error_event_id IS NOT NULL
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_bug_reports_created
        ON bug_reports(created_at DESC)
    `);

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_maintenance_reports_period
        ON maintenance_reports(period, created_at DESC)
    `);

    await q(`
      ALTER TABLE contact_messages
        ADD COLUMN IF NOT EXISTS phone VARCHAR(40),
        ADD COLUMN IF NOT EXISTS reason VARCHAR(80),
        ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'open'
    `);
    await q(`
      ALTER TABLE support_tickets
        ADD COLUMN IF NOT EXISTS admin_notes TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_created
        ON orders(user_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status
        ON orders(restaurant_id, status)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_offers_active_valid
        ON offers(is_active, valid_until)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order
        ON order_items(order_id)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_order_items_menu
        ON order_items(menu_item_id)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_offers_slug
        ON offers(slug)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_offer_items_offer
        ON offer_items(offer_id)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_offer_restaurants_offer
        ON offer_restaurants(offer_id)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_addresses_user
        ON addresses(user_id)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_coupons_code
        ON coupons(code)
    `);
    await q(`
      ALTER TABLE coupons
        ADD COLUMN IF NOT EXISTS coupon_type VARCHAR(30) DEFAULT 'percentage',
        ADD COLUMN IF NOT EXISTS one_time_per_user BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS title VARCHAR(120),
        ADD COLUMN IF NOT EXISTS description TEXT
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS user_coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        status VARCHAR(30) DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'used', 'expired')),
        applied_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, coupon_id)
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS coupon_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
        offer_id UUID,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        coupon_code VARCHAR(50),
        discount_amount DECIMAL(10,2) DEFAULT 0,
        final_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_coupon_history_user
        ON coupon_history(user_id, created_at DESC)
    `);
    await q(`
      INSERT INTO coupons (code, discount_amount, discount_type, coupon_type, min_order_amount, title, description, one_time_per_user, valid_until, is_active)
      SELECT 'WELCOME50', 50, 'fixed', 'first_order', 199, 'First Order Offer', 'Flat ₹50 off on your first order', TRUE, CURRENT_TIMESTAMP + INTERVAL '1 year', TRUE
      WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'WELCOME50')
    `);
    await q(`
      INSERT INTO coupons (code, discount_amount, discount_type, coupon_type, min_order_amount, title, description, valid_until, is_active)
      SELECT 'FREEDEL', 0, 'fixed', 'free_delivery', 299, 'Free Delivery', 'Zero delivery fee on orders above ₹299', CURRENT_TIMESTAMP + INTERVAL '6 months', TRUE
      WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'FREEDEL')
    `);
    await q(`
      INSERT INTO coupons (code, discount_amount, discount_type, coupon_type, min_order_amount, max_discount_amount, title, description, valid_until, is_active)
      SELECT 'DIWALI25', 25, 'percentage', 'festival', 499, 150, 'Diwali Festival Offer', '25% off during festival — max ₹150', CURRENT_TIMESTAMP + INTERVAL '3 months', TRUE
      WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'DIWALI25')
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_delivery_partners_user
        ON delivery_partners(user_id)
    `);
    try {
      await q(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      await q(`
        CREATE INDEX IF NOT EXISTS idx_restaurants_name_trgm
          ON restaurants USING gin (name gin_trgm_ops)
      `);
      await q(`
        CREATE INDEX IF NOT EXISTS idx_menu_items_name_trgm
          ON menu_items USING gin (name gin_trgm_ops)
      `);
    } catch {
      /* extension may be restricted on some hosts */
    }
    await q(`
      CREATE INDEX IF NOT EXISTS idx_payments_user_created
        ON payments(user_id, created_at DESC)
    `);

    // Monitoring / security tables
    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, created_at DESC)
    `);

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_error_events_created ON error_events(created_at DESC)
    `);

    await q(`
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

    await q(`
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

    await q(`
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
    await q(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
        ON refresh_tokens(user_id) WHERE revoked_at IS NULL
    `);

    await q(`
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

    await q(`
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
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS login_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_name VARCHAR(255),
        ip_address VARCHAR(100),
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ========== Foodiq 3.0 — Business Scaling foundation ==========
    await q(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(120) UNIQUE,
        status VARCHAR(40) NOT NULL DEFAULT 'active',
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS currencies (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(80) NOT NULL,
        symbol VARCHAR(8) DEFAULT '',
        decimal_places INTEGER DEFAULT 2
      )
    `);
    await q(`
      INSERT INTO currencies (code, name, symbol) VALUES
        ('INR', 'Indian Rupee', '₹'),
        ('USD', 'US Dollar', '$'),
        ('AED', 'UAE Dirham', 'د.إ'),
        ('EUR', 'Euro', '€'),
        ('GBP', 'British Pound', '£')
      ON CONFLICT (code) DO NOTHING
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS markets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(40) NOT NULL UNIQUE,
        name VARCHAR(160) NOT NULL,
        country_code VARCHAR(8) NOT NULL DEFAULT 'IN',
        state_code VARCHAR(40),
        city VARCHAR(120),
        currency_code VARCHAR(10) NOT NULL DEFAULT 'INR' REFERENCES currencies(code),
        timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS organization_markets (
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
        PRIMARY KEY (organization_id, market_id)
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS franchises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(80),
        status VARCHAR(40) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS restaurant_chains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(160),
        logo_url TEXT,
        status VARCHAR(40) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS white_label_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        host VARCHAR(255) NOT NULL,
        brand_name VARCHAR(160),
        logo_url TEXT,
        primary_color VARCHAR(32) DEFAULT '#FC8019',
        feature_flags JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(host)
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS fx_rates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        base_currency VARCHAR(10) NOT NULL REFERENCES currencies(code),
        quote_currency VARCHAR(10) NOT NULL REFERENCES currencies(code),
        rate NUMERIC(18,8) NOT NULL,
        effective_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(base_currency, quote_currency, effective_at)
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        key_prefix VARCHAR(16) NOT NULL,
        key_hash VARCHAR(128) NOT NULL UNIQUE,
        scopes TEXT[] DEFAULT ARRAY['public'],
        is_active BOOLEAN DEFAULT TRUE,
        last_used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
        name VARCHAR(160) NOT NULL,
        code VARCHAR(80),
        address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
        warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
        reorder_level NUMERIC(12,2) DEFAULT 0,
        unit VARCHAR(40) DEFAULT 'unit',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS integration_connectors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        type VARCHAR(40) NOT NULL,
        name VARCHAR(160) NOT NULL,
        webhook_url TEXT,
        status VARCHAR(40) DEFAULT 'inactive',
        config JSONB DEFAULT '{}'::jsonb,
        last_sync_at TIMESTAMP WITH TIME ZONE,
        last_error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS pricing_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
        name VARCHAR(160) NOT NULL,
        rule_type VARCHAR(40) DEFAULT 'multiplier',
        multiplier NUMERIC(8,4) DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS surge_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
        multiplier NUMERIC(8,4) NOT NULL DEFAULT 1.2,
        reason VARCHAR(255),
        starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS ai_forecast_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
        forecast_type VARCHAR(40) NOT NULL DEFAULT 'sales',
        horizon_days INTEGER DEFAULT 7,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await q(`
      ALTER TABLE restaurants
        ADD COLUMN IF NOT EXISTS organization_id UUID,
        ADD COLUMN IF NOT EXISTS chain_id UUID,
        ADD COLUMN IF NOT EXISTS franchise_id UUID,
        ADD COLUMN IF NOT EXISTS market_id UUID
    `);
    await q(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS market_id UUID,
        ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR'
    `);
    await q(`
      ALTER TABLE payments
        ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR'
    `);

    // Seed default org + Bengaluru market (backward compatible)
    const orgIns = await q(
      `INSERT INTO organizations (name, slug, status)
       VALUES ('Foodiq Default', 'foodiq-default', 'active')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    let defaultOrgId = orgIns.rows[0]?.id;
    if (!defaultOrgId) {
      const o = await q(
        `SELECT id FROM organizations WHERE slug = 'foodiq-default' LIMIT 1`
      );
      defaultOrgId = o.rows[0]?.id;
    }
    const mktIns = await q(
      `INSERT INTO markets (code, name, country_code, state_code, city, currency_code, timezone)
       VALUES ('IN-KA-BLR', 'Bengaluru', 'IN', 'KA', 'Bengaluru', 'INR', 'Asia/Kolkata')
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    let defaultMarketId = mktIns.rows[0]?.id;
    if (!defaultMarketId) {
      const m = await q(
        `SELECT id FROM markets WHERE code = 'IN-KA-BLR' LIMIT 1`
      );
      defaultMarketId = m.rows[0]?.id;
    }
    if (defaultOrgId && defaultMarketId) {
      await q(
        `INSERT INTO organization_markets (organization_id, market_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [defaultOrgId, defaultMarketId]
      );
      await q(
        `INSERT INTO white_label_configs (organization_id, host, brand_name, primary_color)
         VALUES ($1, 'localhost', 'Foodiq', '#FC8019')
         ON CONFLICT (host) DO NOTHING`,
        [defaultOrgId]
      );
      await q(
        `UPDATE restaurants SET organization_id = $1
         WHERE organization_id IS NULL`,
        [defaultOrgId]
      );
      await q(
        `UPDATE restaurants SET market_id = $1
         WHERE market_id IS NULL`,
        [defaultMarketId]
      );
    }
    console.log('[SCHEMA] V3.0 tenancy foundation ensured');

    // ========== Foodiq 4.0 — Enterprise & Global Expansion foundation ==========
    await q(`
      CREATE TABLE IF NOT EXISTS locales (
        code VARCHAR(16) PRIMARY KEY,
        name VARCHAR(80) NOT NULL,
        direction VARCHAR(8) DEFAULT 'ltr',
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    await q(`
      INSERT INTO locales (code, name, direction) VALUES
        ('en', 'English', 'ltr'),
        ('hi', 'Hindi', 'ltr'),
        ('ar', 'Arabic', 'rtl')
      ON CONFLICT (code) DO NOTHING
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS tax_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        country_code VARCHAR(8) NOT NULL DEFAULT 'IN',
        state_code VARCHAR(40),
        tax_type VARCHAR(40) NOT NULL DEFAULT 'GST',
        rate NUMERIC(8,4) NOT NULL DEFAULT 0.05,
        name VARCHAR(120),
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      INSERT INTO tax_rules (country_code, state_code, tax_type, rate, name, is_active)
      SELECT 'IN', NULL, 'GST', 0.05, 'India GST 5%', FALSE
      WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE country_code = 'IN' AND tax_type = 'GST' AND name = 'India GST 5%')
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS sso_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider VARCHAR(40) NOT NULL UNIQUE,
        client_id VARCHAR(255),
        is_enabled BOOLEAN DEFAULT FALSE,
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      INSERT INTO sso_providers (provider, is_enabled) VALUES
        ('google', FALSE), ('microsoft', FALSE), ('apple', FALSE)
      ON CONFLICT (provider) DO NOTHING
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS sso_identities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(40) NOT NULL,
        provider_subject VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider, provider_subject)
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS enterprise_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(40) NOT NULL UNIQUE,
        name VARCHAR(80) NOT NULL,
        permissions JSONB DEFAULT '[]'::jsonb
      )
    `);
    await q(`
      INSERT INTO enterprise_roles (code, name, permissions) VALUES
        ('org_admin', 'Organization Admin', '["*"]'::jsonb),
        ('buyer', 'Corporate Buyer', '["order.create","order.read"]'::jsonb),
        ('approver', 'Approver', '["order.approve","order.read"]'::jsonb),
        ('viewer', 'Viewer', '["order.read","report.read"]'::jsonb)
      ON CONFLICT (code) DO NOTHING
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS organization_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_code VARCHAR(40) NOT NULL DEFAULT 'viewer',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, user_id)
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS corporate_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(160) NOT NULL,
        billing_email VARCHAR(255),
        credit_limit NUMERIC(12,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS corporate_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
        organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        placed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'draft',
        total_amount NUMERIC(12,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'INR',
        payload JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS recurring_order_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
        organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        cron_expr VARCHAR(80) DEFAULT '0 10 * * 1-5',
        timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
        template JSONB NOT NULL DEFAULT '{}'::jsonb,
        next_run_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS ai_chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        channel VARCHAR(40) DEFAULT 'support',
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(40) DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS fleet_vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
        label VARCHAR(120) NOT NULL,
        vehicle_type VARCHAR(40) DEFAULT 'bike',
        capacity INTEGER DEFAULT 4,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS fleet_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
        delivery_partner_id UUID,
        order_id UUID,
        status VARCHAR(40) DEFAULT 'assigned',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS iot_devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
        organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        device_key VARCHAR(120) NOT NULL UNIQUE,
        name VARCHAR(160) NOT NULL,
        device_type VARCHAR(40) DEFAULT 'sensor',
        is_active BOOLEAN DEFAULT TRUE,
        last_seen_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS iot_telemetry (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
        metric VARCHAR(80) NOT NULL,
        value NUMERIC(18,6),
        payload JSONB DEFAULT '{}'::jsonb,
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS inventory_reorder_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
        suggested_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
        reason VARCHAR(255),
        status VARCHAR(40) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS api_marketplace_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(120) NOT NULL UNIQUE,
        name VARCHAR(160) NOT NULL,
        description TEXT,
        listing_type VARCHAR(40) NOT NULL DEFAULT 'webhook',
        is_published BOOLEAN DEFAULT TRUE,
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      INSERT INTO api_marketplace_listings (slug, name, description, listing_type)
      VALUES
        ('orders-webhook', 'Orders Webhook', 'Receive order lifecycle events', 'webhook'),
        ('oauth-partner-app', 'Partner OAuth App', 'OAuth-style partner integration', 'oauth_app')
      ON CONFLICT (slug) DO NOTHING
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS api_marketplace_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id UUID NOT NULL REFERENCES api_marketplace_listings(id) ON DELETE CASCADE,
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
        status VARCHAR(40) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS privacy_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_type VARCHAR(40) NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'queued',
        payload JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      )
    `);
    await q(`
      ALTER TABLE audit_logs
        ADD COLUMN IF NOT EXISTS organization_id UUID,
        ADD COLUMN IF NOT EXISTS actor_type VARCHAR(40) DEFAULT 'user'
    `);
    console.log('[SCHEMA] V4.0 enterprise foundation ensured');

    // ========== CPI Task 3 — New Features ==========
    await q(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, menu_item_id)
      )
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id, created_at DESC)
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS recently_viewed (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_key VARCHAR(80),
        item_type VARCHAR(40) NOT NULL,
        item_id UUID NOT NULL,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_recently_viewed_user
        ON recently_viewed(user_id, viewed_at DESC)
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS referral_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        code VARCHAR(40) NOT NULL UNIQUE,
        reward_points INTEGER NOT NULL DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS referral_redemptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
        referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        status VARCHAR(40) NOT NULL DEFAULT 'credited',
        points_awarded INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(40) NOT NULL UNIQUE,
        initial_balance NUMERIC(12,2) NOT NULL,
        balance NUMERIC(12,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        purchaser_id UUID REFERENCES users(id) ON DELETE SET NULL,
        recipient_email VARCHAR(255),
        status VARCHAR(40) NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS gift_card_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        order_id UUID,
        amount NUMERIC(12,2) NOT NULL,
        tx_type VARCHAR(40) NOT NULL DEFAULT 'redeem',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS restaurant_collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(120) NOT NULL UNIQUE,
        title VARCHAR(160) NOT NULL,
        description TEXT,
        image_url TEXT,
        filter_query JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS collection_restaurants (
        collection_id UUID NOT NULL REFERENCES restaurant_collections(id) ON DELETE CASCADE,
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        PRIMARY KEY (collection_id, restaurant_id)
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS seasonal_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(120) NOT NULL UNIQUE,
        title VARCHAR(160) NOT NULL,
        subtitle TEXT,
        banner_url TEXT,
        offer_code VARCHAR(60),
        starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS product_feature_flags (
        key VARCHAR(80) PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT FALSE,
        rollout_percent INTEGER NOT NULL DEFAULT 100,
        description TEXT,
        meta JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      ALTER TABLE addresses
        ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7),
        ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7)
    `);
    await q(`
      ALTER TABLE order_tracking
        ADD COLUMN IF NOT EXISTS eta_minutes INTEGER,
        ADD COLUMN IF NOT EXISTS eta_source VARCHAR(40) DEFAULT 'haversine'
    `);

    // Seed default CPI feature flags (idempotent)
    await q(`
      INSERT INTO product_feature_flags (key, enabled, rollout_percent, description) VALUES
        ('wishlist', TRUE, 100, 'Wishlist module'),
        ('scheduled_orders', TRUE, 100, 'Scheduled delivery at checkout'),
        ('smart_search', TRUE, 100, 'Search autosuggest'),
        ('personalized_home', TRUE, 100, 'Personalized home rails'),
        ('ai_recommendations', TRUE, 100, 'AI food recommendations'),
        ('coupon_recommendations', TRUE, 100, 'Coupon recommendation engine'),
        ('referrals', TRUE, 100, 'Referral & invite friends'),
        ('gift_cards', TRUE, 50, 'Gift cards purchase & redeem'),
        ('recently_viewed', TRUE, 100, 'Recently viewed items'),
        ('trending_near_you', TRUE, 100, 'Geo-aware trending'),
        ('collections', TRUE, 100, 'Restaurant collections'),
        ('seasonal_campaigns', TRUE, 100, 'Seasonal campaign banners'),
        ('advanced_filters', TRUE, 100, 'Advanced restaurant filters')
      ON CONFLICT (key) DO NOTHING
    `);

    // Seed sample collections if empty
    const colCount = await q(
      `SELECT COUNT(*)::int AS c FROM restaurant_collections`
    );
    if ((colCount.rows[0]?.c || 0) === 0) {
      await q(`
        INSERT INTO restaurant_collections (slug, title, description, image_url, filter_query, sort_order) VALUES
          ('best-biryani', 'Best Biryani Near You', 'Authentic, rich, and aromatic biryanis.',
           '/images/catalog/restaurants/biryani.webp', '{"cuisine":"biryani","sort":"rating"}'::jsonb, 1),
          ('top-rated', 'Top Rated Restaurants', 'The absolute best rated spots in the city.',
           '/images/catalog/restaurants/north-indian.webp', '{"rating":"4.5","sort":"rating"}'::jsonb, 2),
          ('newly-opened', 'Newly Opened', 'Explore the newest flavors in your area.',
           '/images/catalog/restaurants/italian.webp', '{"sort":"newest"}'::jsonb, 3),
          ('pure-veg', 'Pure Veg Delights', 'Wholesome vegetarian favourites.',
           '/images/catalog/restaurants/south-indian.webp', '{"is_veg":"true","sort":"rating"}'::jsonb, 4)
      `);
    }

    try {
      const { seedCollectionRestaurants } = require('./seedCollections');
      await seedCollectionRestaurants(pool);
    } catch (seedErr) {
      console.warn('[COLLECTIONS] Seed skipped:', seedErr.message);
    }

    console.log('[SCHEMA] CPI Task 3 new features foundation ensured');

    // ========== CPI Task 4 — Analytics query indexes ==========
    await q(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'paid'
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_orders_status_created
        ON orders(status, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created
        ON orders(restaurant_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_created
        ON orders(user_id, created_at DESC)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_orders_partner_created
        ON orders(delivery_partner_id, created_at DESC)
        WHERE delivery_partner_id IS NOT NULL
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_order_items_menu ON order_items(menu_item_id)
    `);
    await q(`
      CREATE INDEX IF NOT EXISTS idx_users_role_created
        ON users(role, created_at DESC)
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS analytics_report_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_type VARCHAR(60) NOT NULL DEFAULT 'bi_daily',
        format VARCHAR(20) DEFAULT 'email',
        payload JSONB DEFAULT '{}'::jsonb,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[SCHEMA] CPI Task 4 analytics indexes ensured');
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        shift_name VARCHAR(100) NOT NULL DEFAULT 'Standard Shift',
        start_time VARCHAR(10) NOT NULL DEFAULT '09:00',
        end_time VARCHAR(10) NOT NULL DEFAULT '17:00',
        working_days JSONB DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]'::jsonb,
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        is_recurring BOOLEAN DEFAULT TRUE,
        timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_shift_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shift_id UUID REFERENCES delivery_shifts(id) ON DELETE SET NULL,
        partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
        check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        check_out TIMESTAMP WITH TIME ZONE,
        total_hours NUMERIC(6,2) DEFAULT 0.0,
        late_minutes INTEGER DEFAULT 0,
        early_checkout BOOLEAN DEFAULT FALSE,
        gps_latitude NUMERIC(10,7),
        gps_longitude NUMERIC(10,7),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_shifts_partner ON delivery_shifts(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_shifts_status ON delivery_shifts(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_shift_logs_shift ON delivery_shift_logs(shift_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_shift_logs_partner ON delivery_shift_logs(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_shift_logs_created ON delivery_shift_logs(created_at DESC)`);
    console.log('[SCHEMA] Shift Scheduling Module schema ensured');

    // ── Delivery Emergencies (SOS Module) ──────────────────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_emergencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL,
        order_id UUID,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        accuracy DOUBLE PRECISION,
        battery_level INTEGER,
        network_type VARCHAR(50),
        device_info JSONB DEFAULT '{}'::jsonb,
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by UUID
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_emergencies_partner ON delivery_emergencies(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_emergencies_order ON delivery_emergencies(order_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_emergencies_status ON delivery_emergencies(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_emergencies_created ON delivery_emergencies(created_at DESC)`);
    console.log('[SCHEMA] Delivery Emergencies (SOS) schema ensured');

    // Bootstrap demo users ONLY when explicitly allowed (never default in production).
    const allowBootstrap =
      String(process.env.ALLOW_BOOTSTRAP_USERS || '').toLowerCase() === 'true' ||
      (process.env.NODE_ENV !== 'production' &&
        String(process.env.ALLOW_BOOTSTRAP_USERS || 'true').toLowerCase() !== 'false');

    if (allowBootstrap) {
    // Ensure a default admin account exists for local/prod bootstrap.
    const bcrypt = require('bcrypt');
    const adminEmail = 'admin@foodiq.com';
    const existing = await q(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [adminEmail]
    );
    if (!existing?.rows?.[0]) {
      const hash = await bcrypt.hash('Password123', 12);
      const inserted = await q(
        `INSERT INTO users (email, password_hash, full_name, phone_number, role, admin_role)
         VALUES ($1, $2, $3, $4, 'admin', 'super_admin') RETURNING id`,
        [adminEmail, hash, 'Foodiq Admin', '9999999999']
      );
      if (inserted?.rows?.[0]) {
        await q(
          `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [inserted.rows[0].id]
        );
        console.log('[SCHEMA] Seeded admin@foodiq.com (dev bootstrap)');
      }
    } else {
      await q(
        `UPDATE users SET admin_role = COALESCE(admin_role, 'super_admin')
         WHERE email = $1 AND role = 'admin'`,
        [adminEmail]
      );
    }

    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE`);

    const riderEmail = 'rider@foodiq.com';
    const riderExisting = await q(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [riderEmail]
    );
    let riderUserId;
    if (!riderExisting?.rows?.[0]) {
      const hash = await bcrypt.hash('Password123', 12);
      const inserted = await q(
        `INSERT INTO users (email, password_hash, full_name, phone_number, role)
         VALUES ($1, $2, $3, $4, 'delivery_partner') RETURNING id`,
        [riderEmail, hash, 'Ravi Rider', '9888888888']
      );
      if (inserted?.rows?.[0]) {
        riderUserId = inserted.rows[0].id;
        await q(
          `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [riderUserId]
        );
        await q(
          `INSERT INTO delivery_partners (user_id, full_name, email, phone_number, password_hash, vehicle_details, vehicle_type, driving_license_number, license_number, is_verified, is_online, is_available, status, approval_status, current_lat, current_lng, rating)
           VALUES ($1, 'Ravi Rider', $2, '9888888888', $3, 'KA-01-AB-1234', 'Bike', 'DL-FOODIQ-001', 'DL-FOODIQ-001', TRUE, TRUE, TRUE, 'approved', 'approved', 12.9716, 77.5946, 4.8)
           ON CONFLICT (user_id) DO NOTHING`,
          [riderUserId, riderEmail, hash]
        );
        console.log('[SCHEMA] Seeded rider@foodiq.com (dev bootstrap)');
      }
    } else {
      riderUserId = riderExisting.rows[0].id;
      const hash = await bcrypt.hash('Password123', 12);
      await q(
        `UPDATE users SET role = 'delivery_partner', password_hash = $1 WHERE id = $2`,
        [hash, riderUserId]
      );
      await q(
        `INSERT INTO delivery_partners (user_id, full_name, email, phone_number, password_hash, vehicle_details, vehicle_type, driving_license_number, license_number, is_verified, is_online, is_available, status, approval_status, current_lat, current_lng, rating)
         VALUES ($1, 'Ravi Rider', $2, '9888888888', $3, 'KA-01-AB-1234', 'Bike', 'DL-FOODIQ-001', 'DL-FOODIQ-001', TRUE, TRUE, TRUE, 'approved', 'approved', 12.9716, 77.5946, 4.8)
         ON CONFLICT (user_id) DO UPDATE SET is_verified = TRUE, status = 'approved', approval_status = 'approved', email = EXCLUDED.email, password_hash = EXCLUDED.password_hash`,
        [riderUserId, riderEmail, hash]
      );
    }

    // Ensure all delivery partners are approved & verified for production rider portal access
    await q(`
      UPDATE delivery_partners
      SET is_verified = TRUE, status = 'approved', approval_status = 'approved'
      WHERE status = 'pending' OR is_verified IS FALSE OR is_verified IS NULL
    `);
    } else {
      console.log('[SCHEMA] Bootstrap users skipped (production hardening)');
    }

    // ── Delivery Zones System ──────────────────────────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_zones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        polygon JSONB,
        center_latitude DECIMAL(10,8),
        center_longitude DECIMAL(11,8),
        radius_km DECIMAL(6,2),
        zone_type VARCHAR(20) DEFAULT 'polygon' CHECK (zone_type IN ('polygon', 'circle')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(is_active)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_zones_city ON delivery_zones(city)`);

    await q(`
      CREATE TABLE IF NOT EXISTS delivery_partner_zones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL,
        zone_id UUID NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT uq_partner_zone UNIQUE (partner_id, zone_id)
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_dpz_partner_id ON delivery_partner_zones(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_dpz_zone_id ON delivery_partner_zones(zone_id)`);

    // ── Fraud Detection & Risk Monitoring System ──────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS fraud_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        fraud_type VARCHAR(100) NOT NULL,
        risk_score INTEGER NOT NULL DEFAULT 0,
        severity VARCHAR(30) NOT NULL DEFAULT 'Low' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
        reason TEXT NOT NULL,
        gps_data JSONB DEFAULT '{}'::jsonb,
        device_data JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed', 'blocked', 'suspended')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await q(`ALTER TABLE fraud_cases ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id) ON DELETE CASCADE`);
    await q(`CREATE INDEX IF NOT EXISTS idx_fraud_cases_partner ON fraud_cases(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_fraud_cases_order ON fraud_cases(order_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_fraud_cases_status ON fraud_cases(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_fraud_cases_severity ON fraud_cases(severity)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_fraud_cases_created ON fraud_cases(created_at)`);

    await q(`
      CREATE TABLE IF NOT EXISTS fraud_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_name VARCHAR(255) NOT NULL UNIQUE,
        rule_type VARCHAR(100) NOT NULL,
        threshold INTEGER NOT NULL DEFAULT 50,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_fraud_rules_enabled ON fraud_rules(enabled)`);

    await q(`
      CREATE TABLE IF NOT EXISTS fraud_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id UUID REFERENCES fraud_cases(id) ON DELETE CASCADE,
        event VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_fraud_logs_case ON fraud_logs(case_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_fraud_logs_event ON fraud_logs(event)`);

    // Seed default fraud rules if empty
    const rulesCheck = await q(`SELECT COUNT(*) as count FROM fraud_rules`);
    if (parseInt(rulesCheck?.rows?.[0]?.count || '0', 10) === 0) {
      const defaultRules = [
        ['GPS Spoofing Check', 'GPS_SPOOFING', 35, true],
        ['Impossible Speed Velocity Check', 'IMPOSSIBLE_SPEED', 40, true],
        ['Fake Delivery Distance Check', 'FAKE_DELIVERY', 50, true],
        ['OTP Abuse Multi-Attempts', 'OTP_ABUSE', 25, true],
        ['Multiple Failed OTP Attempts', 'FAILED_OTP', 20, true],
        ['Location Jump Anomaly', 'LOCATION_JUMP', 30, true],
        ['Outside Delivery Zone', 'OUTSIDE_ZONE', 25, true],
        ['Multiple Device Login Check', 'MULTIPLE_DEVICE_LOGIN', 30, true],
        ['VPN / Proxy Detection', 'VPN_DETECTION', 20, true],
        ['Rapid Account Switching', 'RAPID_ACCOUNT_SWITCH', 35, true],
        ['Fake Online Status Check', 'FAKE_ONLINE_STATUS', 30, true],
        ['Abnormal Order Completion Time', 'ABNORMAL_COMPLETION_TIME', 25, true],
        ['Repeated Order Cancellation', 'REPEATED_CANCELLATION', 30, true],
        ['Suspicious Wallet Withdrawals', 'SUSPICIOUS_WITHDRAWAL', 40, true],
      ];
      for (const r of defaultRules) {
        await q(
          `INSERT INTO fraud_rules (rule_name, rule_type, threshold, enabled) VALUES ($1, $2, $3, $4) ON CONFLICT (rule_name) DO NOTHING`,
          r
        );
      }
      console.log('[SCHEMA] Seeded default fraud detection rules');
    }

    // ── Delivery Analytics & Performance History tables ───────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_daily_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        orders_completed INTEGER DEFAULT 0,
        orders_cancelled INTEGER DEFAULT 0,
        total_distance_km DECIMAL(10,2) DEFAULT 0,
        online_hours DECIMAL(5,2) DEFAULT 0,
        active_hours DECIMAL(5,2) DEFAULT 0,
        idle_hours DECIMAL(5,2) DEFAULT 0,
        earnings DECIMAL(10,2) DEFAULT 0,
        tips DECIMAL(10,2) DEFAULT 0,
        bonuses DECIMAL(10,2) DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 5.0,
        acceptance_rate DECIMAL(5,2) DEFAULT 100.0,
        completion_rate DECIMAL(5,2) DEFAULT 100.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (partner_id, date)
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_daily_analytics_partner_date ON delivery_daily_analytics(partner_id, date)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_daily_analytics_date ON delivery_daily_analytics(date)`);

    await q(`
      CREATE TABLE IF NOT EXISTS delivery_performance_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
        metric VARCHAR(100) NOT NULL,
        old_value DECIMAL(10,2),
        new_value DECIMAL(10,2),
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_performance_history_partner ON delivery_performance_history(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_performance_history_metric ON delivery_performance_history(metric)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_performance_history_created ON delivery_performance_history(created_at)`);

    // ── Referral Program Module tables ──────────────────────────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
        referred_partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
        referral_code VARCHAR(30) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'kyc_completed', 'first_delivery_completed', 'rewarded', 'expired')),
        reward_amount NUMERIC(10, 2) DEFAULT 500.00,
        reward_type VARCHAR(50) DEFAULT 'cash',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_referrer ON delivery_referrals(referrer_partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_referred ON delivery_referrals(referred_partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_code ON delivery_referrals(referral_code)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_status ON delivery_referrals(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referrals_created ON delivery_referrals(created_at)`);

    await q(`
      CREATE TABLE IF NOT EXISTS delivery_referral_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
        referral_id UUID REFERENCES delivery_referrals(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        wallet_transaction_id UUID,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'cancelled')),
        credited_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referral_rewards_partner ON delivery_referral_rewards(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referral_rewards_status ON delivery_referral_rewards(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_referral_rewards_created ON delivery_referral_rewards(created_at)`);

    await q(`
      CREATE TABLE IF NOT EXISTS delivery_referral_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        default_reward_amount NUMERIC(10, 2) DEFAULT 500.00,
        reward_type VARCHAR(50) DEFAULT 'cash',
        expiry_days INTEGER DEFAULT 30,
        min_deliveries_required INTEGER DEFAULT 1,
        auto_credit_enabled BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`
      INSERT INTO delivery_referral_settings (default_reward_amount, reward_type, expiry_days, min_deliveries_required, auto_credit_enabled)
      SELECT 500.00, 'cash', 30, 1, TRUE
      WHERE NOT EXISTS (SELECT 1 FROM delivery_referral_settings)
    `);

    // ── Delivery Offline Sync Logs Table ─────────────────────────────────────
    await q(`
      CREATE TABLE IF NOT EXISTS delivery_sync_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
        sync_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id UUID,
        payload JSONB DEFAULT '{}'::jsonb,
        sync_status VARCHAR(30) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_sync_logs_partner ON delivery_sync_logs(partner_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_sync_logs_status ON delivery_sync_logs(sync_status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_delivery_sync_logs_created ON delivery_sync_logs(created_at)`);

    console.log('[SCHEMA] Critical schema checks completed');
  } catch (err) {
    console.error('[SCHEMA] ensureSchema warning:', err.message);
  } finally {
    client.release();
  }
}

module.exports = ensureSchema;
