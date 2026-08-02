const { pool } = require('../config/db');
const {
  emitShiftStart,
  emitShiftEnd,
  emitShiftLate,
  emitAttendanceUpdate,
  emitDeliveryNotification,
} = require('../socket/emitters');
const logger = require('../utils/logger');

const LATE_GRACE_PERIOD_MINUTES = parseInt(process.env.SHIFT_GRACE_PERIOD_MINS || '15', 10);

const getDayAbbreviation = (date = new Date()) => {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const getCurrentTimeMinutes = (date = new Date()) => {
  return date.getHours() * 60 + date.getMinutes();
};

/**
 * Fetch shifts assigned to a partner.
 */
const getPartnerShifts = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_shifts
     WHERE partner_id = $1 AND status != 'cancelled'
     ORDER BY created_at DESC`,
    [partnerId]
  );
  return rows;
};

/**
 * Fetch today's shift for partner.
 */
const getTodayShift = async (partnerId) => {
  const todayDay = getDayAbbreviation();
  const { rows } = await pool.query(
    `SELECT * FROM delivery_shifts
     WHERE partner_id = $1
       AND status IN ('scheduled', 'active')
       AND working_days @> $2::jsonb
     ORDER BY created_at DESC
     LIMIT 1`,
    [partnerId, JSON.stringify([todayDay])]
  );
  
  if (rows.length > 0) {
    return rows[0];
  }

  // Fallback to most recent scheduled shift
  const fallback = await pool.query(
    `SELECT * FROM delivery_shifts
     WHERE partner_id = $1 AND status IN ('scheduled', 'active')
     ORDER BY created_at DESC
     LIMIT 1`,
    [partnerId]
  );
  return fallback.rows[0] || null;
};

/**
 * Check-in partner into a shift.
 */
const checkInPartner = async (partnerId, { shift_id, lat, lng }) => {
  // 1. Prevent multiple active shifts
  const activeLog = await pool.query(
    `SELECT * FROM delivery_shift_logs
     WHERE partner_id = $1 AND check_out IS NULL
     LIMIT 1`,
    [partnerId]
  );
  if (activeLog.rows.length > 0) {
    const err = new Error('You already have an active checked-in shift. Please check out first.');
    err.status = 400;
    throw err;
  }

  // 2. Validate shift
  let shift;
  if (shift_id) {
    const sRes = await pool.query(
      `SELECT * FROM delivery_shifts WHERE id = $1 AND partner_id = $2`,
      [shift_id, partnerId]
    );
    shift = sRes.rows[0];
  } else {
    shift = await getTodayShift(partnerId);
  }

  if (!shift) {
    const err = new Error('No scheduled shift found for check-in.');
    err.status = 404;
    throw err;
  }

  // 3. Calculate late minutes
  const now = new Date();
  const shiftStartMins = parseTimeToMinutes(shift.start_time);
  const currentMins = getCurrentTimeMinutes(now);
  const diffMins = currentMins - shiftStartMins;
  
  let lateMinutes = 0;
  if (diffMins > LATE_GRACE_PERIOD_MINUTES) {
    lateMinutes = diffMins;
  }

  // 4. Create shift log
  const { rows } = await pool.query(
    `INSERT INTO delivery_shift_logs (
      shift_id, partner_id, check_in, late_minutes, gps_latitude, gps_longitude
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [shift.id, partnerId, now, lateMinutes, lat ? Number(lat) : null, lng ? Number(lng) : null]
  );
  const logEntry = rows[0];

  // 5. Update shift status to active
  await pool.query(
    `UPDATE delivery_shifts SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [shift.id]
  );

  // 6. Real-time events & notifications
  emitShiftStart({ shift_id: shift.id, partner_id: partnerId, check_in: now.toISOString() });
  if (lateMinutes > 0) {
    emitShiftLate({ shift_id: shift.id, partner_id: partnerId, late_minutes: lateMinutes });
  }
  emitAttendanceUpdate({ partner_id: partnerId, action: 'check_in', status: 'working' });

  // In-app notification
  emitDeliveryNotification(partnerId, {
    type: 'shift_started',
    title: lateMinutes > 0 ? 'Shift Started (Late)' : 'Shift Started',
    message: lateMinutes > 0
      ? `Checked into shift "${shift.shift_name}" (${lateMinutes} mins late).`
      : `Successfully checked into shift "${shift.shift_name}". Have a safe delivery run!`,
    created_at: now.toISOString(),
  });

  return {
    log: logEntry,
    shift,
  };
};

/**
 * Check-out partner from active shift.
 */
const checkOutPartner = async (partnerId, { lat, lng } = {}) => {
  const activeRes = await pool.query(
    `SELECT * FROM delivery_shift_logs
     WHERE partner_id = $1 AND check_out IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [partnerId]
  );

  if (activeRes.rows.length === 0) {
    const err = new Error('No active shift check-in found.');
    err.status = 404;
    throw err;
  }

  const logEntry = activeRes.rows[0];
  const checkOutTime = new Date();
  const checkInTime = new Date(logEntry.check_in);
  
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  const totalHours = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));

  // Check early checkout
  let earlyCheckout = false;
  if (logEntry.shift_id) {
    const sRes = await pool.query(`SELECT * FROM delivery_shifts WHERE id = $1`, [logEntry.shift_id]);
    const shift = sRes.rows[0];
    if (shift && shift.end_time) {
      const shiftEndMins = parseTimeToMinutes(shift.end_time);
      const currentMins = getCurrentTimeMinutes(checkOutTime);
      if (currentMins < shiftEndMins - 10) {
        earlyCheckout = true;
      }
    }
  }

  // Update log entry
  const { rows } = await pool.query(
    `UPDATE delivery_shift_logs
     SET check_out = $1, total_hours = $2, early_checkout = $3
     WHERE id = $4
     RETURNING *`,
    [checkOutTime, totalHours, earlyCheckout, logEntry.id]
  );
  const updatedLog = rows[0];

  // Update shift status if shift exists
  if (logEntry.shift_id) {
    await pool.query(
      `UPDATE delivery_shifts SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [logEntry.shift_id]
    );
  }

  // Emit Socket events
  emitShiftEnd({
    shift_id: logEntry.shift_id,
    partner_id: partnerId,
    check_out: checkOutTime.toISOString(),
    total_hours: totalHours,
  });
  emitAttendanceUpdate({ partner_id: partnerId, action: 'check_out', status: 'completed' });

  // In-app notification
  emitDeliveryNotification(partnerId, {
    type: 'shift_completed',
    title: 'Shift Completed',
    message: `Shift check-out recorded. Total working hours: ${totalHours} hrs.`,
    created_at: checkOutTime.toISOString(),
  });

  return updatedLog;
};

/**
 * Fetch attendance summary and history logs for partner.
 */
const getPartnerAttendance = async (partnerId, options = {}) => {
  const limit = Math.min(100, Math.max(1, parseInt(options.limit || '30', 10)));

  const logsRes = await pool.query(
    `SELECT sl.*, s.shift_name, s.start_time, s.end_time
     FROM delivery_shift_logs sl
     LEFT JOIN delivery_shifts s ON s.id = sl.shift_id
     WHERE sl.partner_id = $1
     ORDER BY sl.created_at DESC
     LIMIT $2`,
    [partnerId, limit]
  );

  const statsRes = await pool.query(
    `SELECT
       COALESCE(SUM(total_hours), 0) AS total_working_hours,
       COUNT(id) AS total_check_ins,
       COUNT(CASE WHEN late_minutes > 0 THEN 1 END) AS late_days,
       COUNT(CASE WHEN early_checkout = TRUE THEN 1 END) AS early_checkouts
     FROM delivery_shift_logs
     WHERE partner_id = $1`,
    [partnerId]
  );

  const totalShiftsRes = await pool.query(
    `SELECT COUNT(id) AS scheduled_count FROM delivery_shifts WHERE partner_id = $1`,
    [partnerId]
  );

  const stats = statsRes.rows[0] || {};
  const scheduledCount = parseInt(totalShiftsRes.rows[0]?.scheduled_count || '0', 10);
  const checkInsCount = parseInt(stats.total_check_ins || '0', 10);

  const attendancePct = scheduledCount > 0
    ? Math.min(100, Math.round((checkInsCount / scheduledCount) * 100))
    : checkInsCount > 0 ? 100 : 0;

  const totalWorkingHours = Number(stats.total_working_hours || 0);
  const expectedHours = scheduledCount * 8;
  const overtimeHours = Math.max(0, Number((totalWorkingHours - expectedHours).toFixed(2)));
  const missedShifts = Math.max(0, scheduledCount - checkInsCount);

  return {
    stats: {
      working_hours: totalWorkingHours,
      total_check_ins: checkInsCount,
      scheduled_shifts: scheduledCount,
      attendance_percentage: attendancePct,
      late_days: parseInt(stats.late_days || '0', 10),
      early_checkouts: parseInt(stats.early_checkouts || '0', 10),
      overtime_hours: overtimeHours,
      missed_shifts: missedShifts,
    },
    logs: logsRes.rows,
  };
};

/**
 * Check if partner is actively checked into a shift right now.
 */
const hasActiveShiftCheckIn = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT id FROM delivery_shift_logs WHERE partner_id = $1 AND check_out IS NULL LIMIT 1`,
    [partnerId]
  );
  return rows.length > 0;
};

/**
 * Admin APIs for shift management.
 */
const createAdminShift = async (data) => {
  const {
    partner_id,
    shift_name = 'Standard Shift',
    start_time = '09:00',
    end_time = '17:00',
    working_days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    is_recurring = true,
    timezone = 'Asia/Kolkata',
  } = data;

  if (!partner_id) {
    const err = new Error('Delivery Partner ID is required.');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO delivery_shifts (
      partner_id, shift_name, start_time, end_time, working_days, is_recurring, timezone, status
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, 'scheduled')
    RETURNING *`,
    [partner_id, shift_name, start_time, end_time, JSON.stringify(working_days), is_recurring, timezone]
  );

  const shift = rows[0];

  // Notify partner
  emitDeliveryNotification(partner_id, {
    type: 'shift_assigned',
    title: 'New Shift Scheduled',
    message: `You have been assigned shift "${shift_name}" (${start_time} - ${end_time}).`,
    created_at: new Date().toISOString(),
  });

  return shift;
};

const updateAdminShift = async (id, data) => {
  const { shift_name, start_time, end_time, working_days, status, is_recurring, timezone } = data;

  const { rows } = await pool.query(
    `UPDATE delivery_shifts
     SET shift_name = COALESCE($1, shift_name),
         start_time = COALESCE($2, start_time),
         end_time = COALESCE($3, end_time),
         working_days = COALESCE($4::jsonb, working_days),
         status = COALESCE($5, status),
         is_recurring = COALESCE($6, is_recurring),
         timezone = COALESCE($7, timezone),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING *`,
    [
      shift_name,
      start_time,
      end_time,
      working_days ? JSON.stringify(working_days) : null,
      status,
      is_recurring,
      timezone,
      id,
    ]
  );

  if (rows.length === 0) {
    const err = new Error('Shift not found');
    err.status = 404;
    throw err;
  }

  return rows[0];
};

const deleteAdminShift = async (id) => {
  const { rows } = await pool.query(`DELETE FROM delivery_shifts WHERE id = $1 RETURNING id`, [id]);
  if (rows.length === 0) {
    const err = new Error('Shift not found');
    err.status = 404;
    throw err;
  }
  return { success: true, deleted_id: id };
};

const getAdminShifts = async (query = {}) => {
  const { status, partner_id } = query;

  let whereClauses = ['1=1'];
  const params = [];

  if (status) {
    params.push(status);
    whereClauses.push(`s.status = $${params.length}`);
  }
  if (partner_id) {
    params.push(partner_id);
    whereClauses.push(`s.partner_id = $${params.length}`);
  }

  const shiftsRes = await pool.query(
    `SELECT s.*, dp.full_name AS partner_name, dp.email AS partner_email, dp.phone_number AS partner_phone
     FROM delivery_shifts s
     JOIN delivery_partners dp ON dp.id = s.partner_id
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY s.created_at DESC`,
    params
  );

  // Calculate Dashboard KPIs
  const activeRidersRes = await pool.query(
    `SELECT COUNT(DISTINCT partner_id)::int AS count FROM delivery_shift_logs WHERE check_out IS NULL`
  );
  const lateRidersRes = await pool.query(
    `SELECT COUNT(DISTINCT partner_id)::int AS count FROM delivery_shift_logs WHERE DATE(check_in) = CURRENT_DATE AND late_minutes > 0`
  );
  const totalRidersRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM delivery_partners WHERE approval_status = 'approved'`
  );
  const avgHoursRes = await pool.query(
    `SELECT COALESCE(AVG(total_hours), 0)::numeric(4,2) AS avg_hours FROM delivery_shift_logs WHERE check_out IS NOT NULL`
  );

  const activeRiders = activeRidersRes.rows[0]?.count || 0;
  const lateRiders = lateRidersRes.rows[0]?.count || 0;
  const totalRiders = totalRidersRes.rows[0]?.count || 1;
  const absentRiders = Math.max(0, totalRiders - activeRiders);
  const avgHours = Number(avgHoursRes.rows[0]?.avg_hours || 0);

  return {
    shifts: shiftsRes.rows,
    summary: {
      active_riders: activeRiders,
      working_riders: activeRiders,
      absent_riders: absentRiders,
      late_riders: lateRiders,
      avg_working_hours: avgHours,
      shift_utilization: Math.min(100, Math.round((activeRiders / totalRiders) * 100)),
    },
  };
};

module.exports = {
  getPartnerShifts,
  getTodayShift,
  checkInPartner,
  checkOutPartner,
  getPartnerAttendance,
  hasActiveShiftCheckIn,
  createAdminShift,
  updateAdminShift,
  deleteAdminShift,
  getAdminShifts,
};
