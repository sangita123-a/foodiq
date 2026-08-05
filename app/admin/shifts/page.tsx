"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Calendar,
  Clock,
  AlertCircle,
  Download,
  Plus,
  Trash2,
  Edit2,
  Search,
  Eye,
  X,
  Users,
  CheckCircle2,
  XCircle,
  Gauge,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import {
  fetchAdminShifts,
  assignAdminShift,
  updateAdminShift,
  deleteAdminShift,
  fetchAdminPartnerAttendance,
  type AdminShiftsResponse,
} from "@/services/adminShiftApi";
import { fetcher } from "@/services/api";
import type { DeliveryShift } from "@/services/deliveryApi";
import { useToast } from "@/contexts/ToastContext";
import StatCard from "@/components/admin/dashboard/StatCard";
import { Badge, EmptyState } from "@/components/admin/ui";

const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TODAY_STATUS_TONE: Record<string, "success" | "info" | "neutral"> = {
  checked_in: "success",
  completed: "info",
  not_checked_in: "neutral",
};

const TODAY_STATUS_LABELS: Record<string, string> = {
  checked_in: "Checked In",
  completed: "Completed Today",
  not_checked_in: "Not Checked In",
};

export default function AdminShiftsPage() {
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<DeliveryShift | null>(null);
  const [attendanceTarget, setAttendanceTarget] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Assign form state
  const [partnerId, setPartnerId] = useState("");
  const [shiftName, setShiftName] = useState("Standard Morning Shift");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [workingDays, setWorkingDays] = useState<string[]>([...WEEK_DAYS]);

  // Edit form state
  const [editShiftName, setEditShiftName] = useState("");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("17:00");
  const [editWorkingDays, setEditWorkingDays] = useState<string[]>([...WEEK_DAYS]);
  const [editStatus, setEditStatus] = useState("scheduled");

  const { data: partnersData } = useSWR("/api/admin/delivery-partners", fetcher);
  const partnersList = (partnersData?.data?.partners || partnersData?.partners || []) as Array<{
    id: string;
    full_name?: string;
    email?: string;
  }>;

  const shiftsKey = `/api/admin/shifts${statusFilter ? `?status=${statusFilter}` : ""}`;
  const { data, isLoading } = useSWR<AdminShiftsResponse>(shiftsKey, () =>
    fetchAdminShifts({ status: statusFilter || undefined })
  );

  const { data: attendanceData, isLoading: loadingAttendance } = useSWR(
    attendanceTarget ? `/api/admin/shifts/partner/${attendanceTarget.id}/attendance` : null,
    () => fetchAdminPartnerAttendance(attendanceTarget!.id)
  );

  const shifts = data?.shifts || [];
  const summary = data?.summary || {
    active_riders: 0,
    working_riders: 0,
    absent_riders: 0,
    late_riders: 0,
    avg_working_hours: 0,
    shift_utilization: 0,
  };

  const filteredShifts = shifts.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      (s.partner_name || "").toLowerCase().includes(query) ||
      (s.shift_name || "").toLowerCase().includes(query) ||
      (s.partner_email || "").toLowerCase().includes(query)
    );
  });

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) {
      showToast("Please select a delivery partner", "error");
      return;
    }
    setSubmitting(true);
    try {
      await assignAdminShift({
        partner_id: partnerId,
        shift_name: shiftName,
        start_time: startTime,
        end_time: endTime,
        working_days: workingDays,
        is_recurring: true,
        timezone: "Asia/Kolkata",
      });
      showToast("Shift assigned successfully!", "success");
      setIsModalOpen(false);
      mutate(shiftsKey);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax.response?.data?.message || "Failed to assign shift", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (shift: DeliveryShift) => {
    setEditingShift(shift);
    setEditShiftName(shift.shift_name);
    setEditStartTime(shift.start_time);
    setEditEndTime(shift.end_time);
    setEditWorkingDays(shift.working_days || []);
    setEditStatus(shift.status);
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;
    setSubmitting(true);
    try {
      await updateAdminShift(editingShift.id, {
        shift_name: editShiftName,
        start_time: editStartTime,
        end_time: editEndTime,
        working_days: editWorkingDays,
        status: editStatus as DeliveryShift["status"],
      });
      showToast("Shift updated successfully!", "success");
      setEditingShift(null);
      mutate(shiftsKey);
    } catch {
      showToast("Failed to update shift", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift schedule?")) return;
    try {
      await deleteAdminShift(id);
      showToast("Shift deleted", "success");
      mutate(shiftsKey);
    } catch {
      showToast("Failed to delete shift", "error");
    }
  };

  const handleExportCSV = () => {
    if (shifts.length === 0) {
      showToast("No shifts data to export", "error");
      return;
    }
    const headers = ["Shift ID", "Partner Name", "Partner Email", "Shift Name", "Start Time", "End Time", "Status", "Today Status", "Working Days"];
    const rows = shifts.map((s) => [
      s.id,
      `"${s.partner_name || "Partner"}"`,
      `"${s.partner_email || ""}"`,
      `"${s.shift_name}"`,
      s.start_time,
      s.end_time,
      s.status,
      s.today_status || "",
      `"${(s.working_days || []).join(",")}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shift_scheduling_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Shift report CSV downloaded!", "success");
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const toggleEditDay = (day: string) => {
    setEditWorkingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  return (
    <AdminShell title="Shift Scheduling & Attendance">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-[var(--shadow-admin-soft)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Shift &amp; Attendance Dashboard</h1>
            </div>
            <p className="text-sm text-gray-text">
              Assign recurring shifts to delivery partners, track attendance KPIs, and monitor working hours.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-section hover:bg-border/60 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-[var(--shadow-button)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign New Shift</span>
            </button>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Working Riders"
            value={summary.working_riders}
            icon={Users}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            hint="Currently on duty"
          />
          <StatCard
            label="Active Check-Ins"
            value={summary.active_riders}
            icon={CheckCircle2}
            color="text-primary"
            bg="bg-primary/10"
            hint="Today active"
          />
          <StatCard
            label="Absent Riders"
            value={summary.absent_riders}
            icon={XCircle}
            color="text-red-500"
            bg="bg-red-500/10"
            hint="No check-in"
          />
          <StatCard
            label="Late Riders"
            value={summary.late_riders}
            icon={AlertCircle}
            color="text-amber-600"
            bg="bg-amber-500/10"
            hint="Checked in late"
          />
          <StatCard
            label="Avg Working Hrs"
            value={summary.avg_working_hours}
            icon={Clock}
            color="text-sky-600"
            bg="bg-sky-500/10"
            format={(n) => `${n}h`}
            hint="Per rider / shift"
          />
          <StatCard
            label="Utilization"
            value={summary.shift_utilization}
            icon={Gauge}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            format={(n) => `${n}%`}
            hint="Fleet efficiency"
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-border rounded-2xl p-4 shadow-[var(--shadow-admin-soft)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" />
            <input
              type="text"
              placeholder="Search by partner or shift name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-section border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-section border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="">All Shift Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Shift Assignments Table */}
        <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-section rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredShifts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-section text-muted font-extrabold uppercase tracking-wider">
                    <th className="p-4">Delivery Partner</th>
                    <th className="p-4">Shift Name</th>
                    <th className="p-4">Timing</th>
                    <th className="p-4">Working Days</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Today</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredShifts.map((s) => (
                    <tr key={s.id} className="hover:bg-section/50">
                      <td className="p-4">
                        <p className="font-extrabold text-foreground">{s.partner_name || "Delivery Partner"}</p>
                        <p className="text-[11px] text-gray-text">{s.partner_email || ""}</p>
                      </td>
                      <td className="p-4 font-bold text-foreground">{s.shift_name}</td>
                      <td className="p-4 text-gray-text font-medium">
                        <Clock className="w-3.5 h-3.5 inline mr-1 text-primary" />
                        {s.start_time} - {s.end_time}
                      </td>
                      <td className="p-4 text-gray-text uppercase font-semibold">
                        {(s.working_days || []).join(", ")}
                      </td>
                      <td className="p-4">
                        <Badge status={s.status}>{s.status}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge tone={TODAY_STATUS_TONE[s.today_status || "not_checked_in"]}>
                          {TODAY_STATUS_LABELS[s.today_status || "not_checked_in"]}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAttendanceTarget({ id: s.partner_id, name: s.partner_name || "Partner" })}
                            className="p-1.5 text-primary hover:bg-primary-soft rounded-lg transition-colors cursor-pointer"
                            title="View Attendance"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 text-foreground hover:bg-section rounded-lg transition-colors cursor-pointer"
                            title="Edit Shift"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Shift"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No shifts assigned"
              description="Assign recurring shifts to delivery partners using the button above."
            />
          )}
        </div>
      </div>

      {/* Assign Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-border rounded-2xl p-6 max-w-lg w-full shadow-[var(--shadow-admin-lifted)] space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold text-foreground">Assign New Shift Schedule</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-text hover:text-foreground text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignShift} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Select Delivery Partner</label>
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full bg-section border border-border rounded-xl p-2.5 font-medium text-foreground focus:outline-none"
                  required
                >
                  <option value="">-- Select Partner --</option>
                  {partnersList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || "Partner"} ({p.email || p.id.slice(0, 8)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Shift Name</label>
                <input
                  type="text"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="w-full bg-section border border-border rounded-xl p-2.5 font-medium focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-section border border-border rounded-xl p-2.5 font-medium focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-foreground mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-section border border-border rounded-xl p-2.5 font-medium focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Working Days</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {WEEK_DAYS.map((day) => {
                    const selected = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg font-extrabold uppercase text-[10px] transition-all cursor-pointer ${
                          selected ? "bg-primary text-white" : "bg-section text-gray-text border border-border"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-section hover:bg-border/60 text-foreground font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-extrabold rounded-xl text-xs shadow-button cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Assigning..." : "Assign Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-border rounded-2xl p-6 max-w-lg w-full shadow-[var(--shadow-admin-lifted)] space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold text-foreground">Edit Shift Schedule</h3>
              <button
                onClick={() => setEditingShift(null)}
                className="text-gray-text hover:text-foreground text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateShift} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Shift Name</label>
                <input
                  type="text"
                  value={editShiftName}
                  onChange={(e) => setEditShiftName(e.target.value)}
                  className="w-full bg-section border border-border rounded-xl p-2.5 font-medium focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full bg-section border border-border rounded-xl p-2.5 font-medium focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-foreground mb-1">End Time</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full bg-section border border-border rounded-xl p-2.5 font-medium focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-section border border-border rounded-xl p-2.5 font-medium text-foreground focus:outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Working Days</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {WEEK_DAYS.map((day) => {
                    const selected = editWorkingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleEditDay(day)}
                        className={`px-3 py-1.5 rounded-lg font-extrabold uppercase text-[10px] transition-all cursor-pointer ${
                          selected ? "bg-primary text-white" : "bg-section text-gray-text border border-border"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingShift(null)}
                  className="px-4 py-2.5 bg-section hover:bg-border/60 text-foreground font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-extrabold rounded-xl text-xs shadow-button cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Attendance Modal */}
      {attendanceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-border rounded-2xl p-6 max-w-xl w-full shadow-[var(--shadow-admin-lifted)] space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold text-foreground">
                Attendance &mdash; {attendanceTarget.name}
              </h3>
              <button
                onClick={() => setAttendanceTarget(null)}
                className="text-gray-text hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAttendance ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-section rounded-xl animate-pulse" />
                ))}
              </div>
            ) : attendanceData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-section rounded-xl p-3">
                    <p className="text-muted font-bold uppercase text-[10px]">Working Hrs</p>
                    <p className="text-lg font-black text-foreground">{attendanceData.stats.working_hours.toFixed(1)}</p>
                  </div>
                  <div className="bg-section rounded-xl p-3">
                    <p className="text-muted font-bold uppercase text-[10px]">Attendance %</p>
                    <p className="text-lg font-black text-emerald-600">{attendanceData.stats.attendance_percentage}%</p>
                  </div>
                  <div className="bg-section rounded-xl p-3">
                    <p className="text-muted font-bold uppercase text-[10px]">Missed</p>
                    <p className="text-lg font-black text-red-600">{attendanceData.stats.missed_shifts}</p>
                  </div>
                </div>

                {attendanceData.logs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted font-bold uppercase tracking-wider">
                          <th className="pb-2">Check-In</th>
                          <th className="pb-2">Check-Out</th>
                          <th className="pb-2">Hours</th>
                          <th className="pb-2">Late</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {attendanceData.logs.map((log) => (
                          <tr key={log.id}>
                            <td className="py-2 text-gray-text">{new Date(log.check_in).toLocaleString()}</td>
                            <td className="py-2 text-gray-text">
                              {log.check_out ? new Date(log.check_out).toLocaleString() : "Working..."}
                            </td>
                            <td className="py-2 font-bold text-foreground">{log.total_hours || "—"}</td>
                            <td className="py-2 text-amber-600">{log.late_minutes > 0 ? `${log.late_minutes}m` : "On time"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-text text-center py-4">No check-in logs for this rider yet.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-text text-center py-4 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> Failed to load attendance.
              </p>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
