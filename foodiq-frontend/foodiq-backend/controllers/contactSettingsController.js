const { ok, fail } = require('../utils/respond');
const contactModel = require('../models/contactModel');
const { validateContactInfo } = require('../utils/validateContactInfo');

const getPublicContactInfo = async (_req, res) => {
  try {
    const data = await contactModel.getContactInfo();
    return ok(res, 'Contact information retrieved', data);
  } catch (error) {
    return fail(res, 500, 'Server Error', error.message);
  }
};

const updateAdminContactInfo = async (req, res) => {
  try {
    const validation = validateContactInfo(req.body);
    if (!validation.valid) {
      return fail(res, 400, validation.errors[0], validation.errors);
    }

    const data = await contactModel.updateContactInfo(validation.data);
    return ok(res, 'Contact information updated', data);
  } catch (error) {
    return fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getPublicContactInfo,
  updateAdminContactInfo,
};
