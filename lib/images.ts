export const RESTAURANT_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800";

export const FOOD_FALLBACK =
  "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800";

export const OFFER_FALLBACK =
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800";

export const BRAND_FOOD_IMAGES: Record<string, string> = {
  Subway:
    "https://images.unsplash.com/photo-1619860860774-1e2e815b82fe?auto=format&fit=crop&q=80&w=800",
  "Behrouz Biryani":
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
  "Biryani By Kilo":
    "https://images.unsplash.com/photo-1589302168068-964664d93cb0?auto=format&fit=crop&q=80&w=800",
  "Wow! Momo":
    "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=800",
  "Haldiram's":
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800",
  "Barbeque Nation":
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800",
  Faasos:
    "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800",
  "Domino's Pizza":
    "https://images.unsplash.com/photo-1513104890138-7c049485ea28?auto=format&fit=crop&q=80&w=800",
  "KFC":
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800",
  "Burger King":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
};

export function getRestaurantImage(url?: string | null): string {
  return url?.trim() || RESTAURANT_FALLBACK;
}

export function getFoodImage(url?: string | null): string {
  return url?.trim() || FOOD_FALLBACK;
}

export function getBrandFoodImage(name: string, localPath?: string): string {
  if (localPath?.startsWith("http")) return localPath;
  return BRAND_FOOD_IMAGES[name] || RESTAURANT_FALLBACK;
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
  price_range?: number | null;
}) {
  return {
    id: r.id,
    name: r.name,
    image: getRestaurantImage(r.image_url),
    rating: String(r.rating ?? "4.5"),
    time: `${r.estimated_delivery_time || 30} min`,
    cuisine: r.description || "Various Cuisines",
    priceForTwo: getPriceForTwo(r.price_range),
  };
}
