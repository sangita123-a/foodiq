import fs from "fs";
import path from "path";
import { CATEGORY_SLUGS } from "@/lib/data/categoryData";
import { COLLECTION_SLUGS } from "@/lib/data/collectionsData";
import { CUISINE_SLUGS } from "@/lib/cuisines";

/** Routes that must never appear in sitemap or search indexes. */
export const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/partner",
  "/delivery",
  "/cart",
  "/checkout",
  "/payment",
  "/order-success",
  "/track-order",
  "/order-tracking",
  "/profile",
  "/my-orders",
  "/orders",
  "/favorites",
  "/wishlist",
  "/saved-addresses",
  "/payment-methods",
  "/notifications",
  "/notification-preferences",
  "/settings",
  "/coupons-rewards",
  "/coupons",
  "/my-rewards",
  "/rewards",
  "/login",
  "/register",
  "/forgot-password",
  "/api",
] as const;

export function isPrivateRoute(route: string): boolean {
  const normalized = route === "" ? "/" : route.startsWith("/") ? route : `/${route}`;
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function walkStaticRoutes(dir: string, urlPrefix = ""): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith("(") || entry.name.startsWith("_")) continue;
      if (entry.name.startsWith("[")) continue;

      const nextPrefix = `${urlPrefix}/${entry.name}`;
      routes.push(...walkStaticRoutes(fullPath, nextPrefix));
      continue;
    }

    if (entry.name !== "page.tsx" && entry.name !== "page.ts") continue;
    if (urlPrefix.includes("[")) continue;

    const route = urlPrefix || "/";
    if (!isPrivateRoute(route)) {
      routes.push(route);
    }
  }

  return routes;
}

/** Discover static App Router pages at build time (no dynamic segments). */
export function discoverStaticPublicRoutes(appDir = path.join(process.cwd(), "app")): string[] {
  const discovered = walkStaticRoutes(appDir);
  return [...new Set(discovered)].sort();
}

export function getKnownDynamicRoutePatterns(): string[] {
  const patterns: string[] = [];

  for (const slug of CUISINE_SLUGS) {
    patterns.push(`/cuisine/${slug}`);
  }
  for (const slug of CATEGORY_SLUGS) {
    patterns.push(`/category/${slug}`);
  }
  for (const slug of COLLECTION_SLUGS) {
    patterns.push(`/collections/${slug}`);
  }

  return patterns;
}

export type SitemapPriority = {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};

const PRIORITY_OVERRIDES: Record<string, Omit<SitemapPriority, "path">> = {
  "/": { changeFrequency: "daily", priority: 1 },
  "/restaurants": { changeFrequency: "daily", priority: 0.9 },
  "/popular-restaurants": { changeFrequency: "daily", priority: 0.85 },
  "/popular-cuisines": { changeFrequency: "weekly", priority: 0.8 },
  "/trending-dishes": { changeFrequency: "daily", priority: 0.8 },
  "/offers": { changeFrequency: "daily", priority: 0.8 },
  "/collections": { changeFrequency: "weekly", priority: 0.75 },
  "/order-online": { changeFrequency: "daily", priority: 0.85 },
  "/search": { changeFrequency: "weekly", priority: 0.6 },
  "/about": { changeFrequency: "monthly", priority: 0.5 },
  "/contact": { changeFrequency: "monthly", priority: 0.5 },
  "/help-support": { changeFrequency: "monthly", priority: 0.5 },
  "/privacy-policy": { changeFrequency: "yearly", priority: 0.3 },
  "/terms-of-service": { changeFrequency: "yearly", priority: 0.3 },
  "/live-cricket": { changeFrequency: "daily", priority: 0.4 },
};

export function getStaticSitemapEntries(): SitemapPriority[] {
  const routes = discoverStaticPublicRoutes();
  return routes.map((routePath) => ({
    path: routePath,
    ...(PRIORITY_OVERRIDES[routePath] ?? {
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
  }));
}
