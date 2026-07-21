import type { MetadataRoute } from "next";
import { buildRobotsConfig, ROBOTS_DISALLOW_PATHS } from "@/lib/seo/robots-config";
import {
  assertPublicSitemapEntry,
  buildStaticSitemapEntries,
  dedupeSitemapEntries,
  type SitemapEntry,
} from "@/lib/seo/sitemap-entries";
import {
  discoverStaticPublicRoutes,
  getKnownDynamicRoutePatterns,
  isPrivateRoute,
} from "@/lib/seo/public-routes";
import { getSiteUrl } from "@/lib/seo/site";

function assertRobotsConfig(config: MetadataRoute.Robots): void {
  const site = getSiteUrl();
  const expectedSitemap = `${site}/sitemap.xml`;

  if (config.sitemap !== expectedSitemap) {
    throw new Error(
      `robots.txt must reference sitemap at ${expectedSitemap}, got ${String(config.sitemap)}`
    );
  }

  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const wildcardRule = rules.find((rule) =>
    Array.isArray(rule.userAgent)
      ? rule.userAgent.includes("*")
      : rule.userAgent === "*"
  );

  if (!wildcardRule) {
    throw new Error("robots.txt must define a User-agent: * rule");
  }

  const allow = wildcardRule.allow
    ? Array.isArray(wildcardRule.allow)
      ? wildcardRule.allow
      : [wildcardRule.allow]
    : [];

  if (!allow.includes("/")) {
    throw new Error('robots.txt must allow crawling of "/"');
  }

  const disallow = wildcardRule.disallow
    ? Array.isArray(wildcardRule.disallow)
      ? wildcardRule.disallow
      : [wildcardRule.disallow]
    : [];

  for (const path of ROBOTS_DISALLOW_PATHS) {
    if (!disallow.includes(path)) {
      throw new Error(`robots.txt must disallow ${path}`);
    }
  }

  const expectedHost = site.replace(/^https?:\/\//, "");
  if (config.host !== expectedHost) {
    throw new Error(
      `robots.txt host must be ${expectedHost}, got ${String(config.host)}`
    );
  }
}

function pathnameFromSitemapUrl(url: string): string {
  const site = getSiteUrl();
  if (!url.startsWith(site)) {
    throw new Error(`Unexpected sitemap origin in ${url}`);
  }

  return url.slice(site.length) || "/";
}

function assertStaticPublicRouteCoverage(entries: SitemapEntry[]): void {
  const urls = new Set(entries.map((entry) => pathnameFromSitemapUrl(entry.url)));
  const missing = discoverStaticPublicRoutes().filter((route) => !urls.has(route));

  if (missing.length > 0) {
    throw new Error(
      `sitemap.xml is missing static public routes: ${missing.join(", ")}`
    );
  }
}

function assertKnownDynamicRouteCoverage(entries: SitemapEntry[]): void {
  const urls = new Set(entries.map((entry) => pathnameFromSitemapUrl(entry.url)));
  const missing = getKnownDynamicRoutePatterns().filter((route) => !urls.has(route));

  if (missing.length > 0) {
    throw new Error(
      `sitemap.xml is missing known dynamic routes: ${missing.join(", ")}`
    );
  }
}

function assertNoPrivateRoutes(entries: SitemapEntry[]): void {
  for (const entry of entries) {
    assertPublicSitemapEntry(entry);
  }
}

function assertNoDuplicateUrls(entries: SitemapEntry[]): void {
  const deduped = dedupeSitemapEntries(entries);
  if (deduped.length !== entries.length) {
    throw new Error("sitemap.xml contains duplicate URLs");
  }
}

export function validateRobotsConfig(): void {
  assertRobotsConfig(buildRobotsConfig());
}

export function validateStaticSitemapEntries(entries = buildStaticSitemapEntries()): void {
  if (entries.length === 0) {
    throw new Error("sitemap.xml must include at least one URL");
  }

  assertNoDuplicateUrls(entries);
  assertNoPrivateRoutes(entries);
  assertStaticPublicRouteCoverage(entries);
  assertKnownDynamicRouteCoverage(entries);
}

export function validateTechnicalSeo(): void {
  validateRobotsConfig();
  validateStaticSitemapEntries();

  for (const route of discoverStaticPublicRoutes()) {
    if (isPrivateRoute(route)) {
      throw new Error(`Route discovery returned private route: ${route}`);
    }
  }
}
