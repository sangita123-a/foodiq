const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret'
      );

      // Get user from the token
      req.user = await findUserById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
          error: {}
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: error.message
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
      error: {}
    });
  }
};

module.exports = { protect };
