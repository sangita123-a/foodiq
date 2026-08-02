const { isValidEmail, isValidPassword, isValidPhone } = require('../utils/validation');
const { log } = require('../utils/logger');

const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const validateRegister = (req, res, next) => {
  const body = req.body || {};

  const full_name = String(body.full_name || body.fullName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone_number = String(body.phone_number || body.phoneNumber || body.phone || '').trim();
  const password = body.password;
  const confirm_password = body.confirm_password || body.confirmPassword;
  const vehicle_type = String(body.vehicle_type || body.vehicleType || '').trim();
  const vehicle_number = String(body.vehicle_number || body.vehicleNumber || '').trim();
  const driving_license_number = String(body.driving_license_number || body.drivingLicenseNumber || body.license_number || '').trim();
  const aadhaar_number = String(body.aadhaar_number || body.aadhaarNumber || '').trim();
  const state = String(body.state || '').trim();
  const city = String(body.city || '').trim();
  const address = String(body.address || '').trim();

  // 1. Required fields validation
  if (!full_name) return fail(res, 400, 'Full name is required');
  if (!email) return fail(res, 400, 'Email address is required');
  if (!phone_number) return fail(res, 400, 'Phone number is required');
  if (!password) return fail(res, 400, 'Password is required');
  if (!confirm_password) return fail(res, 400, 'Confirm password is required');
  if (!vehicle_type) return fail(res, 400, 'Vehicle type is required');
  if (!vehicle_number) return fail(res, 400, 'Vehicle number is required');
  if (!driving_license_number) return fail(res, 400, 'Driving license number is required');
  if (!aadhaar_number) return fail(res, 400, 'Aadhaar number is required');
  if (!state) return fail(res, 400, 'State is required');
  if (!city) return fail(res, 400, 'City is required');
  if (!address) return fail(res, 400, 'Address is required');

  // 2. Email format
  if (!isValidEmail(email)) {
    return fail(res, 400, 'A valid email address is required');
  }

  // 3. Phone format
  if (!isValidPhone(phone_number)) {
    return fail(res, 400, 'A valid phone number is required');
  }

  // 4. Confirm password match
  if (password !== confirm_password) {
    return fail(res, 400, 'Passwords do not match');
  }

  // 5. Password strength
  if (!isValidPassword(password)) {
    return fail(res, 400, 'Password must be at least 8 characters');
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const userEmail = String(email || '').trim().toLowerCase();

  if (!userEmail) {
    return fail(res, 400, 'Email is required');
  }
  if (!isValidEmail(userEmail)) {
    return fail(res, 400, 'A valid email address is required');
  }
  if (!password) {
    return fail(res, 400, 'Password is required');
  }

  next();
};

const validateSendOtp = (req, res, next) => {
  const { destination, phone, email } = req.body || {};
  const dest = String(destination || phone || email || '').trim();

  if (!dest) {
    return fail(res, 400, 'Destination (email or phone) is required');
  }

  const isEmail = dest.includes('@');
  if (isEmail && !isValidEmail(dest)) {
    return fail(res, 400, 'Invalid email format');
  }
  if (!isEmail && !isValidPhone(dest)) {
    return fail(res, 400, 'Invalid phone number format');
  }

  next();
};

const validateVerifyOtp = (req, res, next) => {
  const { destination, phone, email, code, otp } = req.body || {};
  const dest = String(destination || phone || email || '').trim();
  const otpCode = String(code || otp || '').trim();

  if (!dest) {
    return fail(res, 400, 'Destination (email or phone) is required');
  }
  if (!otpCode) {
    return fail(res, 400, 'OTP code is required');
  }

  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body || {};
  const userEmail = String(email || '').trim().toLowerCase();

  if (!userEmail) {
    return fail(res, 400, 'Email is required');
  }
  if (!isValidEmail(userEmail)) {
    return fail(res, 400, 'A valid email address is required');
  }

  next();
};

const validateResetPassword = (req, res, next) => {
  const body = req.body || {};
  const userEmail = String(body.email || '').trim().toLowerCase();
  const otpCode = String(body.code || body.otp || '').trim();
  const newPass = body.new_password || body.newPassword || body.password;
  const confirmPass = body.confirm_password || body.confirmPassword;

  if (!userEmail) return fail(res, 400, 'Email is required');
  if (!isValidEmail(userEmail)) return fail(res, 400, 'A valid email address is required');
  if (!otpCode) return fail(res, 400, 'OTP code is required');
  if (!newPass) return fail(res, 400, 'New password is required');
  if (!confirmPass) return fail(res, 400, 'Confirm password is required');
  if (newPass !== confirmPass) return fail(res, 400, 'Passwords do not match');
  if (!isValidPassword(newPass)) return fail(res, 400, 'Password must be at least 8 characters');

  next();
};

const validateOnlineStatus = (req, res, next) => {
  const isOnline = req.body.is_online ?? req.body.online ?? req.body.is_available;
  if (isOnline === undefined || isOnline === null) {
    return fail(res, 400, 'is_online status (boolean) is required');
  }

  next();
};

const validateLocationUpdate = (req, res, next) => {
  const body = req.body || {};
  const latitude = Number(body.latitude ?? body.lat);
  const longitude = Number(body.longitude ?? body.lng);

  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    return fail(res, 400, 'A valid latitude is required');
  }
  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    return fail(res, 400, 'A valid longitude is required');
  }

  const optionalNumeric = ['accuracy', 'speed', 'heading'];
  for (const field of optionalNumeric) {
    if (body[field] != null && Number.isNaN(Number(body[field]))) {
      return fail(res, 400, `${field} must be a number`);
    }
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateSendOtp,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword,
  validateOnlineStatus,
  validateLocationUpdate,
};
