const bcrypt = require('bcrypt');
const {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile: updateUserProfileModel,
  updateUserPassword,
} = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const { normalizeEmail } = require('../utils/normalizeEmail');
const {
  isValidEmail,
  isValidPassword,
  isValidPhone,
} = require('../utils/validation');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    console.log('[AUTH] Register request received');

    const full_name = String(req.body.full_name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const phone = String(req.body.phone || req.body.phone_number || '').trim();

    if (!full_name || !email || !password || !phone) {
      console.log('[AUTH] Register failed: missing fields');
      return res.status(400).json({
        success: false,
        message: 'Please include all fields (full_name, email, password, phone)',
        error: {},
      });
    }

    if (!isValidEmail(email)) {
      console.log('[AUTH] Register failed: invalid email format', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: {},
      });
    }

    if (!isValidPassword(password)) {
      console.log('[AUTH] Register failed: password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        error: {},
      });
    }

    if (!isValidPhone(phone)) {
      console.log('[AUTH] Register failed: invalid phone', phone);
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        error: {},
      });
    }

    const userExists = await findUserByEmail(email);

    if (userExists) {
      console.log('[AUTH] Register failed: user already exists', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
        error: {},
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    console.log('[AUTH] Password hashed with bcrypt for new user');

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
      await pool.query(
        'INSERT INTO rewards (user_id, points_balance, total_earned) VALUES ($1, 50, 50) ON CONFLICT (user_id) DO NOTHING',
        [user.id]
      );
      await pool.query(
        'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
        [user.id, 'Welcome to Foodiq!', 'Thanks for joining. Explore restaurants and place your first order.']
      );

      const token = generateToken(user.id);
      console.log('[AUTH] Register successful, JWT generated for user', user.id);

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
    console.error('[AUTH] Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error during registration',
      error: error.message,
    });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    console.log('[AUTH] Login request received');

    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      console.log('[AUTH] Login failed: missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please include email and password',
        error: {},
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      console.log('[AUTH] Login failed: user not found for email', email);
      return res.status(401).json({
        success: false,
        message: 'No account found for this email address.',
        error: {},
      });
    }

    console.log('[AUTH] User found:', user.id, user.email);

    if (!user.password_hash || !user.password_hash.startsWith('$2')) {
      console.log('[AUTH] Login failed: invalid password hash stored for user', user.id);
      return res.status(401).json({
        success: false,
        message: 'Account password is invalid. Please reset your password or contact support.',
        error: {},
      });
    }

    const passwordMatched = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatched) {
      console.log('[AUTH] Login failed: password did not match for user', user.id);
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
        error: {},
      });
    }

    console.log('[AUTH] Password matched for user', user.id);

    const token = generateToken(user.id);
    console.log('[AUTH] JWT generated for user', user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error during login',
      error: error.message,
    });
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
    res.status(500).json({
      success: false,
      message: 'Server Error retrieving profile',
      error: error.message,
    });
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
    res.status(500).json({
      success: false,
      message: 'Server Error updating profile',
      error: error.message,
    });
  }
};

// @desc    Request password reset (demo: always succeeds if email exists)
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
      return res.status(404).json({
        success: false,
        message: 'No account found for this email address.',
        error: {},
      });
    }

    res.json({
      success: true,
      message: 'Password reset instructions sent. Use reset code FOODIQ to set a new password.',
      data: { email },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error during password reset request',
      error: error.message,
    });
  }
};

// @desc    Reset password with demo code FOODIQ
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const resetCode = String(req.body.reset_code || req.body.code || '').trim().toUpperCase();
    const newPassword = req.body.new_password || req.body.password;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code, and new password are required',
        error: {},
      });
    }

    if (resetCode !== 'FOODIQ') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code. Use FOODIQ for demo reset.',
        error: {},
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        error: {},
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found for this email address.',
        error: {},
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await updateUserPassword(user.id, password_hash);

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error during password reset',
      error: error.message,
    });
  }
};

// @desc    Logout user / clear token
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove token on the client.',
    data: {},
  });
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  forgotPassword,
  resetPassword,
};
