import api from "@/services/api";
import type { DeliveryZone } from "@/services/zonesApi";

export type AdminZonesResponse = {
  data: DeliveryZone[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

export type ZoneInput = {
  name: string;
  city: string;
  state?: string;
  country?: string;
  zone_type: "polygon" | "circle";
  polygon?: Array<[number, number]> | null;
  center_latitude?: number | null;
  center_longitude?: number | null;
  radius_km?: number | null;
  is_active?: boolean;
  priority?: number;
};

/** GET /api/admin/delivery-zones */
export async function fetchAdminZones(params: {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  is_active?: string;
}): Promise<AdminZonesResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.search) sp.set("search", params.search);
  if (params.city) sp.set("city", params.city);
  if (params.is_active) sp.set("is_active", params.is_active);
  const res = await api.get(`/api/admin/delivery-zones?${sp.toString()}`);
  return { data: res.data.data, pagination: res.data.pagination };
}

/** POST /api/admin/delivery-zones */
export async function createZone(input: ZoneInput): Promise<DeliveryZone> {
  const res = await api.post("/api/admin/delivery-zones", input);
  return res.data.data as DeliveryZone;
}

/** PATCH /api/admin/delivery-zones/:id */
export async function updateZone(id: string, input: Partial<ZoneInput>): Promise<DeliveryZone> {
  const res = await api.patch(`/api/admin/delivery-zones/${id}`, input);
  return res.data.data as DeliveryZone;
}

/** DELETE /api/admin/delivery-zones/:id */
export async function deleteZone(id: string): Promise<void> {
  await api.delete(`/api/admin/delivery-zones/${id}`);
}

/** POST /api/admin/delivery-zones/:id/assign-partner */
export async function assignPartnerToZone(zoneId: string, partnerId: string) {
  const res = await api.post(`/api/admin/delivery-zones/${zoneId}/assign-partner`, { partner_id: partnerId });
  return res.data.data;
}

/** DELETE /api/admin/delivery-zones/:id/remove-partner */
export async function removePartnerFromZone(zoneId: string, partnerId: string) {
  const res = await api.delete(`/api/admin/delivery-zones/${zoneId}/remove-partner`, {
    data: { partner_id: partnerId },
  });
  return res.data.data;
}

export type ZonePartner = {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  is_online: boolean;
  assigned_at: string;
};

/** GET /api/admin/delivery-zones/:id/partners */
export async function fetchZonePartners(zoneId: string): Promise<ZonePartner[]> {
  const res = await api.get(`/api/admin/delivery-zones/${zoneId}/partners`);
  return res.data.data as ZonePartner[];
}

export type ZoneViolation = {
  id: string;
  partner_id: string;
  partner_name?: string;
  partner_phone?: string;
  zone_id: string | null;
  zone_name?: string;
  violation_type: "exit" | "spoof";
  distance_meters: number | null;
  latitude: number | null;
  longitude: number | null;
  resolved: boolean;
  created_at: string;
};

export type ZoneViolationsResponse = {
  violations: ZoneViolation[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/** GET /api/admin/delivery-zones/violations */
export async function fetchZoneViolations(params: {
  page?: number;
  limit?: number;
  resolved?: string;
  partner_id?: string;
  zone_id?: string;
}): Promise<ZoneViolationsResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.resolved) sp.set("resolved", params.resolved);
  if (params.partner_id) sp.set("partner_id", params.partner_id);
  if (params.zone_id) sp.set("zone_id", params.zone_id);
  const res = await api.get(`/api/admin/delivery-zones/violations?${sp.toString()}`);
  return res.data.data as ZoneViolationsResponse;
}

/** PATCH /api/admin/delivery-zones/violations/:id/resolve */
export async function resolveZoneViolation(id: string): Promise<ZoneViolation> {
  const res = await api.patch(`/api/admin/delivery-zones/violations/${id}/resolve`);
  return res.data.data as ZoneViolation;
}

export type LiveRider = {
  partner_id: string;
  full_name: string;
  phone_number?: string;
  lat: number;
  lng: number;
  is_available: boolean;
  last_updated: string;
  assigned_zones_count: number;
  in_zone: boolean | null;
  current_zone: DeliveryZone | null;
};

/** GET /api/admin/delivery-zones/live-riders */
export async function fetchLiveRiders(): Promise<{ riders: LiveRider[] }> {
  const res = await api.get("/api/admin/delivery-zones/live-riders");
  return res.data.data;
}

export type ZoneHeatmapPoint = { lat: number; lng: number; weight: number };

/** GET /api/admin/delivery-zones/heatmap */
export async function fetchZoneHeatmap(hours = 24): Promise<{
  activity_points: ZoneHeatmapPoint[];
  violation_points: ZoneHeatmapPoint[];
  window_hours: number;
}> {
  const res = await api.get(`/api/admin/delivery-zones/heatmap?hours=${hours}`);
  return res.data.data;
}

/** GET /api/admin/delivery-zones/:id/analytics */
export async function fetchZoneAnalytics(zoneId: string): Promise<{
  zone: DeliveryZone;
  assigned_riders_count: number;
  active_riders_now: number;
  violations_last_30_days: Array<{ violation_type: string; count: number }>;
}> {
  const res = await api.get(`/api/admin/delivery-zones/${zoneId}/analytics`);
  return res.data.data;
}
