const { pool } = require('../config/db');
const {
  emitShiftStart,
  emitShiftEnd,
  emitShiftLate,
  emitAttendanceUpdate,
  emitShiftAssigned,
  emitShiftUpdated,
  emitShiftBreakStart,
  emitShiftBreakEnd,
  emitDeliveryNotification,
} = require('../socket/emitters');
const logger = require('../utils/logger');

const LATE_GRACE_PERIOD_MINUTES = parseInt(process.env.SHIFT_GRACE_PERIOD_MINS || '15', 10);
const EARLY_CHECKIN_MINUTES = parseInt(process.env.SHIFT_EARLY_CHECKIN_MINS || '60', 10);
const MISSED_SHIFT_LOOKBACK_DAYS = parseInt(process.env.SHIFT_MISSED_LOOKBACK_DAYS || '30', 10);

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

const toDateStr = (date) => {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
};

/** Is `value` (minutes-of-day) within [start, end], allowing the range to wrap past midnight? */
const inMinuteRange = (value, start, end) => {
  if (start <= end) return value >= start && value <= end;
  return value >= start || value <= end;
};

/** Rider may check in from `EARLY_CHECKIN_MINUTES` before shift start through shift end. */
const isWithinCheckInWindow = (shift, now = new Date()) => {
  const startMins = parseTimeToMinutes(shift.start_time);
  const endMins = parseTimeToMinutes(shift.end_time);
  const nowMins = getCurrentTimeMinutes(now);
  const windowStart = ((startMins - EARLY_CHECKIN_MINUTES) % 1440 + 1440) % 1440;
  return inMinuteRange(nowMins, windowStart, endMins);
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
 * Fetch today's shift row for partner (no active-log/break enrichment).
 */
const getTodayShiftRow = async (partnerId) => {
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
 * Fetch today's shift plus the partner's currently active check-in/break (if any).
 */
const getTodayShift = async (partnerId) => {
  const shift = await getTodayShiftRow(partnerId);

  const activeLogRes = await pool.query(
    `SELECT * FROM delivery_shift_logs
     WHERE partner_id = $1 AND check_out IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [partnerId]
  );
  const activeLog = activeLogRes.rows[0] || null;

  let activeBreak = null;
  if (activeLog) {
    const brRes = await pool.query(
      `SELECT * FROM delivery_shift_breaks WHERE shift_log_id = $1 AND break_end IS NULL LIMIT 1`,
      [activeLog.id]
    );
    activeBreak = brRes.rows[0] || null;
  }

  return { shift, active_log: activeLog, active_break: activeBreak };
};

/**
 * Upsert today's attendance summary row when a check-in happens.
 */
const upsertAttendanceOnCheckIn = async (partnerId, shift, checkInTime, lateMinutes) => {
  const dateStr = toDateStr(checkInTime);
  const status = lateMinutes > 0 ? 'late' : 'present';
  await pool.query(
    `INSERT INTO delivery_shift_attendance (partner_id, shift_id, attendance_date, status, first_check_in, late_minutes)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (partner_id, attendance_date)
     DO UPDATE SET
       shift_id = EXCLUDED.shift_id,
       status = CASE WHEN delivery_shift_attendance.first_check_in IS NULL THEN EXCLUDED.status ELSE delivery_shift_attendance.status END,
       first_check_in = COALESCE(delivery_shift_attendance.first_check_in, EXCLUDED.first_check_in),
       late_minutes = GREATEST(delivery_shift_attendance.late_minutes, EXCLUDED.late_minutes),
       updated_at = CURRENT_TIMESTAMP`,
    [partnerId, shift.id, dateStr, status, checkInTime, lateMinutes]
  );
};

/**
 * Accumulate working/overtime minutes on the day's attendance row when a check-out happens.
 */
const upsertAttendanceOnCheckOut = async (partnerId, checkInTime, checkOutTime, workingMinutesDelta, shift) => {
  const dateStr = toDateStr(checkInTime);
  const scheduledMinutes = shift
    ? Math.max(0, parseTimeToMinutes(shift.end_time) - parseTimeToMinutes(shift.start_time))
    : 0;
  await pool.query(
    `UPDATE delivery_shift_attendance
     SET last_check_out = $1,
         working_minutes = working_minutes + $2,
         overtime_minutes = GREATEST(0, (working_minutes + $2) - $3),
         updated_at = CURRENT_TIMESTAMP
     WHERE partner_id = $4 AND attendance_date = $5`,
    [checkOutTime, workingMinutesDelta, scheduledMinutes, partnerId, dateStr]
  );
};

/**
 * Backfill 'missed' attendance rows for scheduled working days that have no check-in on record.
 * Idempotent: only inserts where no attendance row exists yet for that date.
 */
const syncMissedAttendance = async (partnerId) => {
  const shiftsRes = await pool.query(
    `SELECT * FROM delivery_shifts WHERE partner_id = $1 AND status != 'cancelled'`,
    [partnerId]
  );
  const shifts = shiftsRes.rows;
  if (shifts.length === 0) return;

  const today = new Date();

  for (let i = 1; i <= MISSED_SHIFT_LOOKBACK_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayAbbrev = getDayAbbreviation(d);
    const dateStr = toDateStr(d);

    const matchingShift = shifts.find((s) => {
      const days = Array.isArray(s.working_days) ? s.working_days : [];
      return days.includes(dayAbbrev) && toDateStr(s.created_at) <= dateStr;
    });
    if (!matchingShift) continue;

    await pool.query(
      `INSERT INTO delivery_shift_attendance (partner_id, shift_id, attendance_date, status)
       VALUES ($1, $2, $3, 'missed')
       ON CONFLICT (partner_id, attendance_date) DO NOTHING`,
      [partnerId, matchingShift.id, dateStr]
    );
  }
};

/**
 * Check-in partner into a shift. Requires GPS and an in-window shift time.
 */
const checkInPartner = async (partnerId, { shift_id, lat, lng }) => {
  if (lat === undefined || lat === null || lng === undefined || lng === null || lat === '' || lng === '') {
    const err = new Error('GPS location is required to check in. Please enable location access and try again.');
    err.status = 400;
    throw err;
  }
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    const err = new Error('Invalid GPS coordinates received.');
    err.status = 400;
    throw err;
  }

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
    shift = await getTodayShiftRow(partnerId);
  }

  if (!shift) {
    const err = new Error('No scheduled shift found for check-in.');
    err.status = 404;
    throw err;
  }

  // 3. Enforce the allowed check-in window
  const now = new Date();
  if (!isWithinCheckInWindow(shift, now)) {
    const err = new Error(
      `Check-in is only allowed during your scheduled shift window (${shift.start_time} - ${shift.end_time}).`
    );
    err.status = 400;
    throw err;
  }

  // 4. Calculate late minutes
  const shiftStartMins = parseTimeToMinutes(shift.start_time);
  const currentMins = getCurrentTimeMinutes(now);
  const diffMins = currentMins - shiftStartMins;

  let lateMinutes = 0;
  if (diffMins > LATE_GRACE_PERIOD_MINUTES) {
    lateMinutes = diffMins;
  }

  // 5. Create shift log
  const { rows } = await pool.query(
    `INSERT INTO delivery_shift_logs (
      shift_id, partner_id, check_in, late_minutes, gps_latitude, gps_longitude
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [shift.id, partnerId, now, lateMinutes, latNum, lngNum]
  );
  const logEntry = rows[0];

  // 6. Update shift status to active
  await pool.query(
    `UPDATE delivery_shifts SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [shift.id]
  );

  // 7. Attendance summary row
  await upsertAttendanceOnCheckIn(partnerId, shift, now, lateMinutes);

  // 8. Real-time events & notifications
  emitShiftStart({ shift_id: shift.id, partner_id: partnerId, check_in: now.toISOString() });
  if (lateMinutes > 0) {
    emitShiftLate({ shift_id: shift.id, partner_id: partnerId, late_minutes: lateMinutes });
  }
  emitAttendanceUpdate({ partner_id: partnerId, action: 'check_in', status: 'working' });

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
 * Start a break on the partner's currently active shift.
 */
const startBreak = async (partnerId) => {
  const activeLogRes = await pool.query(
    `SELECT * FROM delivery_shift_logs WHERE partner_id = $1 AND check_out IS NULL ORDER BY created_at DESC LIMIT 1`,
    [partnerId]
  );
  const logEntry = activeLogRes.rows[0];
  if (!logEntry) {
    const err = new Error('You must be checked in to start a break.');
    err.status = 400;
    throw err;
  }

  const openBreak = await pool.query(
    `SELECT id FROM delivery_shift_breaks WHERE shift_log_id = $1 AND break_end IS NULL LIMIT 1`,
    [logEntry.id]
  );
  if (openBreak.rows.length > 0) {
    const err = new Error('You already have an active break in progress.');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const { rows } = await pool.query(
    `INSERT INTO delivery_shift_breaks (shift_log_id, partner_id, break_start) VALUES ($1, $2, $3) RETURNING *`,
    [logEntry.id, partnerId, now]
  );
  const brk = rows[0];

  emitShiftBreakStart({ shift_log_id: logEntry.id, partner_id: partnerId, break_start: now.toISOString() });
  emitAttendanceUpdate({ partner_id: partnerId, action: 'break_start', status: 'on_break' });
  emitDeliveryNotification(partnerId, {
    type: 'break_started',
    title: 'Break Started',
    message: 'Your break has started. Remember to end it before checking out.',
    created_at: now.toISOString(),
  });

  return brk;
};

/**
 * End the partner's currently active break.
 */
const endBreak = async (partnerId) => {
  const { rows: openRows } = await pool.query(
    `SELECT b.*, l.check_in FROM delivery_shift_breaks b
     JOIN delivery_shift_logs l ON l.id = b.shift_log_id
     WHERE b.partner_id = $1 AND b.break_end IS NULL
     ORDER BY b.created_at DESC LIMIT 1`,
    [partnerId]
  );
  const brk = openRows[0];
  if (!brk) {
    const err = new Error('No active break found to end.');
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const durationMinutes = Math.max(0, Math.round((now.getTime() - new Date(brk.break_start).getTime()) / 60000));

  const { rows } = await pool.query(
    `UPDATE delivery_shift_breaks SET break_end = $1, duration_minutes = $2 WHERE id = $3 RETURNING *`,
    [now, durationMinutes, brk.id]
  );
  const updated = rows[0];

  await pool.query(
    `UPDATE delivery_shift_attendance SET break_minutes = break_minutes + $1, updated_at = CURRENT_TIMESTAMP
     WHERE partner_id = $2 AND attendance_date = $3`,
    [durationMinutes, partnerId, toDateStr(brk.check_in)]
  );

  emitShiftBreakEnd({
    shift_log_id: brk.shift_log_id,
    partner_id: partnerId,
    break_end: now.toISOString(),
    duration_minutes: durationMinutes,
  });
  emitAttendanceUpdate({ partner_id: partnerId, action: 'break_end', status: 'working' });

  return updated;
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

  const openBreak = await pool.query(
    `SELECT id FROM delivery_shift_breaks WHERE shift_log_id = $1 AND break_end IS NULL LIMIT 1`,
    [logEntry.id]
  );
  if (openBreak.rows.length > 0) {
    const err = new Error('Please end your active break before checking out.');
    err.status = 400;
    throw err;
  }

  const checkOutTime = new Date();
  const checkInTime = new Date(logEntry.check_in);

  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  const totalHours = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));

  // Check early checkout
  let earlyCheckout = false;
  let shift = null;
  if (logEntry.shift_id) {
    const sRes = await pool.query(`SELECT * FROM delivery_shifts WHERE id = $1`, [logEntry.shift_id]);
    shift = sRes.rows[0] || null;
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

  const workingMinutesDelta = Math.round(diffMs / 60000);
  await upsertAttendanceOnCheckOut(partnerId, checkInTime, checkOutTime, workingMinutesDelta, shift);

  // Emit Socket events
  emitShiftEnd({
    shift_id: logEntry.shift_id,
    partner_id: partnerId,
    check_out: checkOutTime.toISOString(),
    total_hours: totalHours,
  });
  emitAttendanceUpdate({ partner_id: partnerId, action: 'check_out', status: 'completed' });

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
  await syncMissedAttendance(partnerId);

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

  const missedRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM delivery_shift_attendance WHERE partner_id = $1 AND status = 'missed'`,
    [partnerId]
  );

  const breakMinutesRes = await pool.query(
    `SELECT COALESCE(SUM(break_minutes), 0)::int AS minutes FROM delivery_shift_attendance WHERE partner_id = $1`,
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

  return {
    stats: {
      working_hours: totalWorkingHours,
      total_check_ins: checkInsCount,
      scheduled_shifts: scheduledCount,
      attendance_percentage: attendancePct,
      late_days: parseInt(stats.late_days || '0', 10),
      early_checkouts: parseInt(stats.early_checkouts || '0', 10),
      overtime_hours: overtimeHours,
      missed_shifts: missedRes.rows[0]?.count || 0,
      break_minutes: breakMinutesRes.rows[0]?.minutes || 0,
      grace_period_minutes: LATE_GRACE_PERIOD_MINUTES,
    },
    logs: logsRes.rows,
  };
};

/**
 * Fetch a partner's day-by-day attendance history (used for history/calendar/weekly/monthly views).
 */
const getPartnerHistory = async (partnerId, options = {}) => {
  await syncMissedAttendance(partnerId);

  const limit = Math.min(200, Math.max(1, parseInt(options.limit || '90', 10)));

  const { rows: attendance } = await pool.query(
    `SELECT a.*, s.shift_name, s.start_time, s.end_time
     FROM delivery_shift_attendance a
     LEFT JOIN delivery_shifts s ON s.id = a.shift_id
     WHERE a.partner_id = $1
     ORDER BY a.attendance_date DESC
     LIMIT $2`,
    [partnerId, limit]
  );

  const { rows: breaks } = await pool.query(
    `SELECT * FROM delivery_shift_breaks
     WHERE partner_id = $1
     ORDER BY break_start DESC
     LIMIT $2`,
    [partnerId, limit]
  );

  return { attendance, breaks };
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

/**
 * Assign a shift to a rider — creates the shift and records an assignment audit row.
 */
const assignShiftToPartner = async (data, assignedBy) => {
  const shift = await createAdminShift(data);

  await pool.query(
    `INSERT INTO delivery_shift_assignments (shift_id, partner_id, assigned_by, status)
     VALUES ($1, $2, $3, 'active')`,
    [shift.id, shift.partner_id, assignedBy || null]
  );

  emitShiftAssigned({
    shift_id: shift.id,
    partner_id: shift.partner_id,
    shift_name: shift.shift_name,
    start_time: shift.start_time,
    end_time: shift.end_time,
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

  const shift = rows[0];
  emitShiftUpdated(shift);
  emitDeliveryNotification(shift.partner_id, {
    type: 'shift_assigned',
    title: 'Shift Updated',
    message: `Your shift "${shift.shift_name}" was updated by an admin.`,
    created_at: new Date().toISOString(),
  });

  return shift;
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
    `SELECT s.*, dp.full_name AS partner_name, dp.email AS partner_email, dp.phone_number AS partner_phone,
            CASE
              WHEN active_log.id IS NOT NULL THEN 'checked_in'
              WHEN today_log.id IS NOT NULL THEN 'completed'
              ELSE 'not_checked_in'
            END AS today_status
     FROM delivery_shifts s
     JOIN delivery_partners dp ON dp.id = s.partner_id
     LEFT JOIN delivery_shift_logs active_log
       ON active_log.partner_id = s.partner_id AND active_log.check_out IS NULL
     LEFT JOIN delivery_shift_logs today_log
       ON today_log.partner_id = s.partner_id AND DATE(today_log.check_in) = CURRENT_DATE
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
  startBreak,
  endBreak,
  getPartnerAttendance,
  getPartnerHistory,
  hasActiveShiftCheckIn,
  createAdminShift,
  assignShiftToPartner,
  updateAdminShift,
  deleteAdminShift,
  getAdminShifts,
};
