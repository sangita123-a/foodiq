import api, { fetcher } from "@/services/api";

export type DeliveryOrder = {
  id: string;
  order_status: string;
  assignment_id?: string | null;
  assignment_status?: string | null;
  offered_at?: string | null;
  expires_at?: string | null;
  total_amount: number;
  delivery_fee: number;
  delivery_instructions?: string | null;
  created_at: string;
  restaurant: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    image?: string;
    lat: number;
    lng: number;
  };
  customer: {
    name: string;
    phone?: string;
    address: string;
    lat: number;
    lng: number;
  };
  items?: Array<{ name: string; quantity: number; price_at_time: number }>;
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
  assigned_orders: DeliveryOrder[];
  available_orders: DeliveryOrder[];
};

export type DeliveryEarnings = {
  summary: {
    daily: number;
    weekly: number;
    monthly: number;
    incentives_month: number;
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
};

export type DeliveryNotification = {
  id: string;
  title: string;
  message: string;
  is_read?: boolean;
  created_at: string;
};

export const deliveryFetcher = fetcher;

export async function setDeliveryAvailability(is_available: boolean) {
  const res = await api.put("/api/delivery/availability", { is_available });
  return res.data.data;
}

export async function updateDeliveryLocation(lat: number, lng: number) {
  const res = await api.put("/api/delivery/location", { lat, lng });
  return res.data.data;
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
  picked_up: "Picked Up",
  on_the_way: "On The Way",
  delivered: "Delivered",
  rejected: "Rejected",
  expired: "Expired",
};

export const NEXT_STATUS: Record<string, string | null> = {
  offered: "accepted",
  assigned: "accepted",
  accepted: "reached_restaurant",
  reached_restaurant: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "delivered",
  delivered: null,
};
