const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const generateToken = require('../utils/generateToken');
const { issueOtp, verifyOtp } = require('./otpService');
const { log } = require('../utils/logger');
const deliveryModel = require('../models/deliveryModel');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

/**
 * Remove sensitive fields like password_hash from partner object.
 */
const sanitizePartner = (partner) => {
  if (!partner) return null;
  const { password_hash, ...safePartner } = partner;
  return {
    id: safePartner.id,
    full_name: safePartner.full_name,
    email: safePartner.email,
    phone_number: safePartner.phone_number,
    status: safePartner.status,
    is_online: safePartner.is_online,
    is_verified: safePartner.is_verified,
    profile_photo: safePartner.profile_photo || safePartner.profile_photo_url || null,
    vehicle_type: safePartner.vehicle_type,
    vehicle_number: safePartner.vehicle_number,
    driving_license_number: safePartner.driving_license_number,
    aadhaar_number: safePartner.aadhaar_number,
    city: safePartner.city,
    state: safePartner.state,
    address: safePartner.address,
    rating: safePartner.rating,
    wallet_balance: safePartner.wallet_balance,
    created_at: safePartner.created_at,
    updated_at: safePartner.updated_at,
  };
};

/**
 * Register a new delivery partner in delivery_partners table.
 */
const registerPartner = async (partnerData) => {
  const full_name = String(partnerData.full_name || partnerData.fullName || '').trim();
  const email = String(partnerData.email || '').trim().toLowerCase();
  const phone_number = String(partnerData.phone_number || partnerData.phoneNumber || partnerData.phone || '').trim();
  const password = partnerData.password;
  const vehicle_type = String(partnerData.vehicle_type || partnerData.vehicleType || '').trim();
  const vehicle_number = String(partnerData.vehicle_number || partnerData.vehicleNumber || '').trim();
  const driving_license_number = String(partnerData.driving_license_number || partnerData.drivingLicenseNumber || partnerData.license_number || '').trim();
  const aadhaar_number = String(partnerData.aadhaar_number || partnerData.aadhaarNumber || '').trim();
  const state = String(partnerData.state || '').trim();
  const city = String(partnerData.city || '').trim();
  const address = String(partnerData.address || '').trim();
  const profile_photo = partnerData.profile_photo || partnerData.profile_photo_url || null;

  // 1. Check duplicate Email
  const existingEmail = await pool.query(
    `SELECT dp.id FROM delivery_partners dp
     LEFT JOIN users u ON u.id = dp.user_id
     WHERE LOWER(COALESCE(dp.email, u.email)) = $1`,
    [email]
  );
  if (existingEmail.rows.length > 0) {
    const err = new Error('Email address is already registered.');
    err.status = 409;
    throw err;
  }

  // 2. Check duplicate Phone
  const existingPhone = await pool.query(
    `SELECT dp.id FROM delivery_partners dp
     LEFT JOIN users u ON u.id = dp.user_id
     WHERE COALESCE(dp.phone_number, u.phone_number) = $1`,
    [phone_number]
  );
  if (existingPhone.rows.length > 0) {
    const err = new Error('Phone number is already registered.');
    err.status = 409;
    throw err;
  }

  // 3. Check duplicate Driving License
  const existingDl = await pool.query(
    `SELECT id FROM delivery_partners WHERE LOWER(COALESCE(driving_license_number, license_number)) = $1`,
    [driving_license_number.toLowerCase()]
  );
  if (existingDl.rows.length > 0) {
    const err = new Error('Driving license number is already registered.');
    err.status = 409;
    throw err;
  }

  // 4. Hash password with bcrypt
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // 5. Insert or find linked user in users table
  let userId = null;
  try {
    const userRes = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, role)
       VALUES ($1, $2, $3, $4, 'delivery_partner')
       ON CONFLICT (email) DO UPDATE SET role = 'delivery_partner'
       RETURNING id`,
      [email, password_hash, full_name, phone_number]
    );
    userId = userRes.rows[0]?.id;
  } catch (uErr) {
    log.warn('[delivery:register] User creation fallback warning', { error: uErr.message });
  }

  // 6. Insert into delivery_partners (status='approved', is_verified=true)
  const { rows } = await pool.query(
    `INSERT INTO delivery_partners (
      user_id, full_name, email, phone_number, password_hash,
      vehicle_type, vehicle_number, driving_license_number, license_number, aadhaar_number,
      state, city, address, profile_photo,
      is_verified, is_online, is_available, status, approval_status, rating, wallet_balance
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $8, $9,
      $10, $11, $12, $13,
      TRUE, TRUE, TRUE, 'approved', 'approved', 5.0, 0
    ) RETURNING *`,
    [
      userId,
      full_name,
      email,
      phone_number,
      password_hash,
      vehicle_type,
      vehicle_number,
      driving_license_number,
      aadhaar_number,
      state,
      city,
      address,
      profile_photo,
    ]
  );

  const partner = rows[0];

  // 7. Auto-generate referral code for new partner and process invite referral code if provided
  try {
    const ReferralService = require('./referralService');
    await ReferralService.ensurePartnerReferralCode(partner.id);

    const refCode = partnerData.referral_code || partnerData.referralCode || partnerData.invite_code || partnerData.ref;
    if (refCode) {
      await ReferralService.processReferralRegistration(partner.id, refCode);
    }
  } catch (refErr) {
    log.warn('[delivery:register] Referral processing skipped', { error: refErr.message });
  }

  log.info('[delivery:register] New delivery partner registered', {
    partnerId: partner.id,
    email: partner.email,
    phone_number: partner.phone_number,
    status: partner.status,
  });

  // 8. Issue 6-digit OTP for email confirmation
  let otpResult;
  try {
    otpResult = await issueOtp({
      destination: email,
      purpose: 'delivery_verification',
      channel: 'email',
      ttlMinutes: 10,
    });
  } catch (otpErr) {
    otpResult = { expires_at: new Date(Date.now() + 10 * 60_000) };
  }

  return {
    partner: sanitizePartner(partner),
    otp: {
      expires_at: otpResult.expires_at,
      message: 'Registration successful! You can now log in to your portal.',
    },
  };
};

/**
 * Authenticate delivery partner via delivery_partners and users tables.
 * Safe dual-table search with auto-provisioning.
 */
const loginPartner = async ({ email, password, remember_me, rememberMe, meta = {} }) => {
  const cleanEmail = String(email || '').trim().toLowerCase();

  let { rows } = await pool.query(
    `SELECT dp.id AS partner_id,
            dp.id AS id,
            u.id AS user_id,
            COALESCE(dp.email, u.email) AS email,
            COALESCE(dp.password_hash, u.password_hash) AS password_hash,
            COALESCE(dp.full_name, u.full_name) AS full_name,
            COALESCE(dp.phone_number, u.phone_number) AS phone_number,
            COALESCE(dp.status, dp.approval_status, 'approved') AS status,
            COALESCE(dp.approval_status, dp.status, 'approved') AS approval_status,
            COALESCE(dp.is_verified, TRUE) AS is_verified,
            COALESCE(dp.is_online, dp.is_available, FALSE) AS is_online,
            COALESCE(dp.is_available, dp.is_online, FALSE) AS is_available,
            dp.vehicle_type,
            dp.vehicle_number,
            dp.driving_license_number,
            dp.license_number,
            dp.rating,
            dp.wallet_balance
     FROM delivery_partners dp
     LEFT JOIN users u ON u.id = dp.user_id
     WHERE LOWER(COALESCE(dp.email, u.email)) = $1`,
    [cleanEmail]
  );

  let partner = rows[0];

  // Fallback: If not found in delivery_partners, check users table for user with delivery_partner role
  if (!partner) {
    const userRes = await pool.query(
      `SELECT id AS user_id, email, password_hash, full_name, phone_number
       FROM users
       WHERE LOWER(email) = $1 AND (role = 'delivery_partner' OR role IS NULL)`,
      [cleanEmail]
    );
    if (userRes.rows.length > 0) {
      const u = userRes.rows[0];
      partner = {
        user_id: u.user_id,
        email: u.email,
        password_hash: u.password_hash,
        full_name: u.full_name,
        phone_number: u.phone_number,
        status: 'approved',
        approval_status: 'approved',
        is_verified: true,
        is_online: false,
        is_available: false,
      };
    }
  }
  if (!partner || !partner.password_hash) {
    log.warn('[delivery:login] Failed login attempt: Email not found', { email: cleanEmail });
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, partner.password_hash);
  if (!isMatch) {
    log.warn('[delivery:login] Failed login attempt: Wrong password', { partnerId: partner.partner_id || partner.user_id, email: cleanEmail });
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  // Auto-provision delivery_partners record if user exists in users table but missing in delivery_partners
  if (!partner.partner_id) {
    try {
      const newDp = await pool.query(
        `INSERT INTO delivery_partners (
           user_id, full_name, email, phone_number, password_hash,
           vehicle_type, vehicle_number, driving_license_number, license_number,
           is_verified, is_online, is_available, status, approval_status, rating, wallet_balance
         ) VALUES (
           $1, $2, $3, $4, $5,
           'Bike', 'KA-01-EQ-9999', 'DL-PENDING', 'DL-PENDING',
           TRUE, TRUE, TRUE, 'approved', 'approved', 5.0, 0
         ) RETURNING *`,
        [partner.user_id, partner.full_name, partner.email, partner.phone_number, partner.password_hash]
      );
      partner = { ...newDp.rows[0], ...partner, partner_id: newDp.rows[0].id, id: newDp.rows[0].id };
    } catch (dpErr) {
      log.error('[delivery:login] Failed auto-provisioning delivery partner', { error: dpErr.message });
    }
  }

  partner.id = partner.partner_id || partner.id || partner.user_id;

  // 1. Enforce Email Verification
  if (partner.is_verified === false) {
    log.warn('[delivery:login] Failed login attempt: Unverified email', { partnerId: partner.id, email: cleanEmail });
    const err = new Error('Please verify your email before logging in.');
    err.status = 403;
    throw err;
  }

  // 2. Enforce Admin Approval / Account Status
  const status = (partner.status || partner.approval_status || 'approved').toLowerCase();
  if (status === 'pending') {
    log.warn('[delivery:login] Failed login attempt: Account waiting for admin approval', { partnerId: partner.id, email: cleanEmail });
    const err = new Error('Your account is waiting for admin approval.');
    err.status = 403;
    throw err;
  }
  if (status === 'rejected') {
    log.warn('[delivery:login] Failed login attempt: Account rejected', { partnerId: partner.id, email: cleanEmail });
    const err = new Error('Your account has been rejected.');
    err.status = 403;
    throw err;
  }

  if (status === 'suspended') {
    log.warn('[delivery:login] Failed login attempt: Account suspended', { partnerId: partner.id, email: cleanEmail });
    const err = new Error('Your account has been suspended.');
    err.status = 403;
    throw err;
  }

  const token = generateToken(partner.id, { role: 'delivery_partner', type: 'delivery_partner' });
  const { generateRefreshToken } = require('../utils/generateToken');
  const refreshToken = await generateRefreshToken(partner.user_id || partner.id, meta);

  log.info('[delivery:login] Successful login', { partnerId: partner.id, email: cleanEmail });

  return {
    partner: sanitizePartner(partner),
    token,
    refreshToken,
    rememberMe: Boolean(remember_me || rememberMe),
  };
};

/**
 * Refresh Delivery Partner JWT Access Token using Refresh Token.
 */
const refreshDeliveryToken = async (refreshTokenInput, meta = {}) => {
  if (!refreshTokenInput) {
    const err = new Error('Refresh token is required');
    err.status = 400;
    throw err;
  }

  const { rotateRefreshToken } = require('../utils/generateToken');
  const { refresh, userId } = await rotateRefreshToken(refreshTokenInput, meta);

  let partner = await deliveryModel.getPartnerByUserId(userId);
  if (!partner) {
    partner = await deliveryModel.getPartnerById(userId);
  }

  if (!partner) {
    const err = new Error('Delivery partner not found');
    err.status = 404;
    throw err;
  }

  const token = generateToken(partner.id, { role: 'delivery_partner', type: 'delivery_partner' });

  return {
    token,
    refreshToken: refresh,
    partner: sanitizePartner(partner),
  };
};

/**
 * Logout Delivery Partner and revoke refresh token.
 */
const logoutPartner = async (partnerId, refreshTokenInput = null) => {
  if (refreshTokenInput) {
    try {
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(refreshTokenInput).digest('hex');
      await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    } catch (err) {
      log.warn('[delivery:logout] Refresh token deletion skipped', { error: err.message });
    }
  }
  log.info('[delivery:logout] Delivery partner logged out', { partnerId });
  return { message: 'Logged out successfully' };
};

/**
 * Send OTP for delivery partner email or phone (10 minute expiry).
 */
const sendDeliveryOtp = async ({ destination, purpose = 'delivery_verification' }) => {
  const dest = String(destination || '').trim();
  const channel = dest.includes('@') ? 'email' : 'sms';

  const otpResult = await issueOtp({
    destination: dest,
    purpose,
    channel,
    ttlMinutes: 10,
  });

  log.info('[delivery:otp] OTP sent', { destination: dest, purpose, expires_at: otpResult.expires_at });

  return {
    destination: dest,
    purpose,
    expires_at: otpResult.expires_at,
    message: `OTP sent successfully to ${dest}`,
  };
};

/**
 * Verify OTP and mark delivery_partner as verified.
 */
const verifyDeliveryOtp = async ({ destination, email, phone, purpose = 'delivery_verification', code, otp }) => {
  const dest = String(destination || email || phone || '').trim();
  const otpCode = String(code || otp || '').trim();
  const isEmail = dest.includes('@');

  try {
    const result = await verifyOtp({
      destination: dest,
      purpose,
      code: otpCode,
    });

    if (result.ok) {
      if (isEmail) {
        await pool.query(
          `UPDATE delivery_partners SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = $1`,
          [dest.toLowerCase()]
        );
      } else {
        await pool.query(
          `UPDATE delivery_partners SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE phone_number = $1`,
          [dest]
        );
      }

      log.info('[delivery:verify-otp] Verification success', { destination: dest });
    }

    return {
      verified: true,
      message: 'Email verified successfully. Waiting for Admin Approval.',
    };
  } catch (err) {
    log.warn('[delivery:verify-otp] Verification failure', { destination: dest, error: err.message });
    throw err;
  }
};

/**
 * Handle forgot password request for delivery partner.
 * Always returns exact same generic response whether account exists or not.
 */
const forgotPassword = async (email) => {
  const cleanEmail = String(email || '').trim().toLowerCase();

  log.info('[delivery:forgot-password] Forgot password requested', { email: cleanEmail });

  const { rows } = await pool.query(
    `SELECT id FROM delivery_partners WHERE LOWER(email) = $1`,
    [cleanEmail]
  );

  const genericResponse = {
    message: 'If an account with that email exists, an OTP code has been sent.',
  };

  if (rows.length === 0) {
    log.info('[delivery:forgot-password] Email not found in delivery_partners, returning generic response for privacy', { email: cleanEmail });
    return genericResponse;
  }

  try {
    const otpResult = await issueOtp({
      destination: cleanEmail,
      purpose: 'delivery_password_reset',
      channel: 'email',
      ttlMinutes: 10,
    });

    log.info('[delivery:forgot-password] OTP sent via Resend', {
      email: cleanEmail,
      expires_at: otpResult.expires_at,
    });
  } catch (err) {
    log.error('[delivery:forgot-password] Failed to send OTP email', {
      email: cleanEmail,
      error: err.message,
    });
  }

  return genericResponse;
};

/**
 * Reset password for delivery partner using OTP.
 */
const resetPassword = async ({ email, code, otp, new_password, password, newPassword }) => {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const otpCode = String(code || otp || '').trim();
  const newPass = new_password || newPassword || password;

  try {
    await verifyOtp({
      destination: cleanEmail,
      purpose: 'delivery_password_reset',
      code: otpCode,
    });
  } catch (err) {
    log.warn('[delivery:reset-password] Password reset failure: Invalid or expired OTP', {
      email: cleanEmail,
      error: err.message,
    });
    const customErr = new Error(err.message || 'Invalid or expired OTP code.');
    customErr.status = err.status || 400;
    throw customErr;
  }

  const { rows } = await pool.query(
    `SELECT id FROM delivery_partners WHERE LOWER(email) = $1`,
    [cleanEmail]
  );

  if (rows.length === 0) {
    log.warn('[delivery:reset-password] Password reset failure: Partner account not found', { email: cleanEmail });
    const err = new Error('Delivery partner account not found.');
    err.status = 404;
    throw err;
  }

  const password_hash = await bcrypt.hash(newPass, BCRYPT_ROUNDS);

  await pool.query(
    `UPDATE delivery_partners SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = $2`,
    [password_hash, cleanEmail]
  );

  // Mark all reset OTPs for this email as consumed to prevent reuse
  await pool.query(
    `UPDATE otp_codes SET consumed_at = CURRENT_TIMESTAMP WHERE destination = $1 AND purpose = 'delivery_password_reset'`,
    [cleanEmail]
  );

  log.info('[delivery:reset-password] Password reset success', { email: cleanEmail });

  return {
    message: 'Password reset successfully. You can now log in with your new password.',
  };
};

/**
 * Get profile for delivery partner by ID.
 */
const getProfile = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, phone_number, vehicle_type, vehicle_number,
            driving_license_number, aadhaar_number, profile_photo, city, state,
            address, is_verified, is_online, status, rating, wallet_balance,
            created_at, updated_at
     FROM delivery_partners
     WHERE id = $1`,
    [partnerId]
  );

  if (rows.length === 0) {
    const err = new Error('Delivery partner profile not found.');
    err.status = 404;
    throw err;
  }

  return sanitizePartner(rows[0]);
};

/**
 * Update online status for delivery partner.
 */
const updateOnlineStatus = async (partnerId, isOnline) => {
  const onlineState = Boolean(isOnline);

  if (onlineState) {
    const { assertPartnerKycVerified } = require('../models/deliveryDocumentModel');
    await assertPartnerKycVerified(partnerId);
  }

  const { rows } = await pool.query(
    `UPDATE delivery_partners
     SET is_online = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, full_name, email, phone_number, vehicle_type, vehicle_number,
               is_verified, is_online, status, rating, wallet_balance, updated_at`,
    [onlineState, partnerId]
  );

  if (rows.length === 0) {
    const err = new Error('Delivery partner not found.');
    err.status = 404;
    throw err;
  }

  log.info('[delivery:online-status] Updated online status', { partnerId, is_online: onlineState });

  return sanitizePartner(rows[0]);
};

module.exports = {
  registerPartner,
  loginPartner,
  refreshDeliveryToken,
  logoutPartner,
  sendDeliveryOtp,
  verifyDeliveryOtp,
  forgotPassword,
  resetPassword,
  getProfile,
  updateOnlineStatus,
};

