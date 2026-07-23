const bcrypt = require('bcrypt');
const {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  updateUserProfile: updateUserProfileModel,
  updateUserPassword,
  markPhoneVerified,
} = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const {
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
} = require('../utils/generateToken');
const { writeAudit, clientMeta } = require('../services/auditService');
const { bump } = require('../services/metricsService');
const { createAlert } = require('../services/alertService');
const { normalizeEmail } = require('../utils/normalizeEmail');
const {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidIndianMobileOnly,
  getPasswordPolicyMessage,
} = require('../utils/validation');
const { toE164Indian, normalizeIndianMobile } = require('../utils/phone');
const { setAuthCookies, clearAuthCookies } = require('../utils/authCookies');
const { fail } = require('../utils/respond');
const { log } = require('../utils/logger');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

const buildAuthUserPayload = (user, token, refresh_token = null) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  phone_number: user.phone_number,
  role: user.role,
  admin_role: user.admin_role || (user.role === 'admin' ? 'admin' : null),
  is_phone_verified: Boolean(user.is_phone_verified),
  token,
  refresh_token,
});

const sendAuthSuccess = (res, status, message, user, token, refresh_token = null) => {
  const payload = buildAuthUserPayload(user, token, refresh_token);
  return res.status(status).json({
    success: true,
    message,
    user: {
      id: payload.id,
      full_name: payload.full_name,
      email: payload.email,
      phone_number: payload.phone_number,
      role: payload.role,
      admin_role: payload.admin_role,
      is_phone_verified: payload.is_phone_verified,
    },
    token,
    data: payload,
  });
};

const issueSessionForUser = async (req, res, user, message, status = 200) => {
  const token = generateToken(user.id, { tv: user.token_version ?? 1 });
  let refresh_token = null;
  try {
    refresh_token = await generateRefreshToken(user.id, clientMeta(req));
  } catch {
    /* optional */
  }
  setAuthCookies(res, { accessToken: token, refreshToken: refresh_token });
  return sendAuthSuccess(res, status, message, user, token, refresh_token);
};

const syntheticEmailFromPhone = (phone) =>
  `u${normalizeIndianMobile(phone)}@phone.foodiq.local`;

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    log.info('[auth] register request received', {
      email: req.body?.email ? String(req.body.email).trim().toLowerCase() : null,
      hasPhone: Boolean(req.body?.phone || req.body?.phone_number),
    });

    const full_name = String(req.body.full_name || '').trim();
    const rawEmail = String(req.body.email || '').trim();
    const password = req.body.password;
    const phone = String(req.body.phone || req.body.phone_number || req.body.mobile || '').trim();

    if (!full_name || !password || !phone) {
      log.warn('[auth] register validation failed: missing fields');
      return res.status(400).json({
        success: false,
        message: 'Please include full_name, password, and phone',
        error: {},
      });
    }

    if (!isValidIndianMobileOnly(phone)) {
      log.warn('[auth] register validation failed: invalid phone', { phone });
      return res.status(400).json({
        success: false,
        message: 'Enter a valid 10-digit Indian mobile number',
        error: {},
      });
    }

    const email = rawEmail
      ? normalizeEmail(rawEmail)
      : syntheticEmailFromPhone(phone);

    if (rawEmail && !isValidEmail(email)) {
      log.warn('[auth] register validation failed: invalid email', { email });
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: {},
      });
    }

    if (!isValidPassword(password)) {
      log.warn('[auth] register validation failed: weak password');
      return res.status(400).json({
        success: false,
        message: getPasswordPolicyMessage(),
        error: {},
      });
    }

    if (rawEmail) {
      const userExists = await findUserByEmail(email);
      if (userExists) {
        log.warn('[auth] register rejected: duplicate email', { email });
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
          error: {},
        });
      }
    }

    const phoneExists = await findUserByPhone(phone);
    if (phoneExists) {
      log.warn('[auth] register rejected: duplicate phone', { phone });
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists',
        error: {},
      });
    }

    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const password_hash = await bcrypt.hash(password, salt);
    log.info('[auth] password hashed for registration');

    const user = await createUser({
      full_name,
      email,
      password_hash,
      phone_number: phone,
      is_phone_verified: Boolean(req.body.phone_verified),
    });

    if (user) {
      log.info('[auth] user created in database', { userId: user.id, email: user.email });
      const { pool } = require('../config/db');
      try {
        await pool.query(
          'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
          [user.id]
        );
      } catch (settingsErr) {
        log.warn('user_settings on signup skipped', { error: settingsErr.message });
      }
      try {
        const loyaltyEngine = require('../services/loyaltyEngine');
        const loyaltyModel = require('../models/loyaltyModel');
        const signupRule = await loyaltyModel.getRule('signup');
        await loyaltyEngine.credit({
          userId: user.id,
          points: Number(signupRule?.points || 50),
          source: 'signup',
          referenceId: user.id,
          description: 'Welcome bonus',
        });
      } catch {
        await pool.query(
          'INSERT INTO rewards (user_id, points_balance, total_earned) VALUES ($1, 50, 50) ON CONFLICT (user_id) DO NOTHING',
          [user.id]
        );
      }
      try {
        await pool.query(
          'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
          [user.id, 'Welcome to Foodiq!', 'Thanks for joining. Explore restaurants and place your first order.']
        );
      } catch (notifErr) {
        log.warn('welcome notification skipped', { error: notifErr.message });
      }

      // Referral invite code (optional)
      try {
        const referralCode = req.body.referral_code || req.body.invite_code;
        const { applyReferralOnSignup, getOrCreateReferralCode } = require('../models/referralModel');
        if (referralCode) {
          await applyReferralOnSignup({ refereeId: user.id, code: referralCode });
        }
        await getOrCreateReferralCode(user.id, full_name);
      } catch (refErr) {
        log.warn('referral on signup skipped', { error: refErr.message });
      }

      try {
        const { dispatchEmailSms } = require('../services/commsService');
        await dispatchEmailSms({
          userId: user.id,
          type: 'welcome',
          title: 'Welcome to Foodiq!',
          message: 'Thanks for joining. Explore restaurants and place your first order.',
          transactional: true,
          forceEmail: true,
        });
      } catch (err) {
        log.warn('welcome email skipped', { error: err.message });
      }

      const token = generateToken(user.id, { tv: user.token_version ?? 1 });
      log.info('[auth] access JWT generated', { userId: user.id });

      let refresh_token = null;
      try {
        refresh_token = await generateRefreshToken(user.id, clientMeta(req));
      } catch {
        /* optional */
      }

      writeAudit({
        userId: user.id,
        role: user.role || 'customer',
        action: 'signup',
        category: 'auth',
        message: 'User registered',
        req,
      }).catch(() => {});

      setAuthCookies(res, { accessToken: token, refreshToken: refresh_token });

      log.info('[auth] register success response sent', { userId: user.id });
      return sendAuthSuccess(
        res,
        201,
        'Registration successful',
        user,
        token,
        refresh_token
      );
    } else {
      log.error('[auth] register failed: createUser returned empty row');
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
        error: {},
      });
    }
  } catch (error) {
    if (error?.code === '23505') {
      const message =
        String(error.detail || '').includes('phone') || String(error.constraint || '').includes('phone')
          ? 'Phone number already exists'
          : 'Email already exists';
      log.warn('[auth] register duplicate key', { message });
      return res.status(400).json({
        success: false,
        message,
        error: {},
      });
    }
    log.error('[auth] register server error', { error: error.message });
    return fail(res, 500, 'Server Error during registration', error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const mobile = String(req.body.mobile || req.body.phone || req.body.phone_number || '').trim();
    const password = req.body.password;
    const identifier = email || mobile;

    log.info('[auth] login request received', {
      email: email || null,
      mobile: mobile ? normalizeIndianMobile(mobile) : null,
    });

    if (!identifier || !password) {
      log.warn('[auth] login validation failed: missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Please include mobile (or email) and password',
        error: {},
      });
    }

    let user = null;
    if (email) {
      if (!isValidEmail(email)) {
        log.warn('[auth] login validation failed: invalid email', { email });
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
          error: {},
        });
      }
      user = await findUserByEmail(email);
    } else {
      if (!isValidIndianMobileOnly(mobile)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid 10-digit Indian mobile number',
          error: {},
        });
      }
      user = await findUserByPhone(mobile);
    }

    if (!user) {
      log.warn('[auth] login failed: user not found', { identifier });
      bump('auth_failed');
      writeAudit({
        action: 'failed_login',
        category: 'auth',
        status: 'failure',
        message: 'Login failed',
        req,
      }).catch(() => {});
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: {},
      });
    }

    if (!user.password_hash || !user.password_hash.startsWith('$2')) {
      log.warn('[auth] login failed: missing bcrypt hash', { userId: user.id });
      bump('auth_failed');
      return res.status(401).json({
        success: false,
        message: 'Wrong password',
        error: {},
      });
    }

    const passwordMatched = await bcrypt.compare(password, user.password_hash);
    log.info('[auth] password compare completed', { userId: user.id, matched: passwordMatched });

    if (!passwordMatched) {
      bump('auth_failed');
      writeAudit({
        userId: user.id,
        role: user.role,
        action: 'failed_login',
        category: 'auth',
        status: 'failure',
        message: 'Incorrect password',
        req,
      }).catch(() => {});
      if (require('../services/metricsService').counters.auth_failed % 25 === 0) {
        createAlert({
          severity: 'warning',
          type: 'failed_logins',
          title: 'Repeated failed logins',
          message: 'Multiple failed login attempts detected',
        }).catch(() => {});
      }
      return res.status(401).json({
        success: false,
        message: 'Wrong password',
        error: {},
      });
    }

    writeAudit({
      userId: user.id,
      role: user.role,
      action: user.role === 'admin' ? 'admin_login' : 'login',
      category: 'auth',
      message: user.role === 'admin' ? 'Admin logged in' : 'User logged in',
      req,
    }).catch(() => {});

    if (user.role === 'customer') {
      try {
        const loyaltyEngine = require('../services/loyaltyEngine');
        await loyaltyEngine.creditDailyLogin(user.id);
      } catch {
        /* daily login already credited */
      }
    }

    log.info('[auth] login success response sent', { userId: user.id });
    return issueSessionForUser(req, res, user, 'Login successful');
  } catch (error) {
    log.error('[auth] login server error', { error: error.message });
    return fail(res, 500, 'Server Error during login', error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (user) {
      res.json({
        success: true,
        message: 'Profile retrieved',
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: {},
      });
    }
  } catch (error) {
    return fail(res, 500, 'Server Error retrieving profile', error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (user) {
      const updatedUser = await updateUserProfileModel(req.user.id, {
        full_name: req.body.full_name || user.full_name,
        phone_number: req.body.phone_number || user.phone_number,
      });

      await require('../middleware/authMiddleware').invalidateUserSession(req.user.id);

      res.json({
        success: true,
        message: 'Profile updated',
        data: {
          id: updatedUser.id,
          full_name: updatedUser.full_name,
          email: updatedUser.email,
          phone_number: updatedUser.phone_number,
          role: updatedUser.role,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: {},
      });
    }
  } catch (error) {
    return fail(res, 500, 'Server Error updating profile', error);
  }
};

// @desc    Request password reset OTP via email (and SMS if phone on file)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const mobile = String(req.body.mobile || req.body.phone || req.body.phone_number || '').trim();

    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number or email is required',
        error: {},
      });
    }

    let user = null;
    if (mobile) {
      if (!isValidIndianMobileOnly(mobile)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid 10-digit Indian mobile number',
          error: {},
        });
      }
      user = await findUserByPhone(mobile);
    } else {
      user = await findUserByEmail(email);
    }

    const genericMessage = mobile
      ? 'If an account exists for this mobile number, a password reset code has been sent.'
      : 'If an account exists for this email, a password reset code has been sent.';

    if (!user) {
      return res.json({
        success: true,
        message: genericMessage,
        data: email ? { email } : { mobile: toE164Indian(mobile) },
      });
    }

    const { issueOtp } = require('../services/otpService');
    const destination = mobile ? toE164Indian(mobile) : email;
    const channel = mobile ? 'sms' : user.phone_number ? 'both' : 'email';
    const otpResult = await issueOtp({
      userId: user.id,
      destination,
      channel,
      purpose: 'password_reset',
      name: user.full_name,
    });

    const payload = email
      ? { email, expires_at: otpResult.expires_at }
      : { mobile: toE164Indian(mobile), expires_at: otpResult.expires_at };

    if (
      process.env.NODE_ENV !== 'production' &&
      otpResult.debug_code &&
      String(process.env.OTP_EXPOSE_CODE || '').toLowerCase() === 'true'
    ) {
      payload.debug_code = otpResult.debug_code;
    }

    res.json({
      success: true,
      message: genericMessage,
      data: payload,
    });
  } catch (error) {
    return fail(
      res,
      error.status || 500,
      error.status && error.status < 500
        ? error.message
        : 'Unable to process password reset request',
      error
    );
  }
};

// @desc    Reset password with OTP code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const mobile = String(req.body.mobile || req.body.phone || req.body.phone_number || '').trim();
    const resetCode = String(req.body.reset_code || req.body.code || req.body.otp || '').trim();
    const newPassword = req.body.new_password || req.body.password;

    if ((!email && !mobile) || !resetCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mobile (or email), reset code, and new password are required',
        error: {},
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: getPasswordPolicyMessage(),
        error: {},
      });
    }

    const user = mobile ? await findUserByPhone(mobile) : await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code',
        error: {},
      });
    }

    const { verifyOtp } = require('../services/otpService');
    const isMockEmail = String(process.env.EMAIL_PROVIDER || 'mock').toLowerCase() === 'mock';
    const isMockSms = String(process.env.SMS_PROVIDER || 'mock').toLowerCase() === 'mock';
    const allowDemoReset =
      process.env.NODE_ENV !== 'production' &&
      ((email && isMockEmail) || (mobile && isMockSms)) &&
      resetCode.toUpperCase() === 'FOODIQ';
    if (!allowDemoReset) {
      await verifyOtp({
        destination: mobile ? toE164Indian(mobile) : email,
        purpose: 'password_reset',
        code: resetCode,
      });
    }

    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await updateUserPassword(user.id, password_hash);
    await revokeAllForUser(user.id).catch(() => {});
    await require('../middleware/authMiddleware').invalidateUserSession(user.id).catch(() => {});

    writeAudit({
      userId: user.id,
      role: user.role,
      action: 'password_reset',
      category: 'auth',
      message: 'Password reset completed',
      req,
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
      data: {},
    });
  } catch (error) {
    return fail(
      res,
      error.status || 500,
      error.status && error.status < 500
        ? error.message
        : 'Unable to reset password',
      error
    );
  }
};

// @desc    Send OTP for phone sign-in / password reset
// @route   POST /api/auth/send-otp
// @access  Public
const sendAuthOtp = async (req, res) => {
  try {
    const mobile = String(req.body.mobile || req.body.phone || req.body.phone_number || '').trim();
    const purposeRaw = String(req.body.purpose || 'phone_login').trim().toLowerCase();
    const purpose =
      purposeRaw === 'password_reset' || purposeRaw === 'forgot_password'
        ? 'password_reset'
        : 'phone_login';

    if (!isValidIndianMobileOnly(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid 10-digit Indian mobile number',
        error: {},
      });
    }

    const destination = toE164Indian(mobile);
    const user = await findUserByPhone(mobile);

    if (purpose === 'password_reset' && !user) {
      return res.json({
        success: true,
        message: 'If an account exists for this mobile number, a password reset code has been sent.',
        data: { mobile: destination },
      });
    }

    const { issueOtp } = require('../services/otpService');
    const otpResult = await issueOtp({
      userId: user?.id || null,
      destination,
      channel: 'sms',
      purpose,
      name: user?.full_name || null,
    });

    const data = {
      mobile: destination,
      otp_id: otpResult.otp_id,
      expires_at: otpResult.expires_at,
      purpose,
      account_exists: Boolean(user),
    };

    if (
      process.env.NODE_ENV !== 'production' &&
      otpResult.debug_code &&
      String(process.env.OTP_EXPOSE_CODE || '').toLowerCase() === 'true'
    ) {
      data.debug_code = otpResult.debug_code;
    }

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      data,
    });
  } catch (error) {
    return fail(
      res,
      error.status || 500,
      error.status && error.status < 500 ? error.message : 'Failed to send OTP',
      error
    );
  }
};

// @desc    Verify OTP and create JWT session (phone login)
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyAuthOtp = async (req, res) => {
  try {
    const mobile = String(req.body.mobile || req.body.phone || req.body.phone_number || '').trim();
    const code = String(req.body.otp || req.body.code || '').trim();
    const purposeRaw = String(req.body.purpose || 'phone_login').trim().toLowerCase();
    const purpose =
      purposeRaw === 'password_reset' || purposeRaw === 'forgot_password'
        ? 'password_reset'
        : 'phone_login';

    if (!isValidIndianMobileOnly(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid 10-digit Indian mobile number',
        error: {},
      });
    }
    if (!/^\d{4,8}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid OTP',
        error: {},
      });
    }

    const destination = toE164Indian(mobile);
    const { verifyOtp } = require('../services/otpService');
    await verifyOtp({ destination, purpose, code });

    if (purpose === 'password_reset') {
      return res.json({
        success: true,
        message: 'OTP verified. You can set a new password.',
        data: { mobile: destination, verified: true, purpose },
      });
    }

    let user = await findUserByPhone(mobile);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found for this number. Please create an account.',
        error: { needs_registration: true },
        data: { needs_registration: true, mobile: destination },
      });
    }

    try {
      user = (await markPhoneVerified(user.id)) || user;
    } catch {
      /* column may be pending migration */
    }

    writeAudit({
      userId: user.id,
      role: user.role,
      action: 'otp_login',
      category: 'auth',
      message: 'User signed in with OTP',
      req,
    }).catch(() => {});

    if (user.role === 'customer') {
      try {
        const loyaltyEngine = require('../services/loyaltyEngine');
        await loyaltyEngine.creditDailyLogin(user.id);
      } catch {
        /* ignore */
      }
    }

    return issueSessionForUser(req, res, user, 'OTP verified. Signed in successfully.');
  } catch (error) {
    return fail(
      res,
      error.status || 500,
      error.status && error.status < 500 ? error.message : 'OTP verification failed',
      error
    );
  }
};

// @desc    Logout user / clear token
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
  try {
    const refresh = req.body?.refresh_token || req.cookies?.refresh_token;
    if (refresh) await revokeRefreshToken(refresh);
    if (req.user?.id) {
      writeAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'logout',
        category: 'auth',
        req,
      }).catch(() => {});
    }
    clearAuthCookies(res);
    res.json({
      success: true,
      message: 'Logged out successfully. Please remove token on the client.',
      data: {},
    });
  } catch (error) {
    return fail(res, 500, 'Logout failed', error);
  }
};

const logoutAllDevices = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Not authorized', error: {} });
    }
    await revokeAllForUser(req.user.id);
    await require('../middleware/authMiddleware').invalidateUserSession(req.user.id).catch(() => {});
    clearAuthCookies(res);
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'logout_all_devices',
      category: 'auth',
      message: 'Logged out from all devices',
      req,
    }).catch(() => {});
    res.json({
      success: true,
      message: 'Logged out from all devices. Please sign in again.',
      data: {},
    });
  } catch (error) {
    return fail(res, 500, 'Logout failed', error);
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refresh_token = req.body.refresh_token || req.cookies?.refresh_token;
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'refresh_token is required',
        error: {},
      });
    }
    const rotated = await rotateRefreshToken(refresh_token, clientMeta(req));
    writeAudit({
      userId: rotated.userId,
      action: 'token_refresh',
      category: 'auth',
      req,
    }).catch(() => {});
    setAuthCookies(res, {
      accessToken: rotated.access,
      refreshToken: rotated.refresh,
    });
    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        token: rotated.access,
        refresh_token: rotated.refresh,
      },
    });
  } catch (error) {
    return fail(res, error.status || 401, error.message || 'Refresh failed', error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  sendAuthOtp,
  verifyAuthOtp,
};
