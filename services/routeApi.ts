import api from "@/services/api";
import { ActiveRiderRoute, OptimizedRoute, RecalculateRouteRequest, RouteAnalyticsSummary } from "@/lib/routeOptimization/types";

/**
 * GET /api/delivery/route/optimized
 */
export async function fetchOptimizedRoute(params: {
  partnerId?: string;
  orderIds?: string[];
  mode?: string;
  lat?: number;
  lng?: number;
}): Promise<OptimizedRoute> {
  const sp = new URLSearchParams();
  if (params.partnerId) sp.set("partner_id", params.partnerId);
  if (params.orderIds?.length) sp.set("order_ids", params.orderIds.join(","));
  if (params.mode) sp.set("mode", params.mode);
  if (params.lat != null) sp.set("lat", String(params.lat));
  if (params.lng != null) sp.set("lng", String(params.lng));

  const query = sp.toString() ? `?${sp}` : "";
  const res = await api.get(`/api/delivery/route/optimized${query}`);
  return res.data.data;
}

/**
 * POST /api/delivery/route/recalculate
 */
export async function recalculateRouteApi(payload: RecalculateRouteRequest): Promise<OptimizedRoute> {
  const res = await api.post("/api/delivery/route/recalculate", payload);
  return res.data.data;
}

/**
 * GET /api/admin/routes
 */
export async function fetchAdminRoutes(): Promise<ActiveRiderRoute[]> {
  const res = await api.get("/api/admin/routes");
  return res.data.data;
}

/**
 * GET /api/admin/routes/analytics
 */
export async function fetchAdminRouteAnalytics(): Promise<{
  summary: RouteAnalyticsSummary;
  trafficHeatmap: Array<{ zone: string; trafficLevel: string; activeRiders: number; avgSpeedKmH: number }>;
  modeUsageBreakdown: Record<string, number>;
}> {
  const res = await api.get("/api/admin/routes/analytics");
  return res.data.data;
}
