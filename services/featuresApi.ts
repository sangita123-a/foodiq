import api from "@/services/api";

export async function fetchFeatureFlags() {
  try {
    const res = await api.get("/api/features/flags");
    return (res.data?.data || {}) as Record<string, boolean>;
  } catch {
    return {} as Record<string, boolean>;
  }
}

export async function fetchPersonalizedHome(params?: {
  lat?: number;
  lng?: number;
}) {
  const res = await api.get("/api/features/home", { params });
  return res.data.data;
}

export async function fetchSearchSuggest(q: string, limit = 8) {
  if (!q || q.trim().length < 2) return [];
  const res = await api.get("/api/search/suggest", {
    params: { q: q.trim(), limit },
  });
  return (res.data?.data || []) as Array<{
    type: string;
    id: string;
    name: string;
    image_url?: string;
    subtitle?: string;
  }>;
}

export async function fetchCollections() {
  const res = await api.get("/api/features/collections");
  return res.data.data as Array<Record<string, unknown>>;
}

export async function fetchCollection(slug: string) {
  const res = await api.get(`/api/features/collections/${slug}`);
  return res.data.data;
}

export async function fetchTrendingNearYou(params?: {
  lat?: number;
  lng?: number;
  city?: string;
}) {
  const res = await api.get("/api/features/trending", { params });
  return res.data.data;
}

export async function fetchRecommendations(limit = 8) {
  const res = await api.get("/api/features/recommendations", {
    params: { limit },
  });
  return res.data.data;
}

export async function fetchCouponRecommendations(cartTotal: number) {
  const res = await api.get("/api/features/coupons/recommend", {
    params: { cart_total: cartTotal },
  });
  return res.data.data;
}

export async function fetchWishlist() {
  const res = await api.get("/api/features/wishlist");
  return res.data.data as Array<Record<string, unknown>>;
}

export async function addToWishlist(menuItemId: string) {
  const res = await api.post("/api/features/wishlist", {
    menu_item_id: menuItemId,
  });
  return res.data.data;
}

export async function removeFromWishlist(menuItemId: string) {
  await api.delete(`/api/features/wishlist/${menuItemId}`);
}

export async function recordView(itemType: "restaurant" | "menu_item", itemId: string) {
  try {
    await api.post("/api/features/views", {
      item_type: itemType,
      item_id: itemId,
    });
  } catch {
    /* ignore */
  }
}

export async function fetchRecentlyViewed() {
  const res = await api.get("/api/features/views/recent");
  return res.data.data as Array<Record<string, unknown>>;
}

export async function fetchReferral() {
  const res = await api.get("/api/features/referral");
  return res.data.data as {
    code: string;
    reward_points: number;
    history: Array<Record<string, unknown>>;
  };
}

export async function purchaseGiftCard(amount: number, recipientEmail?: string) {
  const res = await api.post("/api/features/gift-cards/purchase", {
    amount,
    recipient_email: recipientEmail,
  });
  return res.data.data;
}

export async function redeemGiftCard(code: string, amount?: number) {
  const res = await api.post("/api/features/gift-cards/redeem", {
    code,
    amount,
  });
  return res.data.data;
}

export async function reorderOrder(orderId: string) {
  const res = await api.post(`/api/orders/${orderId}/reorder`);
  return res.data.data;
}

export async function fetchCampaigns() {
  const res = await api.get("/api/features/campaigns");
  return (res.data?.data || []) as Array<Record<string, unknown>>;
}
