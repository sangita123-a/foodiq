"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  RefreshCw,
  LogOut,
  LogIn,
  TrendingUp,
  ShieldAlert,
  UserCheck,
  Zap,
} from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  fetchDeliveryAttendance,
  fetchDeliveryShifts,
  fetchTodayShift,
  checkInShift,
  checkOutShift,
  type DeliveryShift,
  type DeliveryShiftLog,
} from "@/services/deliveryApi";
import { useToast } from "@/contexts/ToastContext";

export default function DeliveryShiftsPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const hasToken = useAuthToken();
  const { showToast } = useToast();

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const shifts = shiftsData?.shifts || [];
  const todayShift = todayData?.shift || null;
  const stats = attendanceData?.stats || {
    working_hours: 0,
    total_check_ins: 0,
    scheduled_shifts: 0,
    attendance_percentage: 0,
    late_days: 0,
    early_checkouts: 0,
    overtime_hours: 0,
    missed_shifts: 0,
  };
  const logs = attendanceData?.logs || [];
  const activeLog = logs.find((l) => !l.check_out);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      mutate("/api/delivery/shifts"),
      mutate("/api/delivery/shifts/today"),
      mutate("/api/delivery/attendance"),
      mutate("/api/delivery/dashboard"),
    ]);
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          /* optional fallback */
        }
      }

      await checkInShift({
        shift_id: todayShift?.id,
        lat,
        lng,
      });

      showToast("Checked into shift successfully! Have a safe run.", "success");
      await handleRefresh();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(ax.response?.data?.message || ax.message || "Failed to check in.", "error");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          /* optional fallback */
        }
      }

      await checkOutShift({ lat, lng });
      showToast("Checked out of shift successfully.", "success");
      await handleRefresh();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(ax.response?.data?.message || ax.message || "Failed to check out.", "error");
    } finally {
      setCheckingOut(false);
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
              View assigned working shifts, check in with GPS, track late minutes and attendance stats.
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
              Grace period: 15 mins
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
              Early checkouts: {stats.early_checkouts}
            </p>
          </div>
        </div>

        {/* Today's Shift & Check-In Action Card */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-extrabold text-foreground">Today's Scheduled Shift</h2>
              </div>
              <p className="text-xs text-gray-text mt-0.5">
                Check into your shift to enable Online status and receive order assignments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeLog ? (
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

          {todayShift ? (
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
              </div>

              <div className="flex items-center gap-3">
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
                  <button
                    type="button"
                    onClick={handleCheckOut}
                    disabled={checkingOut}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-extrabold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 text-sm"
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
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-text text-sm">
              No shift assigned for today. Contact your admin to request a shift schedule.
            </div>
          )}
        </div>

        {/* Assigned Shifts List & Weekly Calendar */}
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

        {/* Attendance Log History */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-base font-extrabold text-foreground">Attendance &amp; Check-In Logs</h2>

          {loadingAttendance ? (
            <p className="text-xs text-gray-text py-4">Loading attendance logs...</p>
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
