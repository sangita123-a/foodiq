import api, { fetcher } from "@/services/api";

export const loyaltyFetcher = fetcher;

export type MembershipTier = {
  slug: string;
  name: string;
  min_lifetime_points: number;
  benefits: {
    free_delivery?: boolean;
    extra_discount_percent?: number;
    priority_support?: boolean;
    exclusive_coupons?: boolean;
    birthday_reward_points?: number;
  };
};

export type LoyaltyWallet = {
  points_balance: number;
  lifetime_points: number;
  redeemed_points: number;
  next_expiry: string | null;
  expiring_soon_points: number;
  tier: {
    current: MembershipTier;
    next: { slug: string; name: string; min_lifetime_points: number; points_needed: number } | null;
    lifetime_points: number;
    progress_percent: number;
  };
  points_to_rupee_rate: number;
};

export type LoyaltyHistoryItem = {
  id: string;
  points: number;
  transaction_type: string;
  source?: string;
  created_at?: string;
  expires_at?: string;
};

export type LoyaltyOverview = {
  wallet: LoyaltyWallet;
  membership: LoyaltyWallet["tier"];
  referral: {
    code: string;
    reward_points: number;
    history: Array<Record<string, unknown>>;
  };
  coupons: Array<Record<string, unknown>>;
  history: LoyaltyHistoryItem[];
  earn_rules: Array<{ rule_key: string; label: string; points: number; multiplier?: number }>;
};

export async function fetchLoyaltyOverview() {
  const res = await api.get("/api/loyalty/overview");
  return res.data.data as LoyaltyOverview;
}

export async function fetchLoyaltyWallet() {
  const res = await api.get("/api/loyalty/wallet");
  return res.data.data as LoyaltyWallet;
}

export async function redeemLoyaltyPoints(points: number) {
  const res = await api.post("/api/loyalty/redeem", { points_to_redeem: points });
  return res.data.data as { coupon: { code: string }; discount_amount: number };
}

export async function previewLoyaltyCheckout(body: {
  subtotal: number;
  points_to_redeem?: number;
  redemption_type?: string;
}) {
  const res = await api.post("/api/loyalty/checkout-preview", body);
  return res.data.data;
}

export function formatPoints(n: number) {
  return Number(n || 0).toLocaleString("en-IN");
}

export function pointsToRupees(points: number, rate = 10) {
  return points / rate;
}

export const TIER_COLORS: Record<string, string> = {
  silver: "from-gray-400 to-gray-600 border-gray-400/30",
  gold: "from-yellow-400 to-yellow-600 border-yellow-500/30",
  platinum: "from-indigo-400 to-purple-600 border-indigo-500/30",
};

export const SOURCE_LABELS: Record<string, string> = {
  order_delivered: "Order Delivered",
  referral: "Referral Bonus",
  referral_welcome: "Welcome Referral",
  first_order: "First Order Bonus",
  campaign: "Festival Campaign",
  birthday: "Birthday Reward",
  review: "Review Submitted",
  daily_login: "Daily Login",
  signup: "Welcome Bonus",
  checkout_redemption: "Checkout Redemption",
  manual_redeem: "Points Redeemed",
  admin_adjustment: "Admin Adjustment",
  expired: "Points Expired",
};
