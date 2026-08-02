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
      `SELECT dp.id, dp.user_id,
              COALESCE(dp.full_name, u.full_name) AS full_name,
              COALESCE(dp.email, u.email) AS email,
              COALESCE(dp.phone_number, u.phone_number) AS phone_number,
              dp.vehicle_type, dp.vehicle_number,
              COALESCE(dp.driving_license_number, dp.license_number) AS driving_license_number,
              dp.aadhaar_number, dp.profile_photo, dp.city, dp.state, dp.address,
              COALESCE(dp.is_verified, FALSE) AS is_verified,
              COALESCE(dp.is_online, dp.is_available, FALSE) AS is_online,
              COALESCE(dp.is_available, dp.is_online, FALSE) AS is_available,
              COALESCE(dp.status, dp.approval_status, 'pending') AS status,
              COALESCE(dp.approval_status, dp.status, 'approved') AS approval_status,
              dp.rating, dp.wallet_balance, dp.created_at, dp.updated_at
       FROM delivery_partners dp
       LEFT JOIN users u ON u.id = dp.user_id
       WHERE dp.id = $1 OR dp.user_id = $1`,
      [partnerId]
    );

    const partner = rows[0];

    if (!partner) {
      log.warn('[deliveryAuth] Partner not found in delivery_partners table', { partnerId });
      return fail(res, 401, 'Delivery partner profile not found.');
    }

    const partnerStatus = (partner.status || partner.approval_status || '').toLowerCase();
    if (partnerStatus === 'suspended') {
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
