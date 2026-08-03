"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  LogOut,
  LogIn,
  TrendingUp,
  ShieldAlert,
  UserCheck,
  Zap,
  Coffee,
  PlayCircle,
  List,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  fetchDeliveryAttendance,
  fetchDeliveryShifts,
  fetchTodayShift,
  fetchDeliveryShiftHistory,
  checkInShift,
  checkOutShift,
  startShiftBreak,
  endShiftBreak,
  type DeliveryShiftAttendanceDay,
} from "@/services/deliveryApi";
import { useToast } from "@/contexts/ToastContext";

type HistoryView = "list" | "calendar" | "weekly" | "monthly";

type GroupSummary = {
  key: string;
  label: string;
  present: number;
  late: number;
  missed: number;
  working_hours: number;
  overtime_hours: number;
};

const ATTENDANCE_BADGE: Record<string, string> = {
  present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  late: "bg-amber-50 text-amber-700 border-amber-200",
  missed: "bg-red-50 text-red-700 border-red-200",
  scheduled: "bg-section text-gray-text border-border",
};

const CALENDAR_CELL: Record<string, string> = {
  present: "bg-emerald-500 text-white",
  late: "bg-amber-500 text-white",
  missed: "bg-red-500 text-white",
  scheduled: "bg-blue-100 text-blue-700",
};

function getGeolocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Your device does not support location access, which is required to check in."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () =>
        reject(
          new Error("Location access is required to check in/out. Please enable GPS permissions and try again.")
        ),
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

function summarizeByKey(
  days: DeliveryShiftAttendanceDay[],
  keyFn: (d: Date) => string,
  labelFn: (d: Date) => string
): GroupSummary[] {
  const map = new Map<string, GroupSummary>();
  days.forEach((day) => {
    const date = parseISO(day.attendance_date);
    const key = keyFn(date);
    if (!map.has(key)) {
      map.set(key, { key, label: labelFn(date), present: 0, late: 0, missed: 0, working_hours: 0, overtime_hours: 0 });
    }
    const g = map.get(key)!;
    if (day.status === "present" || day.status === "late") g.present += 1;
    if (day.status === "late") g.late += 1;
    if (day.status === "missed") g.missed += 1;
    g.working_hours += (day.working_minutes || 0) / 60;
    g.overtime_hours += (day.overtime_minutes || 0) / 60;
  });
  return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}

const getErrorMessage = (err: unknown, fallback: string) => {
  const ax = err as { response?: { data?: { message?: string } }; message?: string };
  return ax.response?.data?.message || ax.message || fallback;
};

export default function DeliveryShiftsPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const hasToken = useAuthToken();
  const { showToast } = useToast();

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [breakBusy, setBreakBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyView, setHistoryView] = useState<HistoryView>("list");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const { data: shiftsData, isLoading: loadingShifts } = useSWR(
    hasToken ? "/api/delivery/shifts" : null,
    fetchDeliveryShifts
  );

  const { data: todayData, isLoading: loadingToday } = useSWR(
    hasToken ? "/api/delivery/shifts/today" : null,
    fetchTodayShift
  );

  const { data: attendanceData, isLoading: loadingAttendance } = useSWR(
    hasToken ? "/api/delivery/attendance" : null,
    () => fetchDeliveryAttendance(30)
  );

  const { data: historyData, isLoading: loadingHistory } = useSWR(
    hasToken ? "/api/delivery/shifts/history" : null,
    () => fetchDeliveryShiftHistory(180)
  );

  const shifts = shiftsData?.shifts || [];
  const todayShift = todayData?.shift || null;
  const activeLog = todayData?.active_log || null;
  const activeBreak = todayData?.active_break || null;
  const stats = attendanceData?.stats || {
    working_hours: 0,
    total_check_ins: 0,
    scheduled_shifts: 0,
    attendance_percentage: 0,
    late_days: 0,
    early_checkouts: 0,
    overtime_hours: 0,
    missed_shifts: 0,
    break_minutes: 0,
    grace_period_minutes: 15,
  };
  const logs = attendanceData?.logs || [];
  const attendanceDays = useMemo(() => historyData?.attendance || [], [historyData]);

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, DeliveryShiftAttendanceDay>();
    attendanceDays.forEach((d) => map.set(d.attendance_date.slice(0, 10), d));
    return map;
  }, [attendanceDays]);

  const weeklyGroups = useMemo(
    () =>
      summarizeByKey(
        attendanceDays,
        (d) => format(startOfWeek(d), "yyyy-MM-dd"),
        (d) => `Week of ${format(startOfWeek(d), "MMM d")} – ${format(endOfWeek(d), "MMM d, yyyy")}`
      ),
    [attendanceDays]
  );

  const monthlyGroups = useMemo(
    () =>
      summarizeByKey(
        attendanceDays,
        (d) => format(d, "yyyy-MM"),
        (d) => format(d, "MMMM yyyy")
      ),
    [attendanceDays]
  );

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth));
    const end = endOfWeek(endOfMonth(calendarMonth));
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      mutate("/api/delivery/shifts"),
      mutate("/api/delivery/shifts/today"),
      mutate("/api/delivery/attendance"),
      mutate("/api/delivery/shifts/history"),
      mutate("/api/delivery/dashboard"),
    ]);
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const { lat, lng } = await getGeolocation();
      await checkInShift({ shift_id: todayShift?.id, lat, lng });
      showToast("Checked into shift successfully! Have a safe run.", "success");
      await handleRefresh();
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Failed to check in."), "error");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const { lat, lng } = await getGeolocation();
      await checkOutShift({ lat, lng });
      showToast("Checked out of shift successfully.", "success");
      await handleRefresh();
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Failed to check out."), "error");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleStartBreak = async () => {
    setBreakBusy(true);
    try {
      await startShiftBreak();
      showToast("Break started.", "success");
      await handleRefresh();
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Failed to start break."), "error");
    } finally {
      setBreakBusy(false);
    }
  };

  const handleEndBreak = async () => {
    setBreakBusy(true);
    try {
      const res = await endShiftBreak();
      showToast(`Break ended (${res.break.duration_minutes ?? 0} mins).`, "success");
      await handleRefresh();
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Failed to end break."), "error");
    } finally {
      setBreakBusy(false);
    }
  };

  return (
    <DeliveryShell title="Shifts & Attendance" online={dashboard?.is_online}>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Top Header */}
        <div className="bg-white border border-border rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                Shift Scheduling &amp; Attendance
              </h1>
            </div>
            <p className="text-xs md:text-sm text-gray-text">
              View assigned working shifts, check in with GPS, track breaks, late minutes and attendance stats.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2.5 bg-section hover:bg-border/60 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh Schedule</span>
          </button>
        </div>

        {/* Progress Cards */}
        {loadingAttendance ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-border rounded-2xl p-5 shadow-sm h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Working Hours
                </span>
                <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center border border-primary/10">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {stats.working_hours.toFixed(1)} <span className="text-sm font-bold text-gray-text">hrs</span>
              </p>
              <p className="text-xs text-gray-text mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Overtime: {stats.overtime_hours.toFixed(1)} hrs</span>
              </p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Attendance %
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                {stats.attendance_percentage}%
              </p>
              <p className="text-xs text-gray-text mt-1.5">
                Check-ins: {stats.total_check_ins} / {stats.scheduled_shifts} shifts
              </p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Late Days
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
                {stats.late_days}
              </p>
              <p className="text-xs text-gray-text mt-1.5">
                Grace period: {stats.grace_period_minutes} mins
              </p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Missed Shifts
                </span>
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {stats.missed_shifts}
              </p>
              <p className="text-xs text-gray-text mt-1.5">
                Break time: {Math.round(stats.break_minutes)} mins &bull; Early outs: {stats.early_checkouts}
              </p>
            </div>
          </div>
        )}

        {/* Today's Shift & Check-In Action Card */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-extrabold text-foreground">Today&apos;s Scheduled Shift</h2>
              </div>
              <p className="text-xs text-gray-text mt-0.5">
                Check into your shift to enable Online status and receive order assignments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeBreak ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  <Coffee className="w-3.5 h-3.5" />
                  ON BREAK
                </span>
              ) : activeLog ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  WORKING (CHECKED IN)
                </span>
              ) : todayShift ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  SCHEDULED ({todayShift.start_time} - {todayShift.end_time})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-section text-gray-text border border-border">
                  NO SHIFT TODAY
                </span>
              )}
            </div>
          </div>

          {loadingToday ? (
            <div className="h-20 bg-section rounded-xl animate-pulse" />
          ) : todayShift ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-2">
                <h3 className="text-base font-black text-foreground">{todayShift.shift_name}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-text">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    {todayShift.start_time} &ndash; {todayShift.end_time}
                  </span>
                  <span>&bull;</span>
                  <span className="capitalize">Days: {todayShift.working_days.join(", ")}</span>
                  <span>&bull;</span>
                  <span>Timezone: {todayShift.timezone}</span>
                </div>
                {activeBreak && (
                  <p className="text-xs font-semibold text-amber-700">
                    On break since {new Date(activeBreak.break_start).toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {!activeLog ? (
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-button cursor-pointer disabled:opacity-60 text-sm"
                  >
                    {checkingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Checking In...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Check In Now</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    {activeBreak ? (
                      <button
                        type="button"
                        onClick={handleEndBreak}
                        disabled={breakBusy}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 text-sm"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>{breakBusy ? "Ending..." : "End Break"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartBreak}
                        disabled={breakBusy}
                        className="bg-section hover:bg-border/60 text-foreground border border-border font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 text-sm"
                      >
                        <Coffee className="w-4 h-4" />
                        <span>{breakBusy ? "Starting..." : "Start Break"}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCheckOut}
                      disabled={checkingOut || !!activeBreak}
                      title={activeBreak ? "End your break before checking out" : undefined}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 text-sm"
                    >
                      {checkingOut ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Checking Out...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" />
                          <span>Check Out Shift</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-text text-sm">
              No shift assigned for today. Contact your admin to request a shift schedule.
            </div>
          )}
        </div>

        {/* Assigned Shifts List */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-base font-extrabold text-foreground">Your Assigned Shifts</h2>

          {loadingShifts ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-section rounded-xl animate-pulse" />
              ))}
            </div>
          ) : shifts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shifts.map((s) => (
                <div
                  key={s.id}
                  className="border border-border rounded-xl p-4 bg-section/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-foreground text-sm">{s.shift_name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {s.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-text flex items-center justify-between">
                    <span>
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-primary" />
                      {s.start_time} - {s.end_time}
                    </span>
                    <span className="uppercase font-semibold">
                      {s.working_days.join(", ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-text text-center py-4">No recurring shifts found.</p>
          )}
        </div>

        {/* Shift History: List / Calendar / Weekly / Monthly */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-foreground">Shift History</h2>
            <div className="flex items-center gap-1 bg-section border border-border rounded-xl p-1">
              {(
                [
                  { key: "list", label: "History", icon: List },
                  { key: "calendar", label: "Calendar", icon: CalendarDays },
                  { key: "weekly", label: "Weekly", icon: CalendarRange },
                  { key: "monthly", label: "Monthly", icon: Calendar },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHistoryView(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    historyView === key
                      ? "bg-white text-primary shadow-sm border border-border"
                      : "text-gray-text hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-section rounded-xl animate-pulse" />
              ))}
            </div>
          ) : attendanceDays.length === 0 ? (
            <p className="text-xs text-gray-text text-center py-6">
              No attendance history yet. It will appear here once you check in for the first time.
            </p>
          ) : historyView === "list" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-bold uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Shift</th>
                    <th className="pb-3">Working Hrs</th>
                    <th className="pb-3">Break Mins</th>
                    <th className="pb-3">Overtime</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {attendanceDays.map((day) => (
                    <tr key={day.id} className="hover:bg-section/50">
                      <td className="py-3 font-bold text-foreground">
                        {format(parseISO(day.attendance_date), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 text-gray-text">{day.shift_name || "—"}</td>
                      <td className="py-3 font-extrabold text-foreground">
                        {(day.working_minutes / 60).toFixed(1)} hrs
                      </td>
                      <td className="py-3 text-gray-text">{day.break_minutes || 0}</td>
                      <td className="py-3 text-gray-text">{(day.overtime_minutes / 60).toFixed(1)} hrs</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            ATTENDANCE_BADGE[day.status] || ATTENDANCE_BADGE.scheduled
                          }`}
                        >
                          {day.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : historyView === "calendar" ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                  className="p-1.5 rounded-lg hover:bg-section cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-extrabold text-foreground">
                  {format(calendarMonth, "MMMM yyyy")}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                  className="p-1.5 rounded-lg hover:bg-section cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="text-[10px] font-bold text-muted uppercase py-1">
                    {d}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const rec = attendanceByDate.get(key);
                  const inMonth = isSameMonth(day, calendarMonth);
                  const cellClass = rec
                    ? CALENDAR_CELL[rec.status] || "bg-section text-gray-text"
                    : "bg-transparent text-gray-text";
                  return (
                    <div
                      key={key}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                        inMonth ? cellClass : "opacity-30"
                      } ${isToday(day) ? "ring-2 ring-primary" : ""}`}
                      title={rec ? `${rec.status} — ${(rec.working_minutes / 60).toFixed(1)} hrs` : undefined}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] font-bold text-gray-text">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Present</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Late</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" /> Missed</span>
              </div>
            </div>
          ) : historyView === "weekly" ? (
            <div className="space-y-2">
              {weeklyGroups.map((g) => (
                <div key={g.key} className="border border-border rounded-xl p-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{g.label}</span>
                  <div className="flex items-center gap-4 text-gray-text">
                    <span>Present: <b className="text-foreground">{g.present}</b></span>
                    <span>Late: <b className="text-amber-600">{g.late}</b></span>
                    <span>Missed: <b className="text-red-600">{g.missed}</b></span>
                    <span>Hours: <b className="text-foreground">{g.working_hours.toFixed(1)}</b></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {monthlyGroups.map((g) => (
                <div key={g.key} className="border border-border rounded-xl p-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{g.label}</span>
                  <div className="flex items-center gap-4 text-gray-text">
                    <span>Present: <b className="text-foreground">{g.present}</b></span>
                    <span>Late: <b className="text-amber-600">{g.late}</b></span>
                    <span>Missed: <b className="text-red-600">{g.missed}</b></span>
                    <span>Hours: <b className="text-foreground">{g.working_hours.toFixed(1)}</b></span>
                    <span>Overtime: <b className="text-foreground">{g.overtime_hours.toFixed(1)}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Log History (raw check-in/out logs) */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-base font-extrabold text-foreground">Attendance &amp; Check-In Logs</h2>

          {loadingAttendance ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-section rounded-xl animate-pulse" />
              ))}
            </div>
          ) : logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-bold uppercase tracking-wider">
                    <th className="pb-3">Shift</th>
                    <th className="pb-3">Check-In</th>
                    <th className="pb-3">Check-Out</th>
                    <th className="pb-3">Total Hours</th>
                    <th className="pb-3">Late Mins</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-section/50">
                      <td className="py-3 font-bold text-foreground">
                        {log.shift_name || "Standard Shift"}
                      </td>
                      <td className="py-3 text-gray-text">
                        {new Date(log.check_in).toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-text">
                        {log.check_out ? new Date(log.check_out).toLocaleString() : "Working..."}
                      </td>
                      <td className="py-3 font-extrabold text-foreground">
                        {log.total_hours ? `${log.total_hours} hrs` : "—"}
                      </td>
                      <td className="py-3 font-semibold text-amber-600">
                        {log.late_minutes > 0 ? `${log.late_minutes} mins` : "On time"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            log.check_out
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {log.check_out ? "Completed" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-text text-center py-6">No check-in logs recorded yet.</p>
          )}
        </div>
      </div>
    </DeliveryShell>
  );
}
