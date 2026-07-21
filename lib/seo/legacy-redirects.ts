/** Normalize URL paths: lowercase, single leading slash, no trailing slash. */
export function normalizePath(path = "/"): string {
  if (!path) return "/";

  let normalized = path.trim().split("?")[0]?.split("#")[0] ?? path;
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized.toLowerCase();
}

/** Canonical public hub paths (single source of truth). */
export const CANONICAL_PATHS = {
  home: "/",
  orderOnline: "/order-online",
  popularCuisines: "/popular-cuisines",
  trendingDishes: "/trending-dishes",
  offers: "/offers",
  contact: "/contact",
  helpSupport: "/help-support",
  myOrders: "/my-orders",
  trackOrder: "/track-order",
  terms: "/terms-of-service",
  privacy: "/privacy-policy",
  partnerLogin: "/partner/login",
} as const;

/**
 * Routes that only exist to 308 redirect — excluded from sitemap and route discovery.
 */
export const REDIRECT_ONLY_ROUTES = [
  "/restaurants",
  "/support",
  "/help-center",
  "/orders",
  "/order-tracking",
  "/popular-restaurants",
  "/terms",
  "/privacy",
  "/help",
  "/faq",
  "/categories",
  "/partner",
  "/restaurant/login",
  "/restaurant/register",
] as const;

export function isRedirectOnlyRoute(route: string): boolean {
  const normalized = normalizePath(route);
  return (REDIRECT_ONLY_ROUTES as readonly string[]).includes(normalized);
}

/** Permanent legacy → canonical redirects for next.config.ts. */
export function buildLegacyRedirects(): Array<{
  source: string;
  destination: string;
  permanent: boolean;
}> {
  const permanent = [
    { source: "/terms", destination: CANONICAL_PATHS.terms },
    { source: "/privacy", destination: CANONICAL_PATHS.privacy },
    { source: "/help", destination: CANONICAL_PATHS.helpSupport },
    { source: "/faq", destination: CANONICAL_PATHS.helpSupport },
    { source: "/help-center", destination: CANONICAL_PATHS.helpSupport },
    { source: "/support", destination: CANONICAL_PATHS.helpSupport },
    { source: "/restaurants", destination: CANONICAL_PATHS.orderOnline },
    { source: "/categories", destination: CANONICAL_PATHS.popularCuisines },
    { source: "/orders", destination: CANONICAL_PATHS.myOrders },
    { source: "/order-tracking", destination: CANONICAL_PATHS.trackOrder },
    {
      source: "/popular-restaurants",
      destination: CANONICAL_PATHS.orderOnline,
    },
    {
      source: "/restaurant/login",
      destination: CANONICAL_PATHS.partnerLogin,
    },
  ];

  const temporary = [
    { source: "/partner", destination: CANONICAL_PATHS.partnerLogin },
    {
      source: "/restaurant/register",
      destination: CANONICAL_PATHS.partnerLogin,
    },
    {
      source: "/track-order/:orderId",
      destination: "/track-order?id=:orderId",
    },
  ];

  return [
    ...permanent.map((rule) => ({ ...rule, permanent: true })),
    ...temporary.map((rule) => ({ ...rule, permanent: false })),
  ];
}
