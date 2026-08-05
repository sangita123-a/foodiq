const { EMAIL_RE, PHONE_RE, isValidWebsite, normalizeWebsite } = require('../utils/validateContactInfo');

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const STRING_FIELDS = {
  app_name: 150,
  company_name: 150,
  office_address: 1000,
  business_hours: 500,
  footer_content: 5000,
  privacy_policy_text: 50000,
  terms_of_service_text: 50000,
};

const URL_FIELDS = [
  'website_url',
  'logo_url',
  'google_maps_embed_url',
  'facebook_url',
  'instagram_url',
  'twitter_url',
  'linkedin_url',
  'youtube_url',
];

const PERCENT_FIELDS = ['tax_percent', 'commission_percent'];
const NON_NEGATIVE_NUMBER_FIELDS = ['delivery_charge', 'free_delivery_min'];
const BOOLEAN_FIELDS = [
  'payment_cod_enabled',
  'payment_upi_enabled',
  'payment_card_enabled',
  'payment_razorpay_enabled',
];

/**
 * Validates PUT /api/admin/settings payloads. Only keys present in `body`
 * are validated/returned — preserves the COALESCE partial-update semantics
 * of adminModel.updateSettings, so callers (Settings page or the consolidated
 * Contact tab) can send a subset of fields.
 */
function validateAdminSettings(body = {}) {
  const errors = [];
  const data = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  for (const [field, maxLength] of Object.entries(STRING_FIELDS)) {
    if (!has(field)) continue;
    const value = String(body[field] ?? '').trim();
    if (value.length > maxLength) {
      errors.push(`${field} must be ${maxLength} characters or fewer`);
      continue;
    }
    data[field] = value;
  }

  if (has('support_email')) {
    const value = String(body.support_email || '').trim();
    if (value && !EMAIL_RE.test(value)) errors.push('Support email format is invalid');
    else data.support_email = value;
  }

  for (const field of ['support_phone', 'whatsapp_number']) {
    if (!has(field)) continue;
    const value = String(body[field] || '').trim();
    if (value && !PHONE_RE.test(value)) errors.push(`${field.replace('_', ' ')} format is invalid`);
    else data[field] = value;
  }

  for (const field of URL_FIELDS) {
    if (!has(field)) continue;
    const value = String(body[field] || '').trim();
    if (!value) {
      data[field] = ''; // allow clearing optional URL fields
      continue;
    }
    if (!isValidWebsite(value)) {
      errors.push(`${field} must be a valid URL`);
      continue;
    }
    data[field] = field === 'website_url' ? normalizeWebsite(value) : value;
  }

  if (has('theme_color')) {
    const value = String(body.theme_color || '').trim();
    if (!HEX_COLOR_RE.test(value)) errors.push('theme_color must be a hex color, e.g. #E23744');
    else data.theme_color = value;
  }

  for (const field of NON_NEGATIVE_NUMBER_FIELDS) {
    if (!has(field)) continue;
    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < 0) errors.push(`${field} must be a number ≥ 0`);
    else data[field] = value;
  }

  for (const field of PERCENT_FIELDS) {
    if (!has(field)) continue;
    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      errors.push(`${field} must be a number between 0 and 100`);
    } else {
      data[field] = value;
    }
  }

  for (const field of BOOLEAN_FIELDS) {
    if (!has(field)) continue;
    if (typeof body[field] !== 'boolean') errors.push(`${field} must be true or false`);
    else data[field] = body[field];
  }

  return { valid: errors.length === 0, errors, data };
}

module.exports = { validateAdminSettings };
