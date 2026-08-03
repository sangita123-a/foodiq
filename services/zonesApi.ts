import api from "@/services/api";

export type DeliveryZoneType = "polygon" | "circle";

export type DeliveryZone = {
  id: string;
  name: string;
  city: string;
  state?: string | null;
  country?: string | null;
  polygon?: unknown;
  center_latitude?: number | null;
  center_longitude?: number | null;
  radius_km?: number | null;
  zone_type: DeliveryZoneType;
  is_active: boolean;
  priority: number;
  created_by?: string | null;
  updated_by?: string | null;
  assigned_at?: string;
  distance_meters?: number;
  is_inside?: boolean;
  assigned_partners_count?: number;
  created_at: string;
  updated_at: string;
};

export type ZoneWarningLevel = "none" | "first_warning" | "second_warning";

export type CurrentZoneStatus = {
  in_zone: boolean;
  current_zone: DeliveryZone | null;
  nearest_zone: DeliveryZone | null;
  distance_to_boundary_meters: number | null;
  warning_level: ZoneWarningLevel;
  assigned_zones_count: number;
  orders_eligible: boolean;
};

export type NearbyZonesResponse = {
  zones: DeliveryZone[];
  radius_km: number;
};

/** GET /api/delivery/zones — zones assigned to the authenticated rider. */
export async function fetchAssignedZones(): Promise<DeliveryZone[]> {
  const res = await api.get("/api/delivery/zones");
  return res.data.data as DeliveryZone[];
}

/** GET /api/delivery/current-zone — live in-zone/out-of-zone status for the given GPS fix. */
export async function fetchCurrentZoneStatus(lat: number, lng: number): Promise<CurrentZoneStatus> {
  const res = await api.get(`/api/delivery/current-zone?latitude=${lat}&longitude=${lng}`);
  return res.data.data as CurrentZoneStatus;
}

/** GET /api/delivery/zones/nearby — active zones near the rider regardless of assignment. */
export async function fetchNearbyZones(lat: number, lng: number, radiusKm = 10): Promise<NearbyZonesResponse> {
  const res = await api.get(`/api/delivery/zones/nearby?latitude=${lat}&longitude=${lng}&radius_km=${radiusKm}`);
  return res.data.data as NearbyZonesResponse;
}

export type AllowedOrderRow = {
  id: string;
  restaurant_id?: string;
  restaurant_name?: string;
  restaurant_lat?: number | null;
  restaurant_lng?: number | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
};

/** GET /api/delivery/allowed-orders — orders reachable within the rider's assigned zone(s). */
export async function fetchAllowedOrders(): Promise<{ orders: AllowedOrderRow[]; filterApplied: boolean }> {
  const res = await api.get("/api/delivery/allowed-orders");
  return { orders: (res.data.data as AllowedOrderRow[]) || [], filterApplied: !!res.data.filter_applied };
}
