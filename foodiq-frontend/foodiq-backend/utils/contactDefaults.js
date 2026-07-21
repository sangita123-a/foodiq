const DEFAULT_CONTACT_INFO = {
  office_address: '123 Culinary Avenue, Tech Park, Hyderabad, India 500081',
  phone_number: '+91 1800 123 4567',
  email: 'support@foodiq.com',
  business_hours: 'Mon - Sun: 24/7 Support',
  website: 'https://foodiq.com',
  whatsapp_number: '+91 9876543210',
};

function mergeContactDefaults(partial) {
  const merged = { ...DEFAULT_CONTACT_INFO };
  if (!partial) return merged;

  Object.keys(DEFAULT_CONTACT_INFO).forEach((key) => {
    const value = partial[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      merged[key] = String(value).trim();
    }
  });

  return merged;
}

module.exports = {
  DEFAULT_CONTACT_INFO,
  mergeContactDefaults,
};
