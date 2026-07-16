const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[AUTH] WARNING: JWT_SECRET is not set. Using fallback secret (not safe for production).');
    return 'fallback_secret';
  }
  return secret;
};

const generateToken = (id) => {
  const token = jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '30d',
  });
  return token;
};

module.exports = generateToken;
