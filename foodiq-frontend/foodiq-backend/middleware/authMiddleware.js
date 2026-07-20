const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/userModel');
const {
  getJwtSecret,
  VERIFY_OPTS,
  verifyAccessToken,
} = require('../utils/generateToken');
const cache = require('../services/cacheService');

const SESSION_TTL = Number(process.env.CACHE_TTL_SESSION || 30);

const resolveUser = async (userId) => {
  const key = cache.cacheKey('session:user', { id: userId });
  const { data } = await cache.wrap(key, SESSION_TTL, () => findUserById(userId));
  return data;
};

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
    const decoded = verifyAccessToken(token);
    req.user = await resolveUser(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
        error: {},
      });
    }

    if (req.user.is_deleted) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated',
        error: {},
      });
    }

    const tokenVersion = Number(decoded.tv ?? 1);
    const userVersion = Number(req.user.token_version ?? 1);
    if (tokenVersion !== userVersion) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please sign in again.',
        error: { code: 'TOKEN_REVOKED' },
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
      error: {},
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

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    req.user = await resolveUser(decoded.id);
    if (req.user?.is_deleted) {
      req.user = null;
    } else if (req.user) {
      const tokenVersion = Number(decoded.tv ?? 1);
      const userVersion = Number(req.user.token_version ?? 1);
      if (tokenVersion !== userVersion) {
        req.user = null;
      }
    }
  } catch {
    /* ignore */
  }
  return next();
};

module.exports = {
  protect,
  authorize,
  optionalProtect,
  invalidateUserSession,
  resolveUser,
};
