const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  return password && password.length >= 8;
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
