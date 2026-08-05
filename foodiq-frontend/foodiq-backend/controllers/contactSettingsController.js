const { ok, fail } = require('../utils/respond');
const contactModel = require('../models/contactModel');

const getPublicContactInfo = async (_req, res) => {
  try {
    const data = await contactModel.getContactInfo();
    return ok(res, 'Contact information retrieved', data);
  } catch (error) {
    return fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getPublicContactInfo,
};
