const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { getJwtSecret, VERIFY_OPTS } = require('../utils/generateToken');
const { log } = require('../utils/logger');

const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

/**
 * Authentication middleware strictly for Delivery Partners.
 * Validates JWT access token and ensures partner exists in delivery_partners table.
 */
const protectDelivery = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.delivery_token) {
      token = req.cookies.delivery_token;
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.cookies && req.cookies.foodiq_session) {
      token = req.cookies.foodiq_session;
    }

    if (!token) {
      return fail(res, 401, 'Authentication token missing. Please log in as a delivery partner.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret(), VERIFY_OPTS);
    } catch (jwtErr) {
      log.warn('[deliveryAuth] Invalid token', { error: jwtErr.message, path: req.originalUrl });
      return fail(res, 401, 'Invalid or expired delivery partner session.');
    }

    const partnerId = decoded.id;
    if (!partnerId) {
      return fail(res, 401, 'Invalid token payload.');
    }

    const { rows } = await pool.query(
      `SELECT id, user_id, full_name, email, phone_number, vehicle_type, vehicle_number,
              driving_license_number, aadhaar_number, profile_photo, city, state,
              address, is_verified, is_online, status, rating, wallet_balance,
              created_at, updated_at
       FROM delivery_partners
       WHERE id = $1 OR user_id = $1`,
      [partnerId]
    );

    const partner = rows[0];

    if (!partner) {
      log.warn('[deliveryAuth] Partner not found in delivery_partners table', { partnerId });
      return fail(res, 401, 'Delivery partner profile not found.');
    }

    if (partner.status === 'suspended') {
      log.warn('[deliveryAuth] Suspended partner attempt', { partnerId });
      return fail(res, 403, 'Your delivery partner account has been suspended.');
    }

    // Attach partner info to request
    req.deliveryPartner = partner;
    req.user = {
      id: partner.id,
      full_name: partner.full_name,
      email: partner.email,
      phone_number: partner.phone_number,
      role: 'delivery_partner',
      is_online: partner.is_online,
      is_verified: partner.is_verified,
      status: partner.status,
    };

    next();
  } catch (error) {
    log.error('[deliveryAuth] Middleware error', { error: error.message, stack: error.stack });
    return fail(res, 500, 'Server error during authentication.', error.message);
  }
};

module.exports = {
  protectDelivery,
};
