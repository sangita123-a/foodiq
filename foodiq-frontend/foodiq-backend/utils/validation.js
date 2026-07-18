const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  if (!password || password.length < 8) return false;
  // Require at least one letter and one number in production-hardened mode
  if (String(process.env.STRICT_PASSWORD_POLICY || 'true').toLowerCase() === 'true') {
    return /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  }
  return true;
};

const isValidPhone = (phone) => {
  // Simple check for phone length and mostly digits
  const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
  return phoneRegex.test(phone);
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPhone,
};
