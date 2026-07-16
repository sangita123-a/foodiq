const {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress
} = require('../models/addressModel');

const getAll = async (req, res) => {
  try {
    const addresses = await getAddresses(req.user.id);
    res.json({ success: true, message: 'Addresses retrieved', data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const normalizeAddressBody = (body = {}) => ({
  full_name: body.full_name || body.name || null,
  phone_number: body.phone_number || body.phone || null,
  house_no: body.house_no || body.address_line1 || body.flat || null,
  street: body.street || body.address_line2 || null,
  landmark: body.landmark || null,
  city: body.city,
  state: body.state,
  zip_code: body.zip_code || body.pincode || body.zip || null,
  address_type: body.address_type || body.type || 'Home',
  is_default: body.is_default ?? body.isDefault ?? false,
});

const create = async (req, res) => {
  try {
    const payload = normalizeAddressBody(req.body);
    const { street, city, state, zip_code } = payload;
    if (!street || !city || !state || !zip_code) {
      return res.status(400).json({ success: false, message: 'Street, city, state, and zip_code are required', error: {} });
    }

    const newAddress = await createAddress(req.user.id, payload);
    res.status(201).json({ success: true, message: 'Address created', data: newAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await getAddressById(id, req.user.id);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found', error: {} });

    const payload = normalizeAddressBody({ ...address, ...req.body });
    const updatedAddress = await updateAddress(id, req.user.id, payload);
    res.json({ success: true, message: 'Address updated', data: updatedAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await getAddressById(id, req.user.id);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found', error: {} });

    await deleteAddress(id, req.user.id);
    res.json({ success: true, message: 'Address deleted', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, create, update, remove };
