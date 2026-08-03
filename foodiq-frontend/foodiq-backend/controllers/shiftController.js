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
    return fail(res, err.status || 500, err.message || 'Failed to fetch shifts', err);
  }
};

/** GET /api/delivery/shifts/today */
const getTodayShift = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const result = await shiftService.getTodayShift(partnerId);
    return ok(res, 'Today shift fetched', result);
  } catch (err) {
    logger.error('[shiftController] getTodayShift error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch today shift', err);
  }
};

/** POST /api/delivery/check-in, POST /api/delivery/shifts/check-in */
const checkIn = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const { shift_id, lat, lng } = req.body;
    const result = await shiftService.checkInPartner(partnerId, { shift_id, lat, lng });
    return ok(res, 'Checked into shift successfully', result);
  } catch (err) {
    logger.error('[shiftController] checkIn error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Check-in failed', err);
  }
};

/** POST /api/delivery/check-out, POST /api/delivery/shifts/check-out */
const checkOut = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const { lat, lng } = req.body;
    const result = await shiftService.checkOutPartner(partnerId, { lat, lng });
    return ok(res, 'Checked out of shift successfully', { log: result });
  } catch (err) {
    logger.error('[shiftController] checkOut error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Check-out failed', err);
  }
};

/** POST /api/delivery/shifts/break/start */
const breakStart = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const brk = await shiftService.startBreak(partnerId);
    return ok(res, 'Break started', { break: brk });
  } catch (err) {
    logger.error('[shiftController] breakStart error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Failed to start break', err);
  }
};

/** POST /api/delivery/shifts/break/end */
const breakEnd = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const brk = await shiftService.endBreak(partnerId);
    return ok(res, 'Break ended', { break: brk });
  } catch (err) {
    logger.error('[shiftController] breakEnd error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Failed to end break', err);
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
    return fail(res, err.status || 500, err.message || 'Failed to fetch attendance', err);
  }
};

/** GET /api/delivery/shifts/history */
const getHistory = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const history = await shiftService.getPartnerHistory(partnerId, req.query);
    return ok(res, 'Shift history fetched successfully', history);
  } catch (err) {
    logger.error('[shiftController] getHistory error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch shift history', err);
  }
};

/** POST /api/admin/shifts */
const createAdminShift = async (req, res) => {
  try {
    const shift = await shiftService.createAdminShift(req.body);
    return ok(res, 'Shift created successfully', { shift }, 201);
  } catch (err) {
    logger.error('[shiftController] createAdminShift error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Failed to create shift', err);
  }
};

/** POST /api/admin/shifts/assign */
const assignAdminShift = async (req, res) => {
  try {
    const shift = await shiftService.assignShiftToPartner(req.body, req.user?.id);
    return ok(res, 'Shift assigned successfully', { shift }, 201);
  } catch (err) {
    logger.error('[shiftController] assignAdminShift error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Failed to assign shift', err);
  }
};

/** PATCH /api/admin/shifts/:id */
const updateAdminShift = async (req, res) => {
  try {
    const shift = await shiftService.updateAdminShift(req.params.id, req.body);
    return ok(res, 'Shift updated successfully', { shift });
  } catch (err) {
    logger.error('[shiftController] updateAdminShift error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Failed to update shift', err);
  }
};

/** DELETE /api/admin/shifts/:id */
const deleteAdminShift = async (req, res) => {
  try {
    const result = await shiftService.deleteAdminShift(req.params.id);
    return ok(res, 'Shift deleted successfully', result);
  } catch (err) {
    logger.error('[shiftController] deleteAdminShift error', { error: err.message });
    return fail(res, err.status || 400, err.message || 'Failed to delete shift', err);
  }
};

/** GET /api/admin/shifts */
const getAdminShifts = async (req, res) => {
  try {
    const result = await shiftService.getAdminShifts(req.query);
    return ok(res, 'Admin shifts fetched', result);
  } catch (err) {
    logger.error('[shiftController] getAdminShifts error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch admin shifts', err);
  }
};

/** GET /api/admin/shifts/partner/:partnerId/attendance */
const getAdminPartnerAttendance = async (req, res) => {
  try {
    const attendance = await shiftService.getPartnerAttendance(req.params.partnerId, req.query);
    return ok(res, 'Partner attendance fetched', attendance);
  } catch (err) {
    logger.error('[shiftController] getAdminPartnerAttendance error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch partner attendance', err);
  }
};

module.exports = {
  getShifts,
  getTodayShift,
  checkIn,
  checkOut,
  breakStart,
  breakEnd,
  getAttendance,
  getHistory,
  createAdminShift,
  assignAdminShift,
  updateAdminShift,
  deleteAdminShift,
  getAdminShifts,
  getAdminPartnerAttendance,
};
