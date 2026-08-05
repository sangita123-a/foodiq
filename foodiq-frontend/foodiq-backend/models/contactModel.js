const { getSettings } = require('./adminModel');
const { mergeContactDefaults } = require('../utils/contactDefaults');

const getContactInfo = async () => {
  const settings = await getSettings();
  return mergeContactDefaults({
    office_address: settings.office_address,
    phone_number: settings.support_phone,
    email: settings.support_email,
    business_hours: settings.business_hours,
    website: settings.website_url,
    whatsapp_number: settings.whatsapp_number,
  });
};

module.exports = {
  getContactInfo,
};
