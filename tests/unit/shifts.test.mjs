import test from 'node:test';
import assert from 'node:assert/strict';

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const calculateLateMinutes = (startTime, checkInTime, gracePeriodMins = 15) => {
  const startMins = parseTimeToMinutes(startTime);
  const checkInMins = checkInTime.getHours() * 60 + checkInTime.getMinutes();
  const diff = checkInMins - startMins;
  return diff > gracePeriodMins ? diff : 0;
};

const calculateTotalHours = (checkInTime, checkOutTime) => {
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));
};

const calculateAttendanceStats = (logs, scheduledShiftsCount) => {
  const checkInsCount = logs.length;
  const totalWorkingHours = logs.reduce((sum, l) => sum + (l.total_hours || 0), 0);
  const lateDays = logs.filter((l) => (l.late_minutes || 0) > 0).length;
  const earlyCheckouts = logs.filter((l) => l.early_checkout === true).length;
  
  const attendancePercentage = scheduledShiftsCount > 0
    ? Math.min(100, Math.round((checkInsCount / scheduledShiftsCount) * 100))
    : checkInsCount > 0 ? 100 : 0;

  const expectedHours = scheduledShiftsCount * 8;
  const overtimeHours = Math.max(0, Number((totalWorkingHours - expectedHours).toFixed(2)));
  const missedShifts = Math.max(0, scheduledShiftsCount - checkInsCount);

  return {
    working_hours: totalWorkingHours,
    total_check_ins: checkInsCount,
    scheduled_shifts: scheduledShiftsCount,
    attendance_percentage: attendancePercentage,
    late_days: lateDays,
    early_checkouts: earlyCheckouts,
    overtime_hours: overtimeHours,
    missed_shifts: missedShifts,
  };
};

test('Shift Grace Period & Late Minutes Calculation', () => {
  const startTime = '09:00';
  
  // On time (within 15 min grace)
  const checkIn1 = new Date();
  checkIn1.setHours(9, 10, 0);
  assert.equal(calculateLateMinutes(startTime, checkIn1, 15), 0);

  // Exactly at grace threshold (15 mins)
  const checkIn2 = new Date();
  checkIn2.setHours(9, 15, 0);
  assert.equal(calculateLateMinutes(startTime, checkIn2, 15), 0);

  // Late (25 mins past start)
  const checkIn3 = new Date();
  checkIn3.setHours(9, 25, 0);
  assert.equal(calculateLateMinutes(startTime, checkIn3, 15), 25);
});

test('Total Working Hours & Early Checkout Calculation', () => {
  const checkIn = new Date('2026-07-31T09:00:00Z');
  const checkOut = new Date('2026-07-31T17:30:00Z');
  
  const hours = calculateTotalHours(checkIn, checkOut);
  assert.equal(hours, 8.5);
});

test('Attendance Statistics Calculation', () => {
  const logs = [
    { total_hours: 8, late_minutes: 0, early_checkout: false },
    { total_hours: 8.5, late_minutes: 20, early_checkout: false },
    { total_hours: 7.5, late_minutes: 0, early_checkout: true },
  ];
  
  const stats = calculateAttendanceStats(logs, 4);
  assert.equal(stats.total_check_ins, 3);
  assert.equal(stats.scheduled_shifts, 4);
  assert.equal(stats.attendance_percentage, 75);
  assert.equal(stats.late_days, 1);
  assert.equal(stats.early_checkouts, 1);
  assert.equal(stats.working_hours, 24);
  assert.equal(stats.missed_shifts, 1);
});
