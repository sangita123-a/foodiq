import api, { fetcher } from "@/services/api";

export const adminFetcher = fetcher;

export type AdminDashboard = {
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  todaysOrders: number;
  todaysRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  activeDeliveryPartners: number;
  totalDeliveryPartners: number;
  pendingRestaurantApprovals: number;
  pendingPartnerApprovals: number;
  activeOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalMenuItems: number;
  avgDeliveryTimeMinutes: number;
  customerSatisfaction: number;
  weekly: Array<{ day: string; orders: number; revenue: number }>;
  monthly: Array<{ month: string; orders: number; revenue: number }>;
  orderStatusToday?: Record<string, number>;
  customerInsights?: {
    new_today: number;
    returning: number;
    active_30d: number;
    blocked: number;
  };
  restaurantStatus?: { active: number; pending: number; closed: number };
  topRestaurants?: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
    rating: number;
    growth_pct: number;
  }>;
  liveRestaurants?: Array<{
    id: string;
    name: string;
    is_active: boolean;
    approval_status: string;
    avg_prep_minutes: number;
    rating: number;
    queue: number;
  }>;
  peakHours?: Array<{ hour: number; orders: number }>;
  openSupportTickets?: number;
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

export async function adminPatch<T>(url: string, body: Record<string, unknown> = {}) {
  const res = await api.patch(url, body);
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

export type AdminDeliveryPartnerOption = {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  approval_status?: string;
};

/** Reuses the existing delivery-partners admin list for the partner picker. */
export async function fetchDeliveryPartnerOptions(search = "") {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return adminGet<AdminDeliveryPartnerOption[]>(`/api/admin/delivery-partners${q}`);
}

export type AdminSentNotification = {
  id: string;
  partner_id: string;
  partner_name?: string;
  partner_email?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export async function fetchRecentDeliveryNotifications(limit = 50) {
  return adminGet<{ notifications: AdminSentNotification[]; types?: string[] }>(
    `/api/admin/delivery/notifications?limit=${limit}`
  );
}

export async function sendDeliveryPartnerNotification(body: {
  partner_id: string;
  title: string;
  message: string;
  type: string;
}) {
  return adminPost<AdminSentNotification>("/api/admin/delivery/notifications/send", body);
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

export type AdminKycDocument = {
  id: string;
  partner_id: string;
  document_type: string;
  document_number: string | null;
  file_url: string;
  verification_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  expiry_date: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  partner_name?: string;
  partner_email?: string;
  partner_phone?: string;
};

export type AdminKycDocumentsResponse = {
  documents: AdminKycDocument[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

export async function fetchAdminKycDocuments(params?: {
  status?: string;
  document_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.document_type) sp.set("document_type", params.document_type);
  if (params?.search) sp.set("search", params.search);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const q = sp.toString() ? `?${sp}` : "";
  return adminGet<AdminKycDocumentsResponse>(`/api/admin/delivery/documents${q}`);
}

export type AdminDeliveryPartnerReview = {
  id: string;
  order_id: string;
  partner_id: string;
  customer_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  partner_name?: string;
  partner_email?: string;
};

export type AdminDeliveryPartnerReviewsResponse = {
  reviews: AdminDeliveryPartnerReview[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

export type AdminRatingTrendPoint = {
  day: string;
  total_reviews: number;
  average_rating: number;
};

export async function fetchDeliveryPartnerReviewTrends(days = 30) {
  return adminGet<{ trends: AdminRatingTrendPoint[] }>(
    `/api/admin/delivery-reviews/trends?days=${days}`
  );
}

export type AdminBankAccount = {
  id: string;
  partner_id: string;
  account_holder_name: string;
  account_number_masked: string;
  bank_name: string;
  ifsc_code: string;
  account_type: "savings" | "current";
  upi_id: string | null;
  is_primary: boolean;
  verification_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  partner_name?: string;
  partner_email?: string;
  partner_phone?: string;
};

export type AdminBankAccountsResponse = {
  accounts: AdminBankAccount[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

export async function fetchAdminBankAccounts(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.search) sp.set("search", params.search);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const q = sp.toString() ? `?${sp}` : "";
  return adminGet<AdminBankAccountsResponse>(`/api/admin/delivery/bank-accounts${q}`);
}

export type AdminDeliveryAnalyticsData = {
  summary: {
    total_partners: number;
    online_partners: number;
    average_fleet_rating: number;
    total_fleet_revenue: number;
    total_delivered_orders: number;
    total_cancelled_orders: number;
    average_completion_rate: number;
    average_acceptance_rate: number;
  };
  top_riders: Array<{
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    vehicle_type: string;
    rating: number;
    is_online: boolean;
    completed_orders: number;
    cancelled_orders: number;
    total_earnings: number;
    performance_score: number;
  }>;
  worst_performers: Array<{
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    vehicle_type: string;
    rating: number;
    completed_orders: number;
    cancelled_orders: number;
    performance_score: number;
  }>;
};

export async function fetchAdminDeliveryAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminDeliveryAnalyticsData> {
  const sp = new URLSearchParams();
  if (params?.startDate) sp.set("startDate", params.startDate);
  if (params?.endDate) sp.set("endDate", params.endDate);
  if (params?.search) sp.set("search", params.search);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));
  const q = sp.toString() ? `?${sp}` : "";
  return adminGet<AdminDeliveryAnalyticsData>(`/api/admin/delivery-analytics${q}`);
}

// ── Admin Order Management Types & APIs ─────────────────────────────────────
export type AdminOrderRow = {
  id: string;
  status: string;
  total_amount: number;
  subtotal?: number;
  discount_amount?: number;
  delivery_fee?: number;
  platform_fee?: number;
  tax_amount?: number;
  delivery_mode?: string;
  scheduled_for?: string | null;
  created_at: string;
  updated_at?: string;
  customer_name?: string;
  customer_phone?: string;
  restaurant_id?: string;
  restaurant_name?: string;
  payment_method?: string;
  payment_status?: string;
  payment_id?: string;
  delivery_partner_id?: string;
  delivery_partner_name?: string;
  estimated_delivery_time?: string | null;
  tracking_status?: string;
  city?: string;
  street?: string;
  house_no?: string;
  item_count?: number;
};

export type AdminOrdersPagination = { total: number; page: number; limit: number; totalPages: number };

export type AdminOrdersResponse = { rows: AdminOrderRow[]; pagination: AdminOrdersPagination };

export type AdminOrderStats = {
  today_orders: number;
  pending: number;
  accepted: number;
  preparing: number;
  ready: number;
  picked_up: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  failed_payments: number;
  scheduled_orders: number;
};

export type AdminOrderTimelineEvent = {
  label: string;
  status: string;
  from_status?: string | null;
  source: string;
  changed_by_name?: string | null;
  reason?: string | null;
  created_at: string | null;
  derived?: boolean;
};

export type AdminOrderItem = {
  id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
  name: string;
  image_url?: string;
};

export type AdminOrderDetails = AdminOrderRow & {
  customer_email?: string;
  restaurant_phone?: string;
  state?: string;
  zip_code?: string;
  provider_transaction_id?: string;
  razorpay_payment_id?: string;
  transaction_time?: string;
  delivery_partner_phone?: string;
  coupon_code?: string;
  coupon_discount_type?: string;
  refund_id?: string;
  refund_amount?: number;
  refund_status?: string;
  refund_reason?: string;
  items: AdminOrderItem[];
  timeline: AdminOrderTimelineEvent[];
};

export type AdminOrderFilters = {
  search?: string;
  status?: string;
  restaurant_id?: string;
  delivery_partner_id?: string;
  payment_method?: string;
  payment_status?: string;
  city?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export function buildOrdersQuery(filters: AdminOrderFilters) {
  const sp = new URLSearchParams();
  if (filters.search) sp.set("search", filters.search);
  if (filters.status) sp.set("status", filters.status);
  if (filters.restaurant_id) sp.set("restaurant_id", filters.restaurant_id);
  if (filters.delivery_partner_id) sp.set("delivery_partner_id", filters.delivery_partner_id);
  if (filters.payment_method) sp.set("payment_method", filters.payment_method);
  if (filters.payment_status) sp.set("payment_status", filters.payment_status);
  if (filters.city) sp.set("city", filters.city);
  if (filters.from) sp.set("from", filters.from);
  if (filters.to) sp.set("to", filters.to);
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.page) sp.set("page", String(filters.page));
  if (filters.limit) sp.set("limit", String(filters.limit));
  return sp.toString();
}

export type AdminBulkResult = {
  succeeded: Array<{ id: string; status?: string }>;
  failed: Array<{ id: string; error: string }>;
  partial: boolean;
};

export async function fetchOrderInvoiceBlob(orderId: string): Promise<Blob> {
  const { getAccessToken } = await import("@/lib/accessToken");
  const token = getAccessToken();
  const base = process.env.NEXT_PUBLIC_API_URL || "https://foodiq-2.onrender.com";
  const res = await fetch(`${base}/api/admin/orders/${orderId}/invoice`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to download invoice");
  return res.blob();
}

export async function fetchOrdersExportBlob(
  filters: AdminOrderFilters,
  format: "csv" | "pdf"
): Promise<Blob> {
  const { getAccessToken } = await import("@/lib/accessToken");
  const token = getAccessToken();
  const base = process.env.NEXT_PUBLIC_API_URL || "https://foodiq-2.onrender.com";
  const qs = buildOrdersQuery(filters);
  const res = await fetch(
    `${base}/api/admin/reports/export?type=orders&format=${format}${qs ? `&${qs}` : ""}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Admin Referral Program Types & APIs ─────────────────────────────────────
export type AdminReferralRecord = {
  id: string;
  referrer_partner_id: string;
  referred_partner_id?: string;
  referral_code: string;
  status: 'pending' | 'registered' | 'kyc_completed' | 'first_delivery_completed' | 'rewarded' | 'expired';
  reward_amount: number;
  reward_type: string;
  created_at: string;
  updated_at: string;
  referrer_name?: string;
  referrer_phone?: string;
  referred_name?: string;
  referred_phone?: string;
  referred_partner_status?: string;
  referred_kyc_approved?: boolean;
  reward_id?: string;
  reward_status?: string;
  credited_at?: string;
};

export type AdminReferralSettings = {
  id: string;
  default_reward_amount: number;
  reward_type: string;
  expiry_days: number;
  min_deliveries_required: number;
  auto_credit_enabled: boolean;
};

export type AdminReferralResponse = {
  total: number;
  referrals: AdminReferralRecord[];
  stats: {
    total_referrals: number;
    pending_count: number;
    registered_count: number;
    kyc_completed_count: number;
    first_delivery_count: number;
    rewarded_count: number;
    expired_count: number;
    total_payout: number;
  };
};

export async function fetchAdminReferrals(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminReferralResponse> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.search) sp.set('search', params.search);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const q = sp.toString() ? `?${sp}` : '';
  return adminGet<AdminReferralResponse>(`/api/admin/referrals${q}`);
}

export async function updateAdminReferral(
  id: string,
  body: { status?: string; force_credit?: boolean }
): Promise<any> {
  return adminPatch(`/api/admin/referrals/${id}`, body);
}

export async function fetchAdminReferralSettings(): Promise<AdminReferralSettings> {
  return adminGet<AdminReferralSettings>('/api/admin/referral-settings');
}

export async function updateAdminReferralSettings(
  body: Partial<AdminReferralSettings>
): Promise<AdminReferralSettings> {
  return adminPatch<AdminReferralSettings>('/api/admin/referral-settings', body);
}


