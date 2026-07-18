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

export async function fetchAdminReviews(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return adminGet<Array<Record<string, unknown>>>(`/api/admin/reviews${q}`);
}

export async function fetchAdminBugs(params?: {
  status?: string;
  severity?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.severity) sp.set("severity", params.severity);
  const q = sp.toString() ? `?${sp}` : "";
  return adminGet<Array<Record<string, unknown>>>(`/api/admin/bugs${q}`);
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
