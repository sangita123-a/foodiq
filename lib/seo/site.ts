/**
 * Site-wide SEO configuration. Prefer NEXT_PUBLIC_SITE_URL in production.
 */
export const SITE_NAME = "Foodiq";
export const SITE_TAGLINE = "Online Food Delivery Platform";
export const SITE_CITY = "Hyderabad";
export const SITE_DESCRIPTION =
  "Order delicious food online from top restaurants with fast delivery only on Foodiq.";
export const SITE_KEYWORDS = [
  "Foodiq",
  "Foodiq Food Delivery",
  "Foodiq Hyderabad",
  "Foodiq Online Food Delivery",
  "Foodiq Restaurant",
  "Foodiq Official Website",
  "food delivery",
  "order food online",
  "restaurants near me",
  "online food ordering",
  "food delivery app",
  "restaurant menu",
  "Hyderabad food delivery",
  "trending dishes",
];

export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (fromEnv) {
    const raw = fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
    return raw.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://foodiq-ecru.vercel.app";
}

export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000")
  ).replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export const DEFAULT_OG_IMAGE = "/icons/og-default.png";
