import api from "./api";

export type PushCampaignPayload = {
  audience?: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  user_ids?: string[];
  city?: string;
  restaurant_id?: string;
  schedule_at?: string | null;
};

export type ScheduledCampaign = {
  id: string;
  name: string;
  audience: string;
  subject?: string;
  message: string;
  status: string;
  scheduled_at?: string;
  sent_count?: number;
  created_at: string;
};

export type PushTargetOptions = {
  cities: string[];
  restaurants: Array<{ id: string; name: string; city?: string }>;
};

export const fetchNotifications = async (params?: Record<string, string>) => {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const res = await api.get(`/api/notifications${qs}`);
  return res.data.data;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const res = await api.get("/api/notifications/unread-count");
  return res.data.data?.unread_count || 0;
};

export const markNotificationRead = async (id: string) => {
  const res = await api.put(`/api/notifications/${id}/read`);
  return res.data.data;
};

export const markAllNotificationsRead = async () => {
  const res = await api.put("/api/notifications/read-all");
  return res.data.data;
};

export const registerDeviceToken = async (token: string, platform = "web") => {
  const res = await api.post("/api/notifications/device-token", { token, platform });
  return res.data.data;
};

export const fetchPushConfig = async () => {
  const res = await api.get("/api/notifications/push-config");
  return res.data.data;
};

export const sendPushCampaign = async (payload: PushCampaignPayload) => {
  const res = await api.post("/api/admin/notifications/push", payload);
  return res.data.data as { scheduled?: boolean; sent?: number; campaign?: ScheduledCampaign };
};

export const fetchScheduledCampaigns = async (): Promise<ScheduledCampaign[]> => {
  const res = await api.get("/api/admin/notifications/push/scheduled");
  return res.data.data || [];
};

export const fetchPushTargetOptions = async (): Promise<PushTargetOptions> => {
  const res = await api.get("/api/admin/notifications/push/targets");
  return res.data.data;
};

export const MARKETING_NOTIFICATION_TYPES = [
  { value: "new_offer", label: "New Offer" },
  { value: "festival_discount", label: "Festival Discount" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "coupon_alert", label: "Coupon Alert" },
] as const;

export const PUSH_AUDIENCES = [
  { value: "all", label: "All Users" },
  { value: "customers", label: "Customers" },
  { value: "restaurants", label: "Restaurant Partners" },
  { value: "delivery", label: "Delivery Partners" },
] as const;
