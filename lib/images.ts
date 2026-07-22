/** Known production API origin fallback */
const PRODUCTION_API_FALLBACK = "https://foodiq-2.onrender.com";

/** Base URL for backend-served images. Relative paths from the API are prefixed with this. */
export function getBackendBase(): string {
  const envUrl = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "";
  const trimmed = envUrl.trim().replace(/\/$/, "");
  const isLocalApi =
    !trimmed ||
    trimmed.includes("localhost") ||
    trimmed.includes("127.0.0.1");

  // Dev: same-origin proxy avoids Next.js 16 private-IP image optimization blocks
  if (process.env.NODE_ENV === "development" && isLocalApi) {
    return "/backend-api";
  }

  if (typeof window !== "undefined") {
    try {
      const resolved = trimmed || PRODUCTION_API_FALLBACK;
      const apiOrigin = new URL(resolved).origin;
      if (apiOrigin !== window.location.origin) {
        return `${window.location.origin}/backend-api`;
      }
      return resolved;
    } catch {
      return `${window.location.origin}/backend-api`;
    }
  }

  if (!trimmed || trimmed.includes("foodiq-backend-api.onrender.com")) {
    return PRODUCTION_API_FALLBACK;
  }
  if (process.env.NODE_ENV === "production" && trimmed.includes("localhost")) {
    return PRODUCTION_API_FALLBACK;
  }
  return trimmed || PRODUCTION_API_FALLBACK;
}

/**
 * Resolves an image path for the browser/Next.js Image.
 * Static catalog assets under public/ are always same-origin so Vercel serves them
 * directly (avoids slow /backend-api proxy timeouts in production).
 * Uploads and other backend-only paths are prefixed with the API origin.
 */
export function resolveBackendUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const p = path.trim();
  if (!p) return null;
  // Already absolute — normalize known backend catalog URLs to same-origin static paths
  if (p.startsWith("http://") || p.startsWith("https://")) {
    try {
      const { pathname } = new URL(p);
      if (pathname.startsWith("/images/") || pathname.startsWith("/default-")) {
        return pathname;
      }
    } catch {
      /* keep original absolute URL */
    }
    return p;
  }
  // Already routed through Next.js dev proxy
  if (p.startsWith("/backend-api/")) {
    const stripped = p.replace(/^\/backend-api/, "");
    if (stripped.startsWith("/images/") || stripped.startsWith("/default-")) {
      return stripped;
    }
    return p;
  }
  // Bundled in Next.js public/ — same-origin on localhost and Vercel
  if (p.startsWith("/images/") || p.startsWith("/default-")) return p;
  // Backend-only relative paths (uploads, media, etc.)
  const base = getBackendBase();
  return `${base}${p.startsWith("/") ? "" : "/"}${p}`;
}

/** Production-safe local fallbacks — always served from frontend / backend public root. */
export const DEFAULT_RESTAURANT_IMAGE = "/default-restaurant.webp";
export const DEFAULT_FOOD_IMAGE = "/default-food.webp";

export const RESTAURANT_FALLBACK = DEFAULT_RESTAURANT_IMAGE;
export const FOOD_FALLBACK = DEFAULT_FOOD_IMAGE;
export const OFFER_FALLBACK = resolveBackendUrl("/images/catalog/cuisines/pizza.webp") ?? DEFAULT_FOOD_IMAGE;
export const AVATAR_FALLBACK = resolveBackendUrl("/images/catalog/cuisines/healthy.webp") ?? DEFAULT_FOOD_IMAGE;

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

import { BRAND_FOOD_IMAGES_UNIQUE, RESTAURANT_COVER_BY_ID } from "@/lib/data/sectionImages";

export const BRAND_FOOD_IMAGES: Record<string, string> = BRAND_FOOD_IMAGES_UNIQUE;

export const BRAND_LOGOS: Record<string, string> = {
  Subway: "/images/catalog/dishes/fast-food/veggie-sub.webp",
  "Behrouz Biryani": "/images/catalog/dishes/biryani/hyderabadi-chicken-biryani.webp",
  "Biryani By Kilo": "/images/catalog/dishes/biryani/mutton-biryani.webp",
  "Wow! Momo": "/images/catalog/dishes/chinese/chicken-momos.webp",
  "Haldiram's": "/images/catalog/dishes/desserts/gulab-jamun.webp",
  "Barbeque Nation": "/images/catalog/dishes/indian/butter-chicken.webp",
  Faasos: "/images/catalog/dishes/fast-food/chicken-wrap.webp",
  "Domino's Pizza": "/images/catalog/dishes/pizza/pepperoni-pizza.webp",
  KFC: "/images/catalog/dishes/fast-food/fried-chicken-bucket.webp",
  "Burger King": "/images/catalog/dishes/burger/crispy-chicken-burger.webp",
  "Pizza Hut": "/images/catalog/dishes/pizza/farmhouse-pizza.webp",
  "McDonald's": "/images/catalog/dishes/burger/cheese-burger.webp",
  "Taco Bell": "/images/catalog/dishes/mexican/loaded-nachos.webp",
  Starbucks: "/images/catalog/dishes/beverages/classic-cappuccino.webp",
  "Baskin Robbins": "/images/catalog/dishes/desserts/butterscotch-ice-cream.webp",
};

const GENERIC_IMAGES = new Set([
  DEFAULT_RESTAURANT_IMAGE,
  DEFAULT_FOOD_IMAGE,
  "/default-restaurant.webp",
  "/default-food.webp",
]);

export function isGenericFoodImage(url?: string | null): boolean {
  if (!url) return true;
  const normalized = url.trim().toLowerCase();
  return GENERIC_IMAGES.has(normalized) || normalized.endsWith("/default-restaurant.webp") || normalized.endsWith("/default-food.webp");
}

export function getRestaurantCoverImage(restaurantId?: string | null, url?: string | null): string {
  const custom = resolveBackendUrl(url);
  if (custom && !isGenericFoodImage(custom)) return custom;
  const id = restaurantId?.trim();
  if (id && RESTAURANT_COVER_BY_ID[id]) {
    return resolveBackendUrl(RESTAURANT_COVER_BY_ID[id]) ?? RESTAURANT_COVER_BY_ID[id];
  }
  return DEFAULT_RESTAURANT_IMAGE;
}

export function getRestaurantImage(url?: string | null): string {
  const resolved = resolveBackendUrl(url);
  if (resolved && !isGenericFoodImage(resolved)) return resolved;
  return DEFAULT_RESTAURANT_IMAGE;
}

import { resolveTrendingDishImagePath } from "@/lib/data/trendingDishImages";

export function getUniqueTrendingImage(
  name: string,
  category: string,
  apiImage?: string | null,
  staticImage?: string | null,
  dishId?: string | null
): string {
  const path = resolveTrendingDishImagePath(name, category, dishId, apiImage, staticImage);
  return resolveBackendUrl(path) ?? path;
}

export function getFoodImage(url?: string | null): string {
  return resolveBackendUrl(url) ?? DEFAULT_FOOD_IMAGE;
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
    image: getRestaurantCoverImage(String(r.id), r.image_url),
    rating: String(r.rating ?? "4.5"),
    time: `${r.estimated_delivery_time || 30} min`,
    cuisine: r.category_name || r.description || "Various Cuisines",
    priceForTwo: getPriceForTwo(r.price_range),
    distance: r.distance_km ? `${Number(r.distance_km).toFixed(1)} km` : "Nearby",
    offer: r.offer_text || null,
    is_veg: Boolean(r.is_veg),
  };
}
