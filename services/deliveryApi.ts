import api, { fetcher } from "@/services/api";

export type DeliveryOrder = {
  id: string;
  order_id?: string;
  order_status: string;
  payment_status?: string;
  delivery_partner_id?: string | null;
  assigned_at?: string | null;
  assignment_id?: string | null;
  assignment_status?: string | null;
  offered_at?: string | null;
  expires_at?: string | null;
  total_amount: number;
  delivery_fee: number;
  estimated_earnings?: number;
  item_count?: number;
  distance?: string;
  estimated_delivery_time?: string;
  restaurant: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    image?: string;
    lat: number;
    lng: number;
  };
  restaurant_name?: string;
  restaurant_address?: string;
  customer_name?: string;
  customer_address?: string;
  customer: {
    name: string;
    phone?: string;
    address: string;
    lat: number;
    lng: number;
  };
  delivery_instructions?: string | null;
  created_at: string;
  items?: Array<{ name: string; quantity: number; price_at_time: number }>;
  order_items?: Array<{ name: string; quantity: number; price_at_time: number }>;
};

export type PartnerReviewStats = {
  average_rating: number;
  total_reviews: number;
  breakdown: Array<{ star: number; count: number }>;
  five_star_percentage: number;
  latest_review: {
    id: string;
    rating: number;
    review?: string | null;
    customer_name?: string;
    created_at?: string;
  } | null;
};

export type DeliveryDashboard = {
  partner: Record<string, unknown>;
  is_online: boolean;
  rating: number;
  earnings_today: number;
  earnings_weekly: number;
  earnings_monthly: number;
  completed_today: number;
  completed_total: number;
  pending_deliveries?: number;
  cancelled_total?: number;
  total_earnings?: number;
  wallet_balance?: number;
  assigned_orders: DeliveryOrder[];
  available_orders: DeliveryOrder[];
  review_stats?: PartnerReviewStats | null;
};

export type DeliveryEarnings = {
  summary: {
    daily: number;
    weekly: number;
    monthly: number;
    incentives_month: number;
    total?: number;
  };
  history: Array<{
    id: string;
    order_id: string;
    amount: number;
    base_fee: number;
    incentive: number;
    note?: string;
    earned_at: string;
    restaurant_name?: string;
    total_amount?: number;
  }>;
};

export type DeliveryRoute = {
  restaurant: { lat: number; lng: number; name?: string; address?: string };
  customer: { lat: number; lng: number; name?: string; address?: string };
  partner_location: { lat: number; lng: number };
  distance_km: number | null;
  duration_min: number | null;
  osm_embed_url: string;
  osm_directions_url: string;
  google_maps_url?: string;
  google_maps_pickup_url?: string;
  google_maps_dropoff_url?: string;
};

export type DeliveryWallet = {
  available_balance: number;
  pending_balance: number;
  lifetime_earnings: number;
  today_earnings: number;
  weekly_earnings: number;
  monthly_earnings: number;
};

export type DeliveryTransaction = {
  id: string;
  order_id: string | null;
  type: "credit" | "debit";
  amount: number;
  description: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
};

export type DeliveryTransactionsResponse = {
  transactions: DeliveryTransaction[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

export type DeliveryHistoryItem = {
  id: string;
  order_id: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  restaurant_name: string;
  customer_name: string;
  customer_address?: string;
  customer_rating?: number;
  customer_comment?: string;
  updated_at: string;
};

export type DeliveryNotification = {
  id: string;
  title: string;
  message: string;
  is_read?: boolean;
  created_at: string;
};

export type DeliveryNotificationType =
  | "new_order"
  | "order_assigned"
  | "order_cancelled"
  | "order_updated"
  | "delivery_completed"
  | "wallet_credit"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "kyc_approved"
  | "kyc_rejected"
  | "admin_message"
  | "support_ticket_reply"
  | "support_ticket_resolved";

export type DeliveryNotificationCategory = "Orders" | "Wallet" | "KYC" | "System" | "Support";

export type DeliveryNotificationItem = {
  id: string;
  partner_id: string;
  title: string;
  message: string;
  type: DeliveryNotificationType;
  category: DeliveryNotificationCategory;
  related_order_id: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
};

export type DeliveryNotificationsResponse = {
  notifications: DeliveryNotificationItem[];
  unread_count: number;
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

export type DeliveryDocumentType =
  | "aadhaar"
  | "pan"
  | "driving_license"
  | "rc"
  | "insurance"
  | "profile_photo";

export type DeliveryDocument = {
  id: string;
  partner_id: string;
  document_type: DeliveryDocumentType;
  document_number: string | null;
  file_url: string;
  verification_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  expiry_date: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DeliveryKycSummary = {
  documents: DeliveryDocument[];
  required_types: DeliveryDocumentType[];
  expiry_tracked_types: DeliveryDocumentType[];
  is_verified: boolean;
  missing_types: DeliveryDocumentType[];
  pending_types: DeliveryDocumentType[];
  rejected_types: DeliveryDocumentType[];
  expired_types: DeliveryDocumentType[];
};

export const deliveryFetcher = fetcher;

export async function fetchDeliveryDocuments() {
  const res = await api.get("/api/delivery/documents");
  return res.data.data as DeliveryKycSummary;
}

export async function uploadDeliveryDocument(
  file: File,
  documentType: DeliveryDocumentType,
  options?: { documentNumber?: string; expiryDate?: string; onProgress?: (pct: number) => void }
) {
  const form = new FormData();
  form.append("file", file);
  form.append("document_type", documentType);
  if (options?.documentNumber) form.append("document_number", options.documentNumber);
  if (options?.expiryDate) form.append("expiry_date", options.expiryDate);

  const res = await api.post("/api/delivery/documents/upload", form, {
    timeout: 60000,
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!options?.onProgress || !evt.total) return;
      options.onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return res.data.data as DeliveryDocument;
}

export async function setDeliveryAvailability(is_available: boolean) {
  const res = await api.put("/api/delivery/availability", { is_available });
  return res.data.data;
}

export async function updateDeliveryLocation(lat: number, lng: number) {
  const res = await api.put("/api/delivery/location", { lat, lng });
  return res.data.data;
}

export type DeliveryLocationPing = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  order_id?: string | null;
};

export type DeliveryLocationResult = {
  id: string;
  partner_id: string;
  order_id: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  created_at: string;
  distance_km: number | null;
  eta_minutes: number | null;
};

/** POST /api/delivery/location/update — full GPS ping (Live Delivery Tracking). */
export async function updateDeliveryLocationDetailed(payload: DeliveryLocationPing) {
  const res = await api.post("/api/delivery/location/update", payload);
  return res.data.data as DeliveryLocationResult;
}

export async function acceptDeliveryOrder(orderId: string) {
  const res = await api.post(`/api/delivery/orders/${orderId}/accept`);
  return res.data.data as DeliveryOrder;
}

export async function rejectDeliveryOrder(orderId: string) {
  const res = await api.post(`/api/delivery/orders/${orderId}/reject`);
  return res.data.data;
}

export async function updateDeliveryStatus(orderId: string, status: string) {
  const res = await api.put(`/api/delivery/orders/${orderId}/status`, { status });
  return res.data.data as DeliveryOrder;
}

export async function reachRestaurantOrder(orderId: string) {
  const res = await api.patch(`/api/delivery/orders/${orderId}/reached-restaurant`);
  return res.data.data as DeliveryOrder;
}

export async function pickUpOrder(orderId: string) {
  const res = await api.patch(`/api/delivery/orders/${orderId}/picked-up`);
  return res.data.data as DeliveryOrder;
}

export async function outForDeliveryOrder(orderId: string) {
  const res = await api.patch(`/api/delivery/orders/${orderId}/out-for-delivery`);
  return res.data.data as DeliveryOrder;
}

export async function deliverOrder(orderId: string) {
  const res = await api.patch(`/api/delivery/orders/${orderId}/delivered`);
  return res.data.data as DeliveryOrder;
}

export async function verifyDeliveryOrderOtp(orderId: string, otp: string) {
  const res = await api.post(`/api/delivery/orders/${orderId}/verify-otp`, { otp });
  return res.data.data as DeliveryOrder;
}

export async function fetchDeliveryWallet() {
  const res = await api.get("/api/delivery/wallet");
  return res.data.data as DeliveryWallet;
}

export async function fetchDeliveryTransactions(params?: {
  page?: number;
  limit?: number;
  type?: "credit" | "debit" | "";
  status?: "pending" | "completed" | "failed" | "";
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.type) sp.set("type", params.type);
  if (params?.status) sp.set("status", params.status);
  const qs = sp.toString();
  const res = await api.get(`/api/delivery/transactions${qs ? `?${qs}` : ""}`);
  return res.data.data as DeliveryTransactionsResponse;
}

export async function requestWalletWithdrawal(amount: number, bankAccountId?: string) {
  const res = await api.post("/api/delivery/withdraw", {
    amount,
    bank_account_id: bankAccountId,
  });
  return res.data.data;
}

/* ── Bank Account & Payout Management ────────────────────────────────────── */

export type DeliveryBankAccountType = "savings" | "current";
export type DeliveryBankAccountVerificationStatus = "pending" | "approved" | "rejected";

export type DeliveryBankAccount = {
  id: string;
  partner_id: string;
  account_holder_name: string;
  account_number_masked: string;
  bank_name: string;
  ifsc_code: string;
  account_type: DeliveryBankAccountType;
  upi_id: string | null;
  is_primary: boolean;
  verification_status: DeliveryBankAccountVerificationStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type DeliveryBankAccountInput = {
  account_holder_name: string;
  account_number: string;
  confirm_account_number: string;
  bank_name: string;
  ifsc_code: string;
  account_type: DeliveryBankAccountType;
  upi_id?: string;
};

/** GET /api/delivery/bank-account — the authenticated partner's primary bank account (or null). */
export async function fetchDeliveryBankAccount() {
  const res = await api.get("/api/delivery/bank-account");
  return (res.data.data ?? null) as DeliveryBankAccount | null;
}

/** POST /api/delivery/bank-account — add, or safely replace the existing, primary bank account. */
export async function addDeliveryBankAccount(input: DeliveryBankAccountInput) {
  const res = await api.post("/api/delivery/bank-account", input);
  return res.data.data as DeliveryBankAccount;
}

export async function updateDeliveryBankAccount(
  id: string,
  input: Partial<DeliveryBankAccountInput>
) {
  const res = await api.patch(`/api/delivery/bank-account/${id}`, input);
  return res.data.data as DeliveryBankAccount;
}

export async function deleteDeliveryBankAccount(id: string) {
  await api.delete(`/api/delivery/bank-account/${id}`);
}

export async function fetchDeliveryHistory(status: "all" | "completed" | "cancelled" = "all") {
  const res = await api.get(`/api/delivery/history?status=${status}`);
  return res.data.data as DeliveryHistoryItem[];
}

export async function updateDeliveryProfile(body: Record<string, unknown>) {
  const res = await api.put("/api/delivery/profile", body);
  return res.data.data;
}

/** GET /api/delivery/notifications — paginated, filterable list. */
export async function fetchDeliveryNotifications(params?: {
  page?: number;
  limit?: number;
  unread?: boolean;
  type?: DeliveryNotificationType | "";
  category?: DeliveryNotificationCategory | "All" | "";
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.unread) sp.set("unread", "true");
  if (params?.type) sp.set("type", params.type);
  if (params?.category && params.category !== "All") sp.set("category", params.category);
  const qs = sp.toString();
  const res = await api.get(`/api/delivery/notifications${qs ? `?${qs}` : ""}`);
  return res.data.data as DeliveryNotificationsResponse;
}

export async function markDeliveryNotificationRead(id: string) {
  const res = await api.patch(`/api/delivery/notifications/${id}/read`);
  return res.data.data as DeliveryNotificationItem;
}

export async function markAllDeliveryNotificationsRead() {
  const res = await api.patch("/api/delivery/notifications/read-all");
  return res.data.data as { updated: number };
}

export async function deleteDeliveryNotification(id: string) {
  await api.delete(`/api/delivery/notifications/${id}`);
}

/* ── Support Tickets ─────────────────────────────────────────────────────── */

export type DeliverySupportStatus = "open" | "pending" | "resolved" | "closed";

export type DeliverySupportTicket = {
  id: string;
  partner_id: string;
  subject: string;
  description: string;
  status: DeliverySupportStatus;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
};

export type DeliverySupportTicketsResponse = {
  tickets: DeliverySupportTicket[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

export async function createSupportTicket(subject: string, description: string) {
  const res = await api.post("/api/delivery/support", { subject, description });
  return res.data.data as DeliverySupportTicket;
}

export async function fetchSupportTickets(params?: {
  page?: number;
  limit?: number;
  status?: DeliverySupportStatus | "";
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.status) sp.set("status", params.status);
  const qs = sp.toString();
  const res = await api.get(`/api/delivery/support${qs ? `?${qs}` : ""}`);
  return res.data.data as DeliverySupportTicketsResponse;
}

export function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatRelativeTime(iso: string | Date | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export const STATUS_LABELS: Record<string, string> = {
  offered: "Offer Pending",
  assigned: "Assigned",
  accepted: "Accepted",
  reached_restaurant: "Reached Restaurant",
  picked_up: "Food Picked Up",
  on_the_way: "On The Way",
  near_customer: "Near Customer",
  delivered: "Delivered",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const NEXT_STATUS: Record<string, string | null> = {
  offered: "accepted",
  assigned: "accepted",
  accepted: "reached_restaurant",
  reached_restaurant: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "near_customer",
  near_customer: "delivered",
  delivered: null,
};

/* ── Shift Scheduling Module Types & APIs ───────────────────────────────── */

export type DeliveryShift = {
  id: string;
  partner_id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  working_days: string[];
  status: "scheduled" | "active" | "completed" | "cancelled";
  is_recurring: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
  partner_name?: string;
  partner_email?: string;
  partner_phone?: string;
  today_status?: "checked_in" | "completed" | "not_checked_in";
};

export type DeliveryShiftLog = {
  id: string;
  shift_id: string | null;
  partner_id: string;
  check_in: string;
  check_out: string | null;
  total_hours: number;
  late_minutes: number;
  early_checkout: boolean;
  gps_latitude: number | null;
  gps_longitude: number | null;
  created_at: string;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
};

export type DeliveryAttendanceStats = {
  working_hours: number;
  total_check_ins: number;
  scheduled_shifts: number;
  attendance_percentage: number;
  late_days: number;
  early_checkouts: number;
  overtime_hours: number;
  missed_shifts: number;
  break_minutes: number;
  grace_period_minutes: number;
};

export type DeliveryAttendanceResponse = {
  stats: DeliveryAttendanceStats;
  logs: DeliveryShiftLog[];
};

export type DeliveryShiftBreak = {
  id: string;
  shift_log_id: string;
  partner_id: string;
  break_start: string;
  break_end: string | null;
  duration_minutes: number | null;
  created_at: string;
};

export type DeliveryShiftAttendanceDay = {
  id: string;
  partner_id: string;
  shift_id: string | null;
  attendance_date: string;
  status: "scheduled" | "present" | "late" | "missed";
  first_check_in: string | null;
  last_check_out: string | null;
  working_minutes: number;
  break_minutes: number;
  late_minutes: number;
  overtime_minutes: number;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
};

export type DeliveryShiftHistoryResponse = {
  attendance: DeliveryShiftAttendanceDay[];
  breaks: DeliveryShiftBreak[];
};

export type DeliveryTodayShiftResponse = {
  shift: DeliveryShift | null;
  active_log: DeliveryShiftLog | null;
  active_break: DeliveryShiftBreak | null;
};

export async function fetchDeliveryShifts(): Promise<{ shifts: DeliveryShift[] }> {
  const res = await api.get("/api/delivery/shifts");
  return res.data.data;
}

export async function fetchTodayShift(): Promise<DeliveryTodayShiftResponse> {
  const res = await api.get("/api/delivery/shifts/today");
  return res.data.data;
}

export async function checkInShift(data: { shift_id?: string; lat: number; lng: number }) {
  const res = await api.post("/api/delivery/shifts/check-in", data);
  return res.data.data as { log: DeliveryShiftLog; shift: DeliveryShift };
}

export async function checkOutShift(data: { lat: number; lng: number }) {
  const res = await api.post("/api/delivery/shifts/check-out", data);
  return res.data.data as { log: DeliveryShiftLog };
}

export async function startShiftBreak() {
  const res = await api.post("/api/delivery/shifts/break/start");
  return res.data.data as { break: DeliveryShiftBreak };
}

export async function endShiftBreak() {
  const res = await api.post("/api/delivery/shifts/break/end");
  return res.data.data as { break: DeliveryShiftBreak };
}

export async function fetchDeliveryAttendance(limit = 30): Promise<DeliveryAttendanceResponse> {
  const res = await api.get(`/api/delivery/attendance?limit=${limit}`);
  return res.data.data;
}

export async function fetchDeliveryShiftHistory(limit = 90): Promise<DeliveryShiftHistoryResponse> {
  const res = await api.get(`/api/delivery/shifts/history?limit=${limit}`);
  return res.data.data;
}

export type DeliveryAnalyticsSummary = {
  range: string;
  completed_orders: number;
  cancelled_orders: number;
  acceptance_rate: number;
  completion_rate: number;
  success_rate: number;
  average_rating: number;
  average_delivery_time_mins: number;
  total_distance_km: number;
  total_online_hours: number;
  active_hours: number;
  idle_hours: number;
  peak_delivery_hours: Array<{ hour: number; count: number }>;
  most_active_area: string;
  area_statistics: Array<{ area_name: string; count: number }>;
  earnings: number;
  tips: number;
  bonuses: number;
  total_earnings: number;
  average_earnings_per_order: number;
  wallet_growth: number;
};

export type DeliveryPerformanceScore = {
  partner_id: string;
  score: number;
  breakdown: {
    acceptance: number;
    completion: number;
    rating: number;
    fraud_cleanliness: number;
    attendance: number;
    customer_feedback: number;
  };
  metrics: DeliveryAnalyticsSummary;
  last_updated: string;
};

export type DeliveryPerformanceAuditLog = {
  id: string;
  partner_id: string;
  metric: string;
  old_value: number;
  new_value: number;
  reason: string;
  created_at: string;
};

export async function fetchDeliveryAnalytics(range = 'this_month'): Promise<DeliveryAnalyticsSummary> {
  const res = await api.get(`/api/delivery/analytics?range=${range}`);
  return res.data.data;
}

export async function fetchDeliveryPerformance(): Promise<DeliveryPerformanceScore> {
  const res = await api.get(`/api/delivery/analytics/performance`);
  return res.data.data;
}

export async function fetchDeliveryPerformanceHistory(limit = 50, offset = 0): Promise<DeliveryPerformanceAuditLog[]> {
  const res = await api.get(`/api/delivery/analytics/history?limit=${limit}&offset=${offset}`);
  return res.data.data;
}

export async function fetchDeliveryReport(period: 'daily' | 'weekly' | 'monthly', format: 'json' | 'csv' | 'pdf' = 'json') {
  if (format === 'csv' || format === 'pdf') {
    window.open(`/api/delivery/reports/${period}?format=${format}`, '_blank');
    return null;
  }
  const res = await api.get(`/api/delivery/reports/${period}?format=json`);
  return res.data.data;
}

// ── Referral Program Types & APIs ───────────────────────────────────────────
export type ReferralHistoryItem = {
  id: string;
  referrer_partner_id: string;
  referred_partner_id?: string;
  referral_code: string;
  status: 'pending' | 'registered' | 'kyc_completed' | 'first_delivery_completed' | 'rewarded' | 'expired';
  reward_amount: number;
  reward_type: string;
  created_at: string;
  updated_at: string;
  referred_name?: string;
  referred_phone?: string;
  registered_at?: string;
};

export type ReferralRewardItem = {
  id: string;
  partner_id: string;
  referral_id: string;
  amount: number;
  wallet_transaction_id?: string;
  status: 'pending' | 'credited' | 'cancelled';
  credited_at?: string;
  created_at: string;
  referral_code?: string;
  referred_name?: string;
};

export type ReferralLeaderboardItem = {
  rank: number;
  partner_id: string;
  full_name: string;
  completed_count: number;
  total_earned: number;
};

export type ReferralSummary = {
  referral_code: string;
  default_reward_amount: number;
  stats: {
    total_referrals: number;
    pending_referrals: number;
    completed_referrals: number;
    total_earned: number;
    leaderboard_position: number;
  };
  history: ReferralHistoryItem[];
  rewards: ReferralRewardItem[];
  leaderboard: ReferralLeaderboardItem[];
};

export type ReferralSharePayload = {
  referralCode: string;
  platform: string;
  text: string;
  shareUrl: string;
};

export async function fetchDeliveryReferral(): Promise<ReferralSummary> {
  const res = await api.get('/api/delivery/referral');
  return res.data.data;
}

export async function fetchDeliveryReferralHistory(): Promise<{ history: ReferralHistoryItem[]; stats: any }> {
  const res = await api.get('/api/delivery/referral/history');
  return res.data.data;
}

export async function fetchDeliveryReferralRewards(): Promise<{ rewards: ReferralRewardItem[]; total_earned: number }> {
  const res = await api.get('/api/delivery/referral/rewards');
  return res.data.data;
}

export async function shareDeliveryReferral(platform = 'whatsapp'): Promise<ReferralSharePayload> {
  const res = await api.post('/api/delivery/referral/share', { platform });
  return res.data.data;
}



