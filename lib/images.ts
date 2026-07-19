/** Known production API origin fallback */
const PRODUCTION_API_FALLBACK = "https://foodiq-2.onrender.com";

/** Base URL for backend-served images. Relative paths from the API are prefixed with this. */
export function getBackendBase(): string {
  const envUrl = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "";
  const trimmed = envUrl.trim();
  if (!trimmed || trimmed.includes("foodiq-backend-api.onrender.com") || trimmed.includes("localhost")) {
    return PRODUCTION_API_FALLBACK;
  }
  return trimmed.replace(/\/$/, "");
}

/**
 * Converts a possibly-relative backend image path to an absolute URL.
 * e.g. "/images/catalog/restaurants/indian.webp"
 *   → "https://foodiq-2.onrender.com/images/catalog/restaurants/indian.webp"
 * Already-absolute URLs (https://...) are returned unchanged.
 */
export function resolveBackendUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const p = path.trim();
  if (!p) return null;
  // Already absolute
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  // Relative path from backend — prefix with backend origin
  const base = getBackendBase();
  return `${base}${p.startsWith("/") ? "" : "/"}${p}`;
}

export const RESTAURANT_FALLBACK = resolveBackendUrl("/images/catalog/restaurants/indian.webp")!;
export const FOOD_FALLBACK = resolveBackendUrl("/images/catalog/food/indian.webp")!;
export const OFFER_FALLBACK = resolveBackendUrl("/images/catalog/cuisines/pizza.webp")!;
export const AVATAR_FALLBACK = resolveBackendUrl("/images/catalog/cuisines/healthy.webp")!;

export const OFFER_IMAGES: Record<string, string> = {
  WELCOME50: "/images/catalog/cuisines/pizza.webp",
  FREEDEL: "/images/catalog/cuisines/biryani.webp",
  BOGO: "/images/catalog/cuisines/desserts.webp",
  FLAT10: "/images/catalog/cuisines/fast-food.webp",
  FOODIQ20: "/images/catalog/cuisines/indian.webp",
  PIZZABOGO: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
  BIRYANI150: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp",
  FREEDESSERT: "/images/catalog/dishes/desserts/hot-chocolate-sundae.webp",
};

export function getOfferImage(code?: string | null, bannerUrl?: string | null): string {
  if (bannerUrl?.trim()) return resolveBackendUrl(bannerUrl) ?? OFFER_FALLBACK;
  if (code && OFFER_IMAGES[code]) return resolveBackendUrl(OFFER_IMAGES[code]) ?? OFFER_FALLBACK;
  return OFFER_FALLBACK;
}

export function getAvatarImage(url?: string | null): string {
  return resolveBackendUrl(url) ?? AVATAR_FALLBACK;
}

export const BRAND_FOOD_IMAGES: Record<string, string> = {
  Subway: "/images/catalog/food/fast-food.webp",
  "Behrouz Biryani": "/images/catalog/food/biryani.webp",
  "Biryani By Kilo": "/images/catalog/food/biryani.webp",
  "Wow! Momo": "/images/catalog/food/chinese.webp",
  "Haldiram's": "/images/catalog/food/indian.webp",
  "Barbeque Nation": "/images/catalog/food/north-indian.webp",
  Faasos: "/images/catalog/food/street-food.webp",
  "Domino's Pizza": "/images/catalog/food/pizza.webp",
  KFC: "/images/catalog/food/fast-food.webp",
  "Burger King": "/images/catalog/food/burger.webp",
};

export const BRAND_LOGOS: Record<string, string> = {
  Subway: "/images/catalog/logos/subway.webp",
  "Behrouz Biryani": "/images/catalog/logos/biryani.webp",
  "Biryani By Kilo": "/images/catalog/logos/biryani.webp",
  "Wow! Momo": "/images/catalog/logos/chinese.webp",
  "Haldiram's": "/images/catalog/logos/indian.webp",
  "Barbeque Nation": "/images/catalog/logos/north-indian.webp",
  Faasos: "/images/catalog/logos/street-food.webp",
  "Domino's Pizza": "/images/catalog/logos/pizza.webp",
  KFC: "/images/catalog/logos/fast-food.webp",
  "Burger King": "/images/catalog/logos/burger.webp",
  "Pizza Hut": "/images/catalog/logos/pizza.webp",
  "McDonald's": "/images/catalog/logos/burger.webp",
  "Taco Bell": "/images/catalog/logos/fast-food.webp",
  Starbucks: "/images/catalog/logos/healthy.webp",
  "Baskin Robbins": "/images/catalog/logos/desserts.webp",
};

export function getRestaurantImage(url?: string | null): string {
  return resolveBackendUrl(url) ?? RESTAURANT_FALLBACK;
}

export function getFoodImage(url?: string | null): string {
  return resolveBackendUrl(url) ?? FOOD_FALLBACK;
}

export function getBrandFoodImage(name: string, localPath?: string): string {
  if (localPath?.trim()) return resolveBackendUrl(localPath) ?? localPath;
  const path = BRAND_FOOD_IMAGES[name] || RESTAURANT_FALLBACK;
  return resolveBackendUrl(path) ?? RESTAURANT_FALLBACK;
}

export function getBrandLogoImage(name: string): string {
  const path = BRAND_LOGOS[name] || RESTAURANT_FALLBACK;
  return resolveBackendUrl(path) ?? RESTAURANT_FALLBACK;
}

export function getPriceForTwo(priceRange?: number | null): string {
  const map: Record<number, string> = {
    1: "₹200 for two",
    2: "₹400 for two",
    3: "₹600 for two",
    4: "₹800+ for two",
  };
  return map[priceRange ?? 2] || "₹400 for two";
}

export function mapRestaurantCard(r: {
  id: string | number;
  name: string;
  image_url?: string | null;
  rating?: number | string | null;
  estimated_delivery_time?: number | null;
  description?: string | null;
  category_name?: string | null;
  price_range?: number | null;
  distance_km?: number | string | null;
  offer_text?: string | null;
  is_veg?: boolean | null;
}) {
  return {
    id: r.id,
    name: r.name,
    image: getRestaurantImage(r.image_url),
    rating: String(r.rating ?? "4.5"),
    time: `${r.estimated_delivery_time || 30} min`,
    cuisine: r.category_name || r.description || "Various Cuisines",
    priceForTwo: getPriceForTwo(r.price_range),
    distance: r.distance_km ? `${Number(r.distance_km).toFixed(1)} km` : "Nearby",
    offer: r.offer_text || null,
    is_veg: Boolean(r.is_veg),
  };
}
