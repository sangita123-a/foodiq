import api, { fetcher } from "@/services/api";

export const adminFetcher = fetcher;

export type AdminDashboard = {
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  todaysOrders: number;
  todaysRevenue: number;
  activeDeliveryPartners: number;
  pendingRestaurantApprovals: number;
  pendingPartnerApprovals: number;
  activeOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  weekly: Array<{ day: string; orders: number; revenue: number }>;
  monthly: Array<{ month: string; orders: number; revenue: number }>;
};

export function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function adminGet<T>(url: string) {
  const res = await api.get(url);
  return res.data.data as T;
}

export async function adminPut<T>(url: string, body: Record<string, unknown>) {
  const res = await api.put(url, body);
  return res.data.data as T;
}

export async function adminPost<T>(url: string, body: Record<string, unknown> = {}) {
  const res = await api.post(url, body);
  return res.data.data as T;
}

export async function adminDelete(url: string) {
  await api.delete(url);
}

export type FeedbackInbox = {
  product: Array<Record<string, unknown>>;
  support: Array<Record<string, unknown>>;
  contact: Array<Record<string, unknown>>;
};

export async function fetchFeedbackInbox(type = "all") {
  return adminGet<FeedbackInbox>(`/api/admin/feedback?type=${type}`);
}

export async function fetchAdminReviews(params?: {
  status?: string;
  restaurant_id?: string;
  rating?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.restaurant_id) sp.set("restaurant_id", params.restaurant_id);
  if (params?.rating) sp.set("rating", params.rating);
  if (params?.from) sp.set("from", params.from);
  if (params?.to) sp.set("to", params.to);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const q = sp.toString() ? `?${sp}` : "";
  return adminGet<{
    rows: Array<Record<string, unknown>>;
    total: number;
    limit: number;
    offset: number;
  }>(`/api/admin/reviews${q}`);
}

export async function fetchAdminOrderFeedback(params?: {
  restaurant_id?: string;
  delivery_partner_id?: string;
  rating?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.restaurant_id) sp.set("restaurant_id", params.restaurant_id);
  if (params?.delivery_partner_id)
    sp.set("delivery_partner_id", params.delivery_partner_id);
  if (params?.rating) sp.set("rating", params.rating);
  if (params?.from) sp.set("from", params.from);
  if (params?.to) sp.set("to", params.to);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const q = sp.toString() ? `?${sp}` : "";
  return adminGet<{
    rows: Array<Record<string, unknown>>;
    total: number;
    limit: number;
    offset: number;
  }>(`/api/admin/order-feedback${q}`);
}

export async function fetchFeedbackAnalytics(days = 30) {
  return adminGet<Record<string, unknown>>(
    `/api/admin/analytics/feedback?days=${days}`
  );
}

export async function fetchAdminBugs(params?: {
  status?: string;
  severity?: string;
  filter?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.severity) sp.set("severity", params.severity);
  if (params?.filter) sp.set("filter", params.filter);
  if (params?.q) sp.set("q", params.q);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const q = sp.toString() ? `?${sp}` : "";
  return adminGet<{
    rows: Array<Record<string, unknown>>;
    total: number;
    counts: {
      open: number;
      in_progress: number;
      fixed: number;
      critical: number;
      low_priority: number;
      total: number;
    };
  }>(`/api/admin/bugs${q}`);
}

export async function fetchWeeklyBugReport(persist = false) {
  return adminGet<Record<string, unknown>>(
    `/api/admin/bugs/weekly-report${persist ? "?persist=1" : ""}`
  );
}

export async function fetchReviewAnalytics(days = 30) {
  return adminGet<Record<string, unknown>>(
    `/api/admin/analytics/reviews?days=${days}`
  );
}

export async function fetchMaintenanceHealth() {
  return adminGet<{
    database: string;
    errors_7d: number;
    open_bugs: number;
    reviews_7d: number;
  }>("/api/admin/maintenance/health");
}

export async function fetchMaintenanceReport(period: "weekly" | "monthly") {
  return adminGet<Record<string, unknown>>(
    `/api/admin/maintenance/report?period=${period}`
  );
}

export async function listMaintenanceReports() {
  return adminGet<Array<Record<string, unknown>>>(
    "/api/admin/maintenance/reports"
  );
}

export async function sendWeeklyMaintenanceReport() {
  return adminPost("/api/admin/maintenance/send-weekly");
}

export async function fetchV2Adoption(days = 30) {
  return adminGet<Record<string, unknown>>(
    `/api/admin/analytics/v2-adoption?days=${days}`
  );
}
