const shiftService = require('../services/shiftService');
const { ok, fail } = require('../utils/respond');
const logger = require('../utils/logger');

/** GET /api/delivery/shifts */
const getShifts = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const shifts = await shiftService.getPartnerShifts(partnerId);
    return ok(res, 'Shifts fetched successfully', { shifts });
  } catch (err) {
    logger.error('[shiftController] getShifts error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch shifts');
  }
};

/** GET /api/delivery/shifts/today */
const getTodayShift = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const shift = await shiftService.getTodayShift(partnerId);
    return ok(res, 'Today shift fetched', { shift });
  } catch (err) {
    logger.error('[shiftController] getTodayShift error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch today shift');
  }
};

/** POST /api/delivery/check-in */
const checkIn = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const { shift_id, lat, lng } = req.body;
    const result = await shiftService.checkInPartner(partnerId, { shift_id, lat, lng });
    return ok(res, 'Checked into shift successfully', result);
  } catch (err) {
    logger.error('[shiftController] checkIn error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Check-in failed');
  }
};

/** POST /api/delivery/check-out */
const checkOut = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const { lat, lng } = req.body;
    const result = await shiftService.checkOutPartner(partnerId, { lat, lng });
    return ok(res, 'Checked out of shift successfully', { log: result });
  } catch (err) {
    logger.error('[shiftController] checkOut error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Check-out failed');
  }
};

/** GET /api/delivery/attendance */
const getAttendance = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const attendance = await shiftService.getPartnerAttendance(partnerId, req.query);
    return ok(res, 'Attendance fetched successfully', attendance);
  } catch (err) {
    logger.error('[shiftController] getAttendance error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch attendance');
  }
};

/** POST /api/admin/shifts */
const createAdminShift = async (req, res) => {
  try {
    const shift = await shiftService.createAdminShift(req.body);
    return ok(res, 'Shift assigned successfully', { shift }, 201);
  } catch (err) {
    logger.error('[shiftController] createAdminShift error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Failed to create shift');
  }
};

/** PATCH /api/admin/shifts/:id */
const updateAdminShift = async (req, res) => {
  try {
    const shift = await shiftService.updateAdminShift(req.params.id, req.body);
    return ok(res, 'Shift updated successfully', { shift });
  } catch (err) {
    logger.error('[shiftController] updateAdminShift error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Failed to update shift');
  }
};

/** DELETE /api/admin/shifts/:id */
const deleteAdminShift = async (req, res) => {
  try {
    const result = await shiftService.deleteAdminShift(req.params.id);
    return ok(res, 'Shift deleted successfully', result);
  } catch (err) {
    logger.error('[shiftController] deleteAdminShift error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Failed to delete shift');
  }
};

/** GET /api/admin/shifts */
const getAdminShifts = async (req, res) => {
  try {
    const result = await shiftService.getAdminShifts(req.query);
    return ok(res, 'Admin shifts fetched', result);
  } catch (err) {
    logger.error('[shiftController] getAdminShifts error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch admin shifts');
  }
};

module.exports = {
  getShifts,
  getTodayShift,
  checkIn,
  checkOut,
  getAttendance,
  createAdminShift,
  updateAdminShift,
  deleteAdminShift,
  getAdminShifts,
};
