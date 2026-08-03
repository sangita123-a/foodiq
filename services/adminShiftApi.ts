import api from "@/services/api";
import type { DeliveryShift, DeliveryAttendanceResponse } from "@/services/deliveryApi";

export type AdminShiftSummary = {
  active_riders: number;
  working_riders: number;
  absent_riders: number;
  late_riders: number;
  avg_working_hours: number;
  shift_utilization: number;
};

export type AdminShiftsResponse = {
  shifts: DeliveryShift[];
  summary: AdminShiftSummary;
};

export async function fetchAdminShifts(params?: {
  status?: string;
  partner_id?: string;
}): Promise<AdminShiftsResponse> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.partner_id) sp.set("partner_id", params.partner_id);
  const qs = sp.toString();
  const res = await api.get(`/api/admin/shifts${qs ? `?${qs}` : ""}`);
  return res.data.data;
}

export type AdminShiftInput = {
  partner_id: string;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  working_days?: string[];
  is_recurring?: boolean;
  timezone?: string;
};

export async function createAdminShift(data: AdminShiftInput): Promise<{ shift: DeliveryShift }> {
  const res = await api.post("/api/admin/shifts", data);
  return res.data.data;
}

/** POST /api/admin/shifts/assign — assign a new shift to a rider (records an assignment audit row). */
export async function assignAdminShift(data: AdminShiftInput): Promise<{ shift: DeliveryShift }> {
  const res = await api.post("/api/admin/shifts/assign", data);
  return res.data.data;
}

/** GET /api/admin/shifts/partner/:partnerId/attendance — drill down into one rider's attendance. */
export async function fetchAdminPartnerAttendance(partnerId: string): Promise<DeliveryAttendanceResponse> {
  const res = await api.get(`/api/admin/shifts/partner/${partnerId}/attendance`);
  return res.data.data;
}

export async function updateAdminShift(
  id: string,
  data: Partial<DeliveryShift>
): Promise<{ shift: DeliveryShift }> {
  const res = await api.patch(`/api/admin/shifts/${id}`, data);
  return res.data.data;
}

export async function deleteAdminShift(id: string): Promise<{ success: boolean; deleted_id: string }> {
  const res = await api.delete(`/api/admin/shifts/${id}`);
  return res.data.data;
}
