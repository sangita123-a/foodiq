import type { MetadataRoute } from "next";
import { PRIVATE_ROUTE_PREFIXES } from "@/lib/seo/public-routes";
import { getSiteUrl } from "@/lib/seo/site";

/** Paths crawlers must not index (account, checkout, admin, API, etc.). */
export const ROBOTS_DISALLOW_PATHS = [...PRIVATE_ROUTE_PREFIXES] as string[];

export function buildRobotsConfig(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ROBOTS_DISALLOW_PATHS,
    },
    sitemap: `${site}/sitemap.xml`,
    host: site.replace(/^https?:\/\//, ""),
  };
}
