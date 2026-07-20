const bcrypt = require('bcrypt');
const {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile: updateUserProfileModel,
  updateUserPassword,
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
} = require('../utils/validation');
const { setAuthCookies, clearAuthCookies } = require('../utils/authCookies');
const { fail } = require('../utils/respond');
const { log } = require('../utils/logger');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const full_name = String(req.body.full_name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const phone = String(req.body.phone || req.body.phone_number || '').trim();

    if (!full_name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please include all fields (full_name, email, password, phone)',
        error: {},
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: {},
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters and include a letter and a number',
        error: {},
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        error: {},
      });
    }

    const userExists = await findUserByEmail(email);

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
        error: {},
      });
    }

    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await createUser({
      full_name,
      email,
      password_hash,
      phone_number: phone,
    });

    if (user) {
      const { pool } = require('../config/db');
      await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
        [user.id]
      );
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
      await pool.query(
        'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
        [user.id, 'Welcome to Foodiq!', 'Thanks for joining. Explore restaurants and place your first order.']
      );

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

      const token = generateToken(user.id);

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

      // Secure httpOnly cookies (also returns Bearer token for SPA)
      setAuthCookies(res, { accessToken: token, refreshToken: refresh_token });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role,
          token,
          refresh_token,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
        error: {},
      });
    }
  } catch (error) {
    return fail(res, 500, 'Server Error during registration', error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please include email and password',
        error: {},
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
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
        message: 'Invalid email or password.',
        error: {},
      });
    }

    if (!user.password_hash || !user.password_hash.startsWith('$2')) {
      bump('auth_failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        error: {},
      });
    }

    const passwordMatched = await bcrypt.compare(password, user.password_hash);

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
        message: 'Invalid email or password.',
        error: {},
      });
    }

    const token = generateToken(user.id);
    let refresh_token = null;
    try {
      refresh_token = await generateRefreshToken(user.id, clientMeta(req));
    } catch {
      /* optional */
    }

    writeAudit({
      userId: user.id,
      role: user.role,
      action: 'login',
      category: 'auth',
      message: 'User logged in',
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

    setAuthCookies(res, { accessToken: token, refreshToken: refresh_token });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        admin_role: user.admin_role || (user.role === 'admin' ? 'admin' : null),
        token,
        refresh_token,
      },
    });
  } catch (error) {
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
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required', error: {} });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Same response as success — avoid account enumeration
      return res.json({
        success: true,
        message:
          'If an account exists for this email, a password reset code has been sent.',
        data: { email },
      });
    }

    const { issueOtp } = require('../services/otpService');
    const channel = user.phone_number ? 'both' : 'email';
    const otpResult = await issueOtp({
      userId: user.id,
      destination: email,
      channel,
      purpose: 'password_reset',
      name: user.full_name,
    });

    const payload = { email, expires_at: otpResult.expires_at };
    // Never expose OTP codes outside non-production + explicit OTP_EXPOSE_CODE
    if (
      process.env.NODE_ENV !== 'production' &&
      otpResult.debug_code &&
      String(process.env.OTP_EXPOSE_CODE || '').toLowerCase() === 'true'
    ) {
      payload.debug_code = otpResult.debug_code;
    }

    res.json({
      success: true,
      message:
        'If an account exists for this email, a password reset code has been sent.',
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
    const resetCode = String(req.body.reset_code || req.body.code || '').trim();
    const newPassword = req.body.new_password || req.body.password;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code, and new password are required',
        error: {},
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters and include a letter and a number',
        error: {},
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code',
        error: {},
      });
    }

    const { verifyOtp } = require('../services/otpService');
    // Legacy demo code FOODIQ only in non-production mock email mode
    const isMockEmail = String(process.env.EMAIL_PROVIDER || 'mock').toLowerCase() === 'mock';
    const allowDemoReset =
      process.env.NODE_ENV !== 'production' &&
      isMockEmail &&
      resetCode.toUpperCase() === 'FOODIQ';
    if (!allowDemoReset) {
      await verifyOtp({
        destination: email,
        purpose: 'password_reset',
        code: resetCode,
      });
    }

    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await updateUserPassword(user.id, password_hash);
    await revokeAllForUser(user.id).catch(() => {});

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
  forgotPassword,
  resetPassword,
  refreshAccessToken,
};
