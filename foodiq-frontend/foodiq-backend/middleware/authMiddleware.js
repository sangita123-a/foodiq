const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/userModel');
const { getJwtSecret } = require('../utils/generateToken');
const cache = require('../services/cacheService');

const SESSION_TTL = Number(process.env.CACHE_TTL_SESSION || 30);

const resolveUser = async (userId) => {
  const key = cache.cacheKey('session:user', { id: userId });
  const { data } = await cache.wrap(key, SESSION_TTL, () => findUserById(userId));
  return data;
};

/** Drop cached user row (call after profile/role changes). */
const invalidateUserSession = async (userId) => {
  if (!userId) return;
  await cache.del(cache.cacheKey('session:user', { id: userId }));
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
      error: {},
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = await resolveUser(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
        error: {},
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
      error: error.message,
    });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized for this resource',
      error: {},
    });
  }
  next();
};

module.exports = { protect, authorize, invalidateUserSession, resolveUser };
