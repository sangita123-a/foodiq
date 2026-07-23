/**
 * Indian mobile number helpers for Foodiq auth.
 */

function normalizeIndianMobile(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  return digits;
}

function isValidIndianMobile(phone) {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(phone));
}

function toE164Indian(phone) {
  return `+91${normalizeIndianMobile(phone)}`;
}

/** Variants to match legacy rows stored as 10-digit / 91… / +91… */
function phoneMatchVariants(phone) {
  const ten = normalizeIndianMobile(phone);
  if (!ten) return [];
  return [ten, `91${ten}`, `+91${ten}`, `0${ten}`];
}

module.exports = {
  normalizeIndianMobile,
  isValidIndianMobile,
  toE164Indian,
  phoneMatchVariants,
};
