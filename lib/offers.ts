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
  PIZZABOGO: "pizza-bogo",
  BIRYANI150: "biryani150",
  FREEDESSERT: "free-dessert",
};

export const OFFER_IDS = [
  "welcome50",
  "freedelivery",
  "bogo",
  "pizza-bogo",
  "biryani150",
  "free-dessert",
] as const;

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
    image: "/images/catalog/cuisines/pizza.webp",
  },
  {
    slug: "freedelivery",
    title: "Free Delivery",
    subtitle: "On orders above ₹500",
    code: "FREEDEL",
    color: "from-indigo-500 to-blue-600",
    image: "/images/catalog/cuisines/biryani.webp",
  },
  {
    slug: "bogo",
    title: "Buy 1 Get 1",
    subtitle: "On selected desserts",
    code: "BOGO",
    color: "from-[#E23744] to-[#C81E34]",
    image: "/images/catalog/cuisines/desserts.webp",
  },
  {
    slug: "pizza-bogo",
    title: "Buy 1 Get 1 Free Pizza",
    subtitle: "50% OFF · Valid Today",
    code: "PIZZABOGO",
    color: "from-red-500 to-[#E23744]",
    image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
  },
  {
    slug: "biryani150",
    title: "Flat ₹150 OFF on Biryani",
    subtitle: "Minimum order ₹499",
    code: "BIRYANI150",
    color: "from-emerald-500 to-teal-600",
    image: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp",
  },
];
