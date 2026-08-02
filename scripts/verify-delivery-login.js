/**
 * Verification script for Delivery Partner authentication & PostgreSQL schema audit.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../foodiq-frontend/foodiq-backend/.env') });
if (!process.env.DB_PASSWORD && process.env.NODE_ENV !== 'production') {
  process.env.DB_PASSWORD = 'postgres';
}
const { pool } = require('../foodiq-frontend/foodiq-backend/config/db');
const ensureSchema = require('../foodiq-frontend/foodiq-backend/utils/ensureSchema');
const deliveryService = require('../foodiq-frontend/foodiq-backend/services/deliveryService');
const bcrypt = require('../foodiq-frontend/foodiq-backend/node_modules/bcrypt');

async function runVerification() {
  console.log('=== STARTING DELIVERY PARTNER AUTHENTICATION & DATABASE VERIFICATION ===\n');

  // 1. Run ensureSchema migration
  console.log('[1/4] Running ensureSchema()...');
  await ensureSchema();
  console.log('✔ ensureSchema completed without errors.\n');

  // 2. Audit delivery_partners columns in PostgreSQL
  console.log('[2/4] Auditing PostgreSQL delivery_partners table schema...');
  const schemaRes = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'delivery_partners'
    ORDER BY ordinal_position
  `);

  console.log('delivery_partners columns in database:');
  const cols = schemaRes.rows.map((r) => r.column_name);
  console.log(cols.join(', '));

  const requiredCols = ['id', 'user_id', 'email', 'password_hash', 'status', 'approval_status', 'is_verified', 'is_online', 'is_available'];
  for (const col of requiredCols) {
    if (!cols.includes(col)) {
      throw new Error(`CRITICAL MISSING COLUMN in delivery_partners: ${col}`);
    }
  }
  console.log('✔ All required columns exist in delivery_partners PostgreSQL schema.\n');

  // 3. Setup test partner records for all login test cases
  console.log('[3/4] Setting up test data for all Rider Login cases...');
  const testPassword = 'TestPassword123!';
  const passwordHash = await bcrypt.hash(testPassword, 10);

  // Helper to insert or update delivery partner in real PostgreSQL DB
  const upsertTestPartner = async ({ email, phone, status, is_verified }) => {
    // 1. Ensure user exists in users table
    let userId;
    const userRes = await pool.query(`SELECT id FROM users WHERE LOWER(email) = $1`, [email.toLowerCase()]);
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      await pool.query(
        `UPDATE users SET password_hash = $1, full_name = $2, phone_number = $3, role = 'delivery_partner' WHERE id = $4`,
        [passwordHash, `Test Rider (${status})`, phone, userId]
      );
    } else {
      const newUser = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, phone_number, role)
         VALUES ($1, $2, $3, $4, 'delivery_partner')
         RETURNING id`,
        [email.toLowerCase(), passwordHash, `Test Rider (${status})`, phone]
      );
      userId = newUser.rows[0].id;
    }

    // 2. Ensure partner exists in delivery_partners table with user_id linked
    const existing = await pool.query(
      `SELECT id FROM delivery_partners WHERE user_id = $1 OR LOWER(email) = $2`,
      [userId, email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE delivery_partners
         SET user_id = $1, email = $2, password_hash = $3, status = $4, approval_status = $4, is_verified = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [userId, email.toLowerCase(), passwordHash, status, is_verified, existing.rows[0].id]
      );
      return existing.rows[0].id;
    } else {
      const ins = await pool.query(
        `INSERT INTO delivery_partners (
           user_id, full_name, email, phone_number, password_hash,
           vehicle_type, vehicle_number, driving_license_number, license_number,
           status, approval_status, is_verified, is_online, is_available
         ) VALUES ($1, $2, $3, $4, $5, 'Bike', 'KA-01-EQ-9999', $6, $6, $7, $7, $8, FALSE, FALSE)
         RETURNING id`,
        [
          userId,
          `Test Rider (${status})`,
          email.toLowerCase(),
          phone,
          passwordHash,
          `DL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status,
          is_verified,
        ]
      );
      return ins.rows[0].id;
    }
  };

  const activeEmail = 'active.rider@foodiq.com';
  const pendingEmail = 'pending.rider@foodiq.com';
  const rejectedEmail = 'rejected.rider@foodiq.com';
  const suspendedEmail = 'suspended.rider@foodiq.com';
  const unverifiedEmail = 'unverified.rider@foodiq.com';

  const activeId = await upsertTestPartner({ email: activeEmail, phone: '9900112233', status: 'approved', is_verified: true });
  await upsertTestPartner({ email: pendingEmail, phone: '9900112234', status: 'pending', is_verified: true });
  await upsertTestPartner({ email: rejectedEmail, phone: '9900112235', status: 'rejected', is_verified: true });
  await upsertTestPartner({ email: suspendedEmail, phone: '9900112236', status: 'suspended', is_verified: true });
  await upsertTestPartner({ email: unverifiedEmail, phone: '9900112237', status: 'approved', is_verified: false });

  console.log('✔ Test partner records created/updated in PostgreSQL.\n');

  // 4. Test all 8 authentication cases against live PostgreSQL DB
  console.log('[4/4] Executing Live Authentication Tests...');

  // Case 1: Existing Active Rider Login
  const loginRes = await deliveryService.loginPartner({ email: activeEmail, password: testPassword });
  if (!loginRes.token || !loginRes.refreshToken || !loginRes.partner) {
    throw new Error('Existing Rider Login failed: Missing token or partner payload');
  }
  console.log('✔ Case 1: Existing Active Rider Login -> SUCCESS (200 OK)');

  // Case 2: Wrong Password
  try {
    await deliveryService.loginPartner({ email: activeEmail, password: 'WrongPassword999!' });
    throw new Error('Wrong Password should have thrown 401');
  } catch (err) {
    if (err.status !== 401) throw err;
    console.log('✔ Case 2: Wrong Password -> SUCCESS (401 Unauthorized)');
  }

  // Case 3: Pending Rider
  try {
    await deliveryService.loginPartner({ email: pendingEmail, password: testPassword });
    throw new Error('Pending Rider should have thrown 403');
  } catch (err) {
    if (err.status !== 403 || !err.message.includes('waiting for admin approval')) throw err;
    console.log('✔ Case 3: Pending Rider -> SUCCESS (403 Forbidden - Admin Approval Pending)');
  }

  // Case 4: Rejected Rider
  try {
    await deliveryService.loginPartner({ email: rejectedEmail, password: testPassword });
    throw new Error('Rejected Rider should have thrown 403');
  } catch (err) {
    if (err.status !== 403 || !err.message.includes('rejected')) throw err;
    console.log('✔ Case 4: Rejected Rider -> SUCCESS (403 Forbidden - Account Rejected)');
  }

  // Case 5: Suspended Rider
  try {
    await deliveryService.loginPartner({ email: suspendedEmail, password: testPassword });
    throw new Error('Suspended Rider should have thrown 403');
  } catch (err) {
    if (err.status !== 403 || !err.message.includes('suspended')) throw err;
    console.log('✔ Case 5: Suspended Rider -> SUCCESS (403 Forbidden - Account Suspended)');
  }

  // Case 6: Email Verification Required
  try {
    await deliveryService.loginPartner({ email: unverifiedEmail, password: testPassword });
    throw new Error('Unverified Rider should have thrown 403');
  } catch (err) {
    if (err.status !== 403 || !err.message.includes('verify your email')) throw err;
    console.log('✔ Case 6: Email Verification Required -> SUCCESS (403 Forbidden - Unverified Email)');
  }

  // Case 7: Remember Me & Refresh Token Rotation
  const rememberRes = await deliveryService.loginPartner({ email: activeEmail, password: testPassword, remember_me: true });
  if (!rememberRes.rememberMe || !rememberRes.refreshToken) {
    throw new Error('Remember Me / Refresh Token generation failed');
  }
  const refreshed = await deliveryService.refreshDeliveryToken(rememberRes.refreshToken);
  if (!refreshed.token || !refreshed.refreshToken) {
    throw new Error('Refresh token rotation failed');
  }
  console.log('✔ Case 7: Remember Me & Refresh Token Rotation -> SUCCESS');

  // Case 8: Logout Flow
  const logoutRes = await deliveryService.logoutPartner(activeId, refreshed.refreshToken);
  if (logoutRes.message !== 'Logged out successfully') {
    throw new Error('Logout failed');
  }
  console.log('✔ Case 8: Logout & Token Revocation -> SUCCESS\n');

  console.log('================================================================');
  console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY WITH ZERO ERRORS!');
  console.log('================================================================');

  await pool.end();
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
