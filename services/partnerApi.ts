import api, { fetcher } from "@/services/api";
import type { Order, OrderStatus } from "@/components/partner/orders/types";

export type PartnerDashboardData = {
  restaurant: Record<string, unknown>;
  stats: {
    totalOrders: number;
    todaysOrders: number;
    todaysRevenue: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    activeMenuItems: number;
    averageRating: number;
  };
  topDishes: Array<{
    id: string;
    name: string;
    image_url?: string;
    price: number;
    rating?: number;
    orders_count: number;
    revenue: number;
  }>;
  recentOrders: Order[];
};

export type PartnerMenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number | null;
  image_url?: string | null;
  category_name?: string | null;
  is_vegetarian?: boolean;
  is_available?: boolean;
  is_trending?: boolean;
  is_bestseller?: boolean;
  rating?: number;
  orders_count?: number;
  updated_at?: string;
};

export type PartnerAnalytics = {
  daily: Array<{ day: string; orders: number; revenue: number }>;
  weekly: Array<{ week_start: string; orders: number; revenue: number }>;
  monthly: Array<{ month_start: string; orders: number; revenue: number }>;
  top_dishes: PartnerDashboardData["topDishes"];
};

export const partnerFetcher = fetcher;

export async function fetchPartnerDashboard() {
  const res = await api.get("/api/partner/dashboard");
  return res.data.data as PartnerDashboardData;
}

export async function fetchPartnerOrders() {
  const res = await api.get("/api/partner/orders");
  return res.data.data as Order[];
}

export async function updatePartnerOrderStatus(orderId: string, status: OrderStatus) {
  const res = await api.put(`/api/partner/orders/${orderId}/status`, { status });
  return res.data.data as Order;
}

export async function fetchPartnerMenu() {
  const res = await api.get("/api/partner/menu");
  return res.data.data as {
    items: PartnerMenuItem[];
    categories: Array<{ id: string; name: string }>;
  };
}

export async function createPartnerDish(payload: Record<string, unknown>) {
  const res = await api.post("/api/partner/menu", payload);
  return res.data.data as PartnerMenuItem;
}

export async function updatePartnerDish(id: string, payload: Record<string, unknown>) {
  const res = await api.put(`/api/partner/menu/${id}`, payload);
  return res.data.data as PartnerMenuItem;
}

export async function deletePartnerDish(id: string) {
  await api.delete(`/api/partner/menu/${id}`);
}

export async function fetchPartnerProfile() {
  const res = await api.get("/api/partner/profile");
  return res.data.data as Record<string, unknown>;
}

export async function updatePartnerProfile(payload: Record<string, unknown>) {
  const res = await api.put("/api/partner/profile", payload);
  return res.data.data as Record<string, unknown>;
}

export async function fetchPartnerAnalytics() {
  const res = await api.get("/api/partner/analytics");
  return res.data.data as PartnerAnalytics;
}

export async function fetchPartnerNotifications() {
  const res = await api.get("/api/partner/notifications");
  return res.data.data as Array<{
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }>;
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

export function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
