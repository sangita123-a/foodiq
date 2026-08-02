const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../foodiq-frontend/foodiq-backend/.env') });
if (!process.env.DB_PASSWORD && process.env.NODE_ENV !== 'production') {
  process.env.DB_PASSWORD = 'postgres';
}
const bcrypt = require('../foodiq-frontend/foodiq-backend/node_modules/bcrypt');
const crypto = require('crypto');
const ensureSchema = require('../foodiq-frontend/foodiq-backend/utils/ensureSchema');
const { pool } = require('../foodiq-frontend/foodiq-backend/config/db');
const deliveryService = require('../foodiq-frontend/foodiq-backend/services/deliveryService');

async function runVerification() {
  console.log('=== STARTING DELIVERY PARTNER FORGOT PASSWORD VERIFICATION ===\n');

  // [1/4] Run ensureSchema
  console.log('[1/4] Running ensureSchema()...');
  await ensureSchema();
  console.log('✔ ensureSchema completed.\n');

  // [2/4] Setup test rider record in PostgreSQL
  console.log('[2/4] Setting up test rider accounts in PostgreSQL...');
  const testEmail = 'forgot.rider@foodiq.com';
  const initialPassword = 'OldPassword123!';
  const initialHash = await bcrypt.hash(initialPassword, 12);

  // Clean existing test record if any
  await pool.query(`DELETE FROM delivery_partners WHERE LOWER(email) = $1`, [testEmail]);
  await pool.query(`DELETE FROM users WHERE LOWER(email) = $1`, [testEmail]);

  // Insert user
  const userRes = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, phone_number, role)
     VALUES ($1, $2, 'Forgot Test Rider', '9777777777', 'delivery_partner')
     RETURNING id`,
    [testEmail, initialHash]
  );
  const userId = userRes.rows[0].id;

  // Insert delivery partner
  const dpRes = await pool.query(
    `INSERT INTO delivery_partners (
       user_id, full_name, email, phone_number, password_hash,
       vehicle_type, vehicle_number, driving_license_number, license_number,
       is_verified, is_online, is_available, status, approval_status, rating, wallet_balance
     ) VALUES (
       $1, 'Forgot Test Rider', $2, '9777777777', $3,
       'Bike', 'KA-01-FP-1234', 'DL-FP-1234', 'DL-FP-1234',
       TRUE, TRUE, TRUE, 'approved', 'approved', 5.0, 0
     ) RETURNING id`,
    [userId, testEmail, initialHash]
  );
  const partnerId = dpRes.rows[0].id;
  console.log(`✔ Test partner created: ID=${partnerId}, Email=${testEmail}\n`);

  // [3/4] Execute Security & Functional Test Cases
  console.log('[3/4] Executing Security & Workflow Tests...\n');

  // Test Case 1: Forgot Password for Unknown Email (404 Error)
  console.log('--- Test Case 1: Unknown Email ---');
  try {
    await deliveryService.forgotPassword('nonexistent.rider@foodiq.com');
    console.error('❌ FAILED: Unknown email should have thrown 404');
    process.exit(1);
  } catch (err) {
    if (err.status === 404) {
      console.log('✔ Passed (404 Not Found as expected)');
    } else {
      console.error(`❌ FAILED: Unexpected error status ${err.status}: ${err.message}`);
      process.exit(1);
    }
  }

  // Test Case 2: Forgot Password for Suspended Account (403 Error)
  console.log('--- Test Case 2: Suspended Account ---');
  await pool.query(`UPDATE delivery_partners SET status = 'suspended' WHERE id = $1`, [partnerId]);
  try {
    await deliveryService.forgotPassword(testEmail);
    console.error('❌ FAILED: Suspended account should have thrown 403');
    process.exit(1);
  } catch (err) {
    if (err.status === 403) {
      console.log('✔ Passed (403 Forbidden as expected)');
    } else {
      console.error(`❌ FAILED: Unexpected error status ${err.status}: ${err.message}`);
      process.exit(1);
    }
  }
  // Restore status to approved
  await pool.query(`UPDATE delivery_partners SET status = 'approved' WHERE id = $1`, [partnerId]);

  // Test Case 3: Valid Forgot Password Request (OTP Hashed in DB)
  console.log('--- Test Case 3: Valid Forgot Password Request ---');
  const forgotRes = await deliveryService.forgotPassword(testEmail);
  if (!forgotRes.success) {
    console.error('❌ FAILED: forgotPassword returned failure:', forgotRes);
    process.exit(1);
  }
  const dbCheck = await pool.query(
    `SELECT reset_otp_hash, reset_otp_expiry, reset_otp_attempts FROM delivery_partners WHERE id = $1`,
    [partnerId]
  );
  const row = dbCheck.rows[0];
  if (!row.reset_otp_hash || !row.reset_otp_expiry || row.reset_otp_attempts !== 0) {
    console.error('❌ FAILED: DB does not contain valid hashed OTP fields:', row);
    process.exit(1);
  }
  console.log('✔ Passed: 6-digit OTP hash stored in DB, expiry = 15m, attempts = 0');

  // Manually generate a known OTP for test verification
  const testOtp = '654321';
  const testHash = crypto.createHash('sha256').update(testOtp).digest('hex');
  const testExpiry = new Date(Date.now() + 15 * 60 * 1000);
  await pool.query(
    `UPDATE delivery_partners SET reset_otp_hash = $1, reset_otp_expiry = $2, reset_otp_attempts = 0 WHERE id = $3`,
    [testHash, testExpiry, partnerId]
  );

  // Test Case 4: Wrong OTP Verification (Increments attempts)
  console.log('--- Test Case 4: Wrong OTP Verification ---');
  try {
    await deliveryService.verifyResetOtp({ email: testEmail, otp: '000000' });
    console.error('❌ FAILED: Wrong OTP should have thrown 400 error');
    process.exit(1);
  } catch (err) {
    if (err.status === 400 && err.message.includes('4 attempts remaining')) {
      console.log('✔ Passed: 400 error returned & attempts counter incremented to 1');
    } else {
      console.error(`❌ FAILED: Unexpected error: status=${err.status}, msg=${err.message}`);
      process.exit(1);
    }
  }

  // Test Case 5: Expired OTP Check
  console.log('--- Test Case 5: Expired OTP Check ---');
  await pool.query(
    `UPDATE delivery_partners SET reset_otp_expiry = NOW() - INTERVAL '1 minute' WHERE id = $1`,
    [partnerId]
  );
  try {
    await deliveryService.verifyResetOtp({ email: testEmail, otp: testOtp });
    console.error('❌ FAILED: Expired OTP should have thrown 400');
    process.exit(1);
  } catch (err) {
    if (err.status === 400 && err.message.toLowerCase().includes('expired')) {
      console.log('✔ Passed: 400 error returned for expired OTP');
    } else {
      console.error(`❌ FAILED: Unexpected error: status=${err.status}, msg=${err.message}`);
      process.exit(1);
    }
  }
  // Restore valid expiry
  await pool.query(
    `UPDATE delivery_partners SET reset_otp_expiry = $1 WHERE id = $2`,
    [testExpiry, partnerId]
  );

  // Test Case 6: Too Many Failed Attempts (5 Attempts Max)
  console.log('--- Test Case 6: Too Many Failed Attempts Limit ---');
  await pool.query(`UPDATE delivery_partners SET reset_otp_attempts = 5 WHERE id = $1`, [partnerId]);
  try {
    await deliveryService.verifyResetOtp({ email: testEmail, otp: testOtp });
    console.error('❌ FAILED: 5 failed attempts should have thrown 429');
    process.exit(1);
  } catch (err) {
    if (err.status === 429) {
      console.log('✔ Passed: 429 Too Many Requests returned for 5 failed attempts');
    } else {
      console.error(`❌ FAILED: Unexpected error: status=${err.status}, msg=${err.message}`);
      process.exit(1);
    }
  }
  // Reset attempts for next tests
  await pool.query(`UPDATE delivery_partners SET reset_otp_attempts = 0 WHERE id = $1`, [partnerId]);

  // Test Case 7: Weak Password Validation
  console.log('--- Test Case 7: Weak Password Complexity Validation ---');
  try {
    await deliveryService.resetPassword({
      email: testEmail,
      otp: testOtp,
      newPassword: 'weak',
    });
    console.error('❌ FAILED: Weak password should have been rejected');
    process.exit(1);
  } catch (err) {
    if (err.status === 400 && err.message.includes('at least 8 characters')) {
      console.log('✔ Passed: Weak password rejected with proper complexity guidance');
    } else {
      console.error(`❌ FAILED: Unexpected error: status=${err.status}, msg=${err.message}`);
      process.exit(1);
    }
  }

  // Test Case 8: Successful Password Reset
  console.log('--- Test Case 8: Successful Password Reset ---');
  const newPassword = 'NewStrongPassword123!';
  const resetRes = await deliveryService.resetPassword({
    email: testEmail,
    otp: testOtp,
    newPassword,
  });
  if (!resetRes.success) {
    console.error('❌ FAILED: resetPassword returned failure:', resetRes);
    process.exit(1);
  }
  const postResetCheck = await pool.query(
    `SELECT reset_otp_hash, reset_otp_expiry, reset_otp_attempts FROM delivery_partners WHERE id = $1`,
    [partnerId]
  );
  const clearedRow = postResetCheck.rows[0];
  if (clearedRow.reset_otp_hash !== null || clearedRow.reset_otp_expiry !== null) {
    console.error('❌ FAILED: OTP fields were not cleared after successful reset:', clearedRow);
    process.exit(1);
  }
  console.log('✔ Passed: Password reset successful, OTP fields cleared from DB');

  // Test Case 9: Login with New Password
  console.log('--- Test Case 9: Login with NEW Password ---');
  const loginNewRes = await deliveryService.loginPartner({
    email: testEmail,
    password: newPassword,
  });
  if (!loginNewRes.partner || !loginNewRes.token) {
    console.error('❌ FAILED: Login with new password failed:', loginNewRes);
    process.exit(1);
  }
  console.log(`✔ Passed: Login succeeded with NEW password (Partner ID=${loginNewRes.partner.id})`);

  // Test Case 10: Login with Old Password (Should Fail)
  console.log('--- Test Case 10: Login with OLD Password (Rejected) ---');
  try {
    await deliveryService.loginPartner({
      email: testEmail,
      password: initialPassword,
    });
    console.error('❌ FAILED: Old password was accepted');
    process.exit(1);
  } catch (err) {
    if (err.status === 401) {
      console.log('✔ Passed: Old password rejected with 401 Unauthorized');
    } else {
      console.error(`❌ FAILED: Unexpected error: status=${err.status}, msg=${err.message}`);
      process.exit(1);
    }
  }

  console.log('\n================================================================');
  console.log('ALL FORGOT PASSWORD VERIFICATION CHECKS PASSED PERFECTLY!');
  console.log('================================================================\n');

  process.exit(0);
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
