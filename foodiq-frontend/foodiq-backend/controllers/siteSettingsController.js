const { ok, fail } = require('../utils/respond');
const { getSettings } = require('../models/adminModel');

const PUBLIC_KEYS = [
  'app_name',
  'company_name',
  'logo_url',
  'support_email',
  'support_phone',
  'whatsapp_number',
  'office_address',
  'google_maps_embed_url',
  'business_hours',
  'website_url',
  'facebook_url',
  'instagram_url',
  'twitter_url',
  'linkedin_url',
  'youtube_url',
  'theme_color',
  'footer_content',
  'privacy_policy_text',
  'terms_of_service_text',
  'delivery_charge',
  'free_delivery_min',
  'tax_percent',
];

const getPublicSiteSettings = async (_req, res) => {
  try {
    const settings = await getSettings();
    const data = {};
    PUBLIC_KEYS.forEach((key) => {
      if (settings[key] !== undefined && settings[key] !== null) {
        data[key] = settings[key];
      }
    });
    if (!data.company_name) data.company_name = settings.app_name || 'Foodiq';
    if (!data.theme_color) data.theme_color = '#E23744';
    return ok(res, 'Site settings retrieved', data);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

module.exports = { getPublicSiteSettings };
