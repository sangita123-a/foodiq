/**
 * Site-wide SEO configuration. Prefer NEXT_PUBLIC_SITE_URL in production.
 */
export const SITE_NAME = "Foodiq";
export const SITE_TAGLINE = "Restaurant Ordering Platform";
export const SITE_DESCRIPTION =
  "Discover amazing restaurants and delicious food delivered straight to your doorstep. Order from top local restaurants with Foodiq.";
export const SITE_KEYWORDS = [
  "Foodiq",
  "food delivery",
  "order food online",
  "restaurants near me",
  "online food ordering",
  "food delivery app",
  "restaurant menu",
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

  return "https://foodiq-sangita123-as-projects.vercel.app";
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
