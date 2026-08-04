import api, { fetcher } from "@/services/api";

export type CustomerStatus = "active" | "blocked" | "suspended" | "deactivated";
export type VerificationStatus = "verified" | "unverified" | "pending";
export type CustomerTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "VIP";

export type Customer = {
  id: string;
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  city: string;
  state: string;
  pincode?: string;
  registrationDate: string;
  lastActiveAt?: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  status: CustomerStatus;
  isPremium: boolean;
  tier: CustomerTier;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalSpending: number;
  walletBalance: number;
  rewardPoints: number;
  referralCode?: string;
  gender?: string;
  dob?: string;
};

export type SavedAddress = {
  id: string;
  label: "Home" | "Work" | "Other" | "Friends & Family";
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  deliveryInstructions?: string;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  date: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage?: string;
  status: "Completed" | "Cancelled" | "Refunded" | "Pending" | "Scheduled" | "Preparing" | "Out for Delivery";
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
  itemsSummary: string;
  timeline: Array<{ status: string; timestamp: string; description: string }>;
  deliveryAddress: string;
  hasInvoice: boolean;
};

export type WalletTransaction = {
  id: string;
  type: "credit" | "debit" | "refund";
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  orderId?: string;
  createdAt: string;
  status: "success" | "pending" | "failed";
};

export type RefundRecord = {
  id: string;
  refundNumber: string;
  orderId: string;
  amount: number;
  reason: string;
  status: "processed" | "pending" | "rejected";
  paymentMethod: string;
  createdAt: string;
};

export type LoyaltyInfo = {
  rewardPoints: number;
  tier: CustomerTier;
  nextTierPointsNeeded: number;
  pointsEarnedTotal: number;
  pointsRedeemedTotal: number;
  referralCode: string;
  referralCount: number;
  referralBonusEarned: number;
  couponsUsed: Array<{
    code: string;
    discountAmount: number;
    orderId: string;
    usedAt: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    unlockedAt: string;
    icon: string;
  }>;
  referees: Array<{
    id: string;
    name: string;
    date: string;
    bonusEarned: number;
  }>;
};

export type CustomerSupportTicket = {
  id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  lastUpdated: string;
  orderId?: string;
  chatLog?: Array<{ sender: "customer" | "support" | "bot"; message: string; timestamp: string }>;
};

export type CustomerReview = {
  id: string;
  targetType: "restaurant" | "delivery_partner" | "food";
  targetName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  helpfulCount: number;
  isReported?: boolean;
};

export type NotificationPreferences = {
  sms: boolean;
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  promotions: boolean;
  orderUpdates: boolean;
  auditLogs: Array<{
    id: string;
    title: string;
    channel: string;
    sentAt: string;
    status: "delivered" | "failed" | "opened";
  }>;
};

export type CustomerStats = {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  blockedCustomers: number;
  verifiedCustomers: number;
  premiumCustomers: number;
  todaysRegistrations: number;
  monthlyRegistrations: number;
  averageOrders: number;
  totalRevenueGenerated: number;
};

export type CustomerFilters = {
  search?: string;
  status?: string;
  verification?: string;
  city?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  orderRange?: string;
  isPremium?: string;
  sortBy?: "newest" | "oldest" | "highest_spending" | "most_orders" | "highest_rewards";
  page?: number;
  limit?: number;
};

export type CustomerListResponse = {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function fetchCustomerStats(): Promise<CustomerStats> {
  const res = await api.get("/api/admin/customers/stats");
  return res.data.data;
}

export async function fetchCustomers(filters: CustomerFilters): Promise<CustomerListResponse> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.verification) params.set("verification", filters.verification);
  if (filters.city) params.set("city", filters.city);
  if (filters.state) params.set("state", filters.state);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.orderRange) params.set("orderRange", filters.orderRange);
  if (filters.isPremium) params.set("isPremium", filters.isPremium);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const q = params.toString();
  const url = `/api/admin/customers${q ? `?${q}` : ""}`;
  const res = await api.get(url);
  return res.data.data;
}

export async function fetchCustomerProfile(id: string): Promise<Customer> {
  const res = await api.get(`/api/admin/customers/${id}`);
  return res.data.data;
}

export async function updateCustomerStatus(
  id: string,
  payload: { status?: CustomerStatus; isVerified?: boolean; isPremium?: boolean }
): Promise<Customer> {
  const res = await api.put(`/api/admin/customers/${id}`, payload);
  return res.data.data;
}

export async function deleteCustomerAccount(id: string): Promise<void> {
  await api.delete(`/api/admin/customers/${id}`);
}

export async function resetCustomerPassword(id: string): Promise<{ temporaryPassword?: string; message: string }> {
  const res = await api.post(`/api/admin/customers/${id}/reset-password`, {});
  return res.data.data;
}

export async function adjustCustomerWallet(
  id: string,
  payload: { amount: number; type: "credit" | "debit"; reason: string }
): Promise<{ newBalance: number }> {
  const res = await api.post(`/api/admin/customers/${id}/wallet`, payload);
  return res.data.data;
}

export async function performBulkCustomerActions(payload: {
  action: "verify" | "block" | "unblock" | "delete";
  customerIds: string[];
}): Promise<{ affectedCount: number; message?: string }> {
  const res = await api.post("/api/admin/customers/bulk", payload);
  return res.data.data;
}

export { adminFetcher as customerFetcher } from "@/services/adminApi";
