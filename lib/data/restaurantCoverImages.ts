/** Restaurant cover images — keyed by name, category, and cuisine slug. */

export const RESTAURANT_COVER_BY_NAME: Record<string, string> = {
  "Brew & Blend": "/images/catalog/restaurants/rest-coffee.jpg",
  "Punjab Junction": "/images/catalog/restaurants/rest-north-indian.jpg",
  "Quick Bite Company": "/images/catalog/restaurants/rest-fast-food.jpg",
  "Fresh Fuel Cafe": "/images/catalog/restaurants/rest-healthy.jpg",
  "Stone Oven Pizza": "/images/catalog/restaurants/rest-pizza.jpg",
  "The Daily Bakehouse": "/images/catalog/restaurants/rest-bakery.jpg",
  "Urban Tandoor": "/images/catalog/restaurants/rest-tandoori.jpg",
  "Casa Italiano": "/images/catalog/restaurants/rest-pasta.jpg",
  "Foodiq Express": "/images/catalog/restaurants/rest-fast-food.jpg",
  "Wok Republic": "/images/catalog/restaurants/rest-chinese.jpg",
  "Curry & Co.": "/images/catalog/restaurants/rest-north-indian.jpg",
  "Dosa District": "/images/catalog/restaurants/rest-south-indian.jpg",
  "The Burger Foundry": "/images/catalog/restaurants/rest-burger.jpg",
  "Green Bowl Kitchen": "/images/catalog/restaurants/rest-healthy.jpg",
  "Chaat Bazaar": "/images/catalog/restaurants/rest-street-food.jpg",
  "Coastal Catch": "/images/catalog/restaurants/rest-seafood.jpg",
  "Sweet Theory": "/images/catalog/restaurants/rest-desserts.jpg",
  "Royal Dum Biryani": "/images/catalog/restaurants/rest-biryani.jpg",
  "Casa Mexicana": "/images/catalog/restaurants/rest-shawarma.jpg",
  "Spice Route": "/images/catalog/restaurants/rest-north-indian.jpg",
  "Napoli Kitchen": "/images/catalog/restaurants/rest-pasta.jpg",
  "Bombay Street Kitchen": "/images/catalog/restaurants/rest-street-food.jpg",
  "Harbour Grill": "/images/catalog/restaurants/rest-seafood.jpg",
  "Morning Crumbs": "/images/catalog/restaurants/rest-bakery.jpg",
  "The Dessert Room": "/images/catalog/restaurants/rest-desserts.jpg",
};

export const RESTAURANT_COVER_BY_CATEGORY: Record<string, string> = {
  Chinese: "/images/catalog/restaurants/rest-chinese.jpg",
  Indian: "/images/catalog/restaurants/rest-north-indian.jpg",
  "North Indian": "/images/catalog/restaurants/rest-north-indian.jpg",
  "South Indian": "/images/catalog/restaurants/rest-south-indian.jpg",
  Italian: "/images/catalog/restaurants/rest-pasta.jpg",
  Pizza: "/images/catalog/restaurants/rest-pizza.jpg",
  Burger: "/images/catalog/restaurants/rest-burger.jpg",
  Healthy: "/images/catalog/restaurants/rest-healthy.jpg",
  "Street Food": "/images/catalog/restaurants/rest-street-food.jpg",
  Seafood: "/images/catalog/restaurants/rest-seafood.jpg",
  Bakery: "/images/catalog/restaurants/rest-bakery.jpg",
  Desserts: "/images/catalog/restaurants/rest-desserts.jpg",
  "Fast Food": "/images/catalog/restaurants/rest-fast-food.jpg",
  Beverages: "/images/catalog/restaurants/rest-coffee.jpg",
  Biryani: "/images/catalog/restaurants/rest-biryani.jpg",
  Mexican: "/images/catalog/restaurants/rest-shawarma.jpg",
  Momos: "/images/catalog/restaurants/rest-momos.jpg",
  Coffee: "/images/catalog/restaurants/rest-coffee.jpg",
  "Cold Drinks": "/images/catalog/restaurants/rest-cold-drinks.jpg",
  BBQ: "/images/catalog/restaurants/rest-bbq.jpg",
  Thali: "/images/catalog/restaurants/rest-thali.jpg",
  Sandwich: "/images/catalog/restaurants/rest-sandwich.jpg",
  "Ice Cream": "/images/catalog/restaurants/rest-icecream.jpg",
  Cakes: "/images/catalog/restaurants/rest-cakes.jpg",
  Juice: "/images/catalog/restaurants/rest-juice.jpg",
  Tea: "/images/catalog/restaurants/rest-tea.jpg",
  Rolls: "/images/catalog/restaurants/rest-rolls.jpg",
  Snacks: "/images/catalog/restaurants/rest-snacks.jpg",
};

export const RESTAURANT_COVER_BY_CUISINE_SLUG: Record<string, string> = {
  chinese: "/images/catalog/restaurants/rest-chinese.jpg",
  indian: "/images/catalog/restaurants/rest-north-indian.jpg",
  "north-indian": "/images/catalog/restaurants/rest-north-indian.jpg",
  "south-indian": "/images/catalog/restaurants/rest-south-indian.jpg",
  italian: "/images/catalog/restaurants/rest-pasta.jpg",
  pizza: "/images/catalog/restaurants/rest-pizza.jpg",
  burger: "/images/catalog/restaurants/rest-burger.jpg",
  healthy: "/images/catalog/restaurants/rest-healthy.jpg",
  "street-food": "/images/catalog/restaurants/rest-street-food.jpg",
  seafood: "/images/catalog/restaurants/rest-seafood.jpg",
  bakery: "/images/catalog/restaurants/rest-bakery.jpg",
  desserts: "/images/catalog/restaurants/rest-desserts.jpg",
  "fast-food": "/images/catalog/restaurants/rest-fast-food.jpg",
  beverages: "/images/catalog/restaurants/rest-coffee.jpg",
  biryani: "/images/catalog/restaurants/rest-biryani.jpg",
  mexican: "/images/catalog/restaurants/rest-shawarma.jpg",
};

/** Generic bulk-assigned URLs that must not override category/name mapping. */
export const RESTAURANT_BULK_FALLBACK_IMAGES = new Set([
  "/default-restaurant.webp",
  "/default-food.webp",
  "/images/catalog/restaurants/north-indian.webp",
  "/images/catalog/restaurants/indian.webp",
]);

export function isBulkRestaurantFallback(url?: string | null): boolean {
  if (!url) return true;
  const normalized = url.trim().toLowerCase();
  if (!normalized) return true;
  return (
    RESTAURANT_BULK_FALLBACK_IMAGES.has(normalized) ||
    normalized.endsWith("/default-restaurant.webp")
  );
}

export function resolveRestaurantCoverPath(options: {
  id?: string | null;
  name?: string | null;
  category?: string | null;
  categorySlug?: string | null;
  imageUrl?: string | null;
  coverById?: Record<string, string>;
}): string | null {
  const name = options.name?.trim();
  if (name && RESTAURANT_COVER_BY_NAME[name]) {
    return RESTAURANT_COVER_BY_NAME[name];
  }

  const imageUrl = options.imageUrl?.trim();
  if (imageUrl && !isBulkRestaurantFallback(imageUrl)) {
    return imageUrl;
  }

  const category = options.category?.trim();
  if (category && RESTAURANT_COVER_BY_CATEGORY[category]) {
    return RESTAURANT_COVER_BY_CATEGORY[category];
  }

  const slug = options.categorySlug?.trim().toLowerCase();
  if (slug && RESTAURANT_COVER_BY_CUISINE_SLUG[slug]) {
    return RESTAURANT_COVER_BY_CUISINE_SLUG[slug];
  }

  if (category) {
    const lower = category.toLowerCase();
    for (const [key, path] of Object.entries(RESTAURANT_COVER_BY_CATEGORY)) {
      if (lower.includes(key.toLowerCase())) return path;
    }
    for (const [key, path] of Object.entries(RESTAURANT_COVER_BY_CUISINE_SLUG)) {
      if (lower.includes(key.replace(/-/g, " ")) || lower.includes(key)) return path;
    }
  }

  if (name) {
    const lower = name.toLowerCase();
    if (lower.includes("pizza")) return RESTAURANT_COVER_BY_CUISINE_SLUG.pizza;
    if (lower.includes("burger")) return RESTAURANT_COVER_BY_CUISINE_SLUG.burger;
    if (lower.includes("biryani")) return RESTAURANT_COVER_BY_CUISINE_SLUG.biryani;
    if (lower.includes("tandoor")) return "/images/catalog/restaurants/rest-tandoori.jpg";
    if (lower.includes("bake") || lower.includes("crumb"))
      return RESTAURANT_COVER_BY_CUISINE_SLUG.bakery;
    if (lower.includes("brew") || lower.includes("blend") || lower.includes("cafe"))
      return "/images/catalog/restaurants/rest-coffee.jpg";
    if (lower.includes("wok") || lower.includes("dragon"))
      return RESTAURANT_COVER_BY_CUISINE_SLUG.chinese;
    if (lower.includes("dosa")) return RESTAURANT_COVER_BY_CUISINE_SLUG["south-indian"];
    if (lower.includes("dessert") || lower.includes("sweet"))
      return RESTAURANT_COVER_BY_CUISINE_SLUG.desserts;
    if (lower.includes("coastal") || lower.includes("harbour") || lower.includes("catch"))
      return RESTAURANT_COVER_BY_CUISINE_SLUG.seafood;
    if (lower.includes("chaat") || lower.includes("bombay") || lower.includes("street"))
      return RESTAURANT_COVER_BY_CUISINE_SLUG["street-food"];
    if (lower.includes("italiano") || lower.includes("napoli"))
      return RESTAURANT_COVER_BY_CUISINE_SLUG.italian;
    if (lower.includes("fuel") || lower.includes("green bowl"))
      return RESTAURANT_COVER_BY_CUISINE_SLUG.healthy;
    if (lower.includes("express") || lower.includes("quick bite"))
      return RESTAURANT_COVER_BY_CUISINE_SLUG["fast-food"];
  }

  const id = options.id?.trim();
  if (id && options.coverById?.[id]) {
    return options.coverById[id];
  }

  return null;
}
