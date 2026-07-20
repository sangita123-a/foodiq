import api from "./api";

export type CouponRecord = {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  coupon_type?: string;
  min_order_amount?: number;
  max_discount_amount?: number;
  valid_until?: string | null;
  title?: string | null;
  description?: string | null;
  one_time_per_user?: boolean;
  usage_limit?: number | null;
};

export type CouponHistoryRecord = {
  id: string;
  coupon_code: string;
  discount_amount: number;
  final_price: number;
  created_at: string;
  title?: string;
  coupon_type?: string;
};

export type MyRewardsData = {
  available_coupons: CouponRecord[];
  saved_coupons: Array<CouponRecord & { status?: string }>;
  coupon_history: CouponHistoryRecord[];
  referral: {
    code: string;
    reward_points: number;
    earnings: {
      total_points: number;
      credited_count: number;
      pending_count: number;
    };
    history: Array<{
      referee_name?: string;
      status?: string;
      points_awarded?: number;
      created_at?: string;
    }>;
  };
};

export const fetchCoupons = async (): Promise<CouponRecord[]> => {
  const res = await api.get("/api/coupons");
  return res.data.data || [];
};

export const fetchMyRewards = async (): Promise<MyRewardsData> => {
  const res = await api.get("/api/coupons/my-rewards");
  return res.data.data;
};

export const saveCouponToWallet = async (code: string) => {
  const res = await api.post("/api/coupons/save", { code });
  return res.data.data;
};

export const couponTypeLabel = (coupon: CouponRecord): string => {
  const type = coupon.coupon_type || (coupon.discount_type === "fixed" ? "flat" : "percentage");
  const labels: Record<string, string> = {
    flat: "Flat Discount",
    percentage: "Percentage Discount",
    free_delivery: "Free Delivery",
    first_order: "First Order Offer",
    festival: "Festival Offer",
  };
  return labels[type] || "Special Offer";
};

export const couponDiscountText = (coupon: CouponRecord): string => {
  const type = coupon.coupon_type || coupon.discount_type;
  if (type === "free_delivery") return "Free Delivery";
  if (coupon.discount_type === "percentage" || type === "percentage" || type === "festival") {
    return `${coupon.discount_amount}% OFF`;
  }
  return `₹${coupon.discount_amount} OFF`;
};
