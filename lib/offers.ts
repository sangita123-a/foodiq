export type ActiveOffer = {
  slug?: string;
  couponCode: string;
  title: string;
  restaurantId?: string;
};

const ACTIVE_OFFER_KEY = "foodiq_active_offer";

export function setActiveOffer(offer: ActiveOffer) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ACTIVE_OFFER_KEY, JSON.stringify(offer));
  }
}

export function getActiveOffer(): ActiveOffer | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ACTIVE_OFFER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveOffer;
  } catch {
    return null;
  }
}

export function clearActiveOffer() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ACTIVE_OFFER_KEY);
  }
}

export const OFFER_SLUG_MAP: Record<string, string> = {
  WELCOME50: "welcome50",
  FREEDEL: "freedelivery",
  BOGO: "bogo",
};

export const OFFER_IDS = ["welcome50", "freedelivery", "bogo"] as const;

export type OfferId = (typeof OFFER_IDS)[number];

export function isValidOfferId(id: string): id is OfferId {
  return (OFFER_IDS as readonly string[]).includes(id);
}

export const STATIC_OFFER_STYLES = [
  {
    slug: "welcome50",
    title: "Flat 50% OFF",
    subtitle: "On your first order",
    code: "WELCOME50",
    color: "from-rose-500 to-red-600",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "freedelivery",
    title: "Free Delivery",
    subtitle: "On orders above ₹500",
    code: "FREEDEL",
    color: "from-indigo-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "bogo",
    title: "Buy 1 Get 1",
    subtitle: "On selected desserts",
    code: "BOGO",
    color: "from-amber-500 to-orange-600",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=600",
  },
];
