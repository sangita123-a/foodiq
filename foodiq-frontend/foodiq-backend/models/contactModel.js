const { getSettings, updateSettings } = require('./adminModel');
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

const updateContactInfo = async (data) => {
  await updateSettings({
    office_address: data.office_address,
    support_phone: data.phone_number,
    support_email: data.email,
    business_hours: data.business_hours,
    website_url: data.website,
    whatsapp_number: data.whatsapp_number,
  });
  return getContactInfo();
};

module.exports = {
  getContactInfo,
  updateContactInfo,
};
