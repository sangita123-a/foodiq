const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool } = require('../config/db');
const generateToken = require('../utils/generateToken');
const { issueOtp, verifyOtp } = require('./otpService');
const { sendEmail } = require('./emailService');
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
 * Verifies email & account status, generates 6-digit OTP, stores SHA-256 hash in DB,
 * and emails OTP via SMTP service.
 */
const forgotPassword = async (email) => {
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    const err = new Error('Please enter a valid email address.');
    err.status = 400;
    throw err;
  }

  log.info('[delivery:forgot-password] Forgot password requested', { email: cleanEmail });

  const { rows } = await pool.query(
    `SELECT dp.id, dp.user_id, COALESCE(dp.status, dp.approval_status, 'approved') AS status
     FROM delivery_partners dp
     LEFT JOIN users u ON u.id = dp.user_id
     WHERE LOWER(COALESCE(dp.email, u.email)) = $1`,
    [cleanEmail]
  );

  if (rows.length === 0) {
    log.warn('[delivery:forgot-password] Account not found', { email: cleanEmail });
    const err = new Error('Delivery partner account not found.');
    err.status = 404;
    throw err;
  }

  const partner = rows[0];
  const status = (partner.status || 'approved').toLowerCase();
  if (status === 'rejected' || status === 'suspended') {
    log.warn('[delivery:forgot-password] Account not eligible for reset', { email: cleanEmail, status });
    const err = new Error(`Your account has been ${status}. Password reset is not allowed.`);
    err.status = 403;
    throw err;
  }

  // Generate secure 6-digit OTP
  const crypto = require('crypto');
  const otp = String(crypto.randomInt(100000, 999999));
  const resetOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const resetOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store in delivery_partners table
  await pool.query(
    `UPDATE delivery_partners
     SET reset_otp_hash = $1, reset_otp_expiry = $2, reset_otp_attempts = 0, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [resetOtpHash, resetOtpExpiry, partner.id]
  );

  // Send HTML Email via SMTP service
  try {
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #F3F4F6;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; background-color: #E53935; color: #FFFFFF; font-weight: 900; font-size: 24px; padding: 10px 20px; border-radius: 12px; letter-spacing: -0.5px;">
            Foodiq <span style="font-size: 14px; font-weight: 500; opacity: 0.9;">RIDER</span>
          </div>
        </div>
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 12px; text-align: center;">Delivery Partner Password Reset</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
          You requested a password reset for your Foodiq Delivery Partner account. Use the OTP code below to verify your request:
        </p>
        <div style="background-color: #FEF2F2; border: 2px dashed #EF4444; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #DC2626;">${otp}</span>
        </div>
        <div style="background-color: #F9FAFB; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; color: #6B7280; text-align: center;">
          ⏱️ This OTP code is valid for <strong>15 minutes</strong>. Maximum 5 attempts allowed.
        </div>
        <p style="color: #9CA3AF; font-size: 13px; line-height: 1.5; text-align: center;">
          If you did not request a password reset, please ignore this email or contact Foodiq Support immediately.
        </p>
      </div>
    `;

    await sendEmail({
      to: cleanEmail,
      subject: 'Foodiq Delivery Password Reset OTP',
      html: htmlContent,
      text: `Your Foodiq Delivery Password Reset OTP is ${otp}. It will expire in 15 minutes.`,
    });

    log.info('[delivery:forgot-password] OTP email sent successfully', { email: cleanEmail });
  } catch (emailErr) {
    log.error('[delivery:forgot-password] Email dispatch failed', { email: cleanEmail, error: emailErr.message });
  }

  return {
    success: true,
    message: 'A 6-digit OTP code has been sent to your email.',
  };
};

/**
 * Verify reset OTP for delivery partner.
 */
const verifyResetOtp = async ({ email, otp, code }) => {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const inputOtp = String(otp || code || '').trim();
  const crypto = require('crypto');

  if (!cleanEmail || !inputOtp) {
    const err = new Error('Email and OTP code are required.');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `SELECT dp.id, dp.reset_otp_hash, dp.reset_otp_expiry, COALESCE(dp.reset_otp_attempts, 0) AS reset_otp_attempts
     FROM delivery_partners dp
     LEFT JOIN users u ON u.id = dp.user_id
     WHERE LOWER(COALESCE(dp.email, u.email)) = $1`,
    [cleanEmail]
  );

  if (rows.length === 0) {
    const err = new Error('Delivery partner account not found.');
    err.status = 404;
    throw err;
  }

  const partner = rows[0];

  if (Number(partner.reset_otp_attempts) >= 5) {
    log.warn('[delivery:verify-otp] Max attempts reached', { email: cleanEmail });
    const err = new Error('Too many failed OTP attempts. Please request a new OTP.');
    err.status = 429;
    throw err;
  }

  if (!partner.reset_otp_expiry || new Date(partner.reset_otp_expiry) < new Date()) {
    log.warn('[delivery:verify-otp] OTP expired', { email: cleanEmail });
    const err = new Error('OTP has expired. Please request a new OTP.');
    err.status = 400;
    throw err;
  }

  const inputHash = crypto.createHash('sha256').update(inputOtp).digest('hex');
  if (inputHash !== partner.reset_otp_hash) {
    const newAttempts = Number(partner.reset_otp_attempts) + 1;
    await pool.query(
      `UPDATE delivery_partners SET reset_otp_attempts = $1 WHERE id = $2`,
      [newAttempts, partner.id]
    );

    const remaining = 5 - newAttempts;
    log.warn('[delivery:verify-otp] Mismatched OTP', { email: cleanEmail, attempts: newAttempts });

    if (remaining <= 0) {
      const err = new Error('Too many failed OTP attempts. Please request a new OTP.');
      err.status = 429;
      throw err;
    }

    const err = new Error(`Invalid OTP code. ${remaining} attempts remaining.`);
    err.status = 400;
    throw err;
  }

  log.info('[delivery:verify-otp] OTP verified successfully', { email: cleanEmail });
  return {
    success: true,
    message: 'OTP verified successfully.',
  };
};

/**
 * Reset password for delivery partner using verified OTP.
 */
const resetPassword = async ({ email, code, otp, new_password, password, newPassword }) => {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const inputOtp = String(otp || code || '').trim();
  const pass = String(newPassword || new_password || password || '').trim();

  // Validate Password Complexity
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-\\\/\[\]]/.test(pass);

  if (pass.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    const err = new Error(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    );
    err.status = 400;
    throw err;
  }

  // Verify OTP first
  await verifyResetOtp({ email: cleanEmail, otp: inputOtp });

  // Find partner record
  const { rows } = await pool.query(
    `SELECT dp.id, dp.user_id
     FROM delivery_partners dp
     LEFT JOIN users u ON u.id = dp.user_id
     WHERE LOWER(COALESCE(dp.email, u.email)) = $1`,
    [cleanEmail]
  );

  if (rows.length === 0) {
    const err = new Error('Delivery partner account not found.');
    err.status = 404;
    throw err;
  }

  const partner = rows[0];
  const password_hash = await bcrypt.hash(pass, BCRYPT_ROUNDS);

  // Clear OTP fields & update password in delivery_partners
  await pool.query(
    `UPDATE delivery_partners
     SET password_hash = $1, reset_otp_hash = NULL, reset_otp_expiry = NULL, reset_otp_attempts = 0, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [password_hash, partner.id]
  );

  // Update password in linked users table record if user_id exists
  if (partner.user_id) {
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [password_hash, partner.user_id]
    );
  }
  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2`,
    [password_hash, cleanEmail]
  );

  // Invalidate refresh tokens and revoke previous sessions
  try {
    await pool.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1 OR user_id = $2`,
      [partner.id, partner.user_id || partner.id]
    );
  } catch (tokenErr) {
    log.warn('[delivery:reset-password] Token invalidation warning', { error: tokenErr.message });
  }

  log.info('[delivery:reset-password] Password reset completed successfully', { email: cleanEmail, partnerId: partner.id });

  return {
    success: true,
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
  verifyResetOtp,
  resetPassword,
  getProfile,
  updateOnlineStatus,
};

