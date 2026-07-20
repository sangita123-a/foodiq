const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  if (!password || password.length < 8) return false;
  const strict = String(process.env.STRICT_PASSWORD_POLICY || 'true').toLowerCase() === 'true';
  if (!strict) return true;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return hasLower && hasUpper && hasDigit;
};

const getPasswordPolicyMessage = () =>
  'Password must be at least 8 characters and include uppercase, lowercase, and a number';

/** Server-side strength score 0–4 (no UI dependency). */
const getPasswordStrengthScore = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, score);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
  return phoneRegex.test(phone);
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  getPasswordPolicyMessage,
  getPasswordStrengthScore,
};
