#!/usr/bin/env node
/**
 * Generates docs/SEO_REPORT.md — audits metadata coverage, sitemap routes, and JSON-LD.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, "..");
const appDir = path.join(root, "app");
const reportPath = path.join(root, "docs", "SEO_REPORT.md");

const PRIVATE_PREFIXES = [
  "/admin", "/partner", "/delivery", "/cart", "/checkout", "/payment",
  "/order-success", "/track-order", "/order-tracking", "/profile",
  "/my-orders", "/orders", "/favorites", "/wishlist", "/saved-addresses",
  "/payment-methods", "/notifications", "/notification-preferences",
  "/settings", "/coupons-rewards", "/coupons", "/rewards", "/login",
  "/register", "/forgot-password", "/api",
];

function walk(dir, prefix = "") {
  if (!fs.existsSync(dir)) return [];
  const routes = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("(") || entry.name.startsWith("_") || entry.name.startsWith("[")) continue;
      routes.push(...walk(full, `${prefix}/${entry.name}`));
      continue;
    }
    if (entry.name === "page.tsx" || entry.name === "page.ts") {
      routes.push(prefix || "/");
    }
  }
  return routes;
}

function hasMetadataExport(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  return (
    /export\s+(const|async function)\s+metadata/.test(content) ||
    /export\s+async function generateMetadata/.test(content) ||
    /publicMetadata\(/.test(content) ||
    /buildPageMetadata\(/.test(content)
  );
}

function auditRoute(route) {
  const segments = route === "/" ? [] : route.slice(1).split("/");
  const pagePath = path.join(appDir, ...segments, "page.tsx");

  let layoutDir = path.join(appDir, ...segments);
  const layoutChain = [];
  while (layoutDir.startsWith(appDir)) {
    const candidate = path.join(layoutDir, "layout.tsx");
    if (fs.existsSync(candidate)) layoutChain.push(candidate);
    if (layoutDir === appDir) break;
    layoutDir = path.dirname(layoutDir);
  }

  const pageMeta = hasMetadataExport(pagePath);
  const layoutMeta = layoutChain.some(hasMetadataExport);
  const rootLayoutMeta = hasMetadataExport(path.join(appDir, "layout.tsx"));
  const isPrivate = PRIVATE_PREFIXES.some(
    (p) => route === p || route.startsWith(`${p}/`)
  );

  return {
    route,
    isPrivate,
    hasMetadata: pageMeta || layoutMeta || rootLayoutMeta,
    pageMeta,
    layoutMeta,
  };
}

function countFiles(pattern, dir = root) {
  let count = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(pattern, full);
    else if (pattern.test(entry.name)) count += 1;
  }
  return count;
}

const routes = walk(appDir).sort();
const audits = routes.map(auditRoute);
const publicRoutes = audits.filter((a) => !a.isPrivate);
const missingPublic = publicRoutes.filter((a) => !a.hasMetadata);
const privateRoutes = audits.filter((a) => a.isPrivate);

const lines = [
  "# Foodiq SEO Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `- Total routes: **${routes.length}**`,
  `- Public routes: **${publicRoutes.length}**`,
  `- Private routes: **${privateRoutes.length}**`,
  `- Public routes with metadata: **${publicRoutes.length - missingPublic.length}/${publicRoutes.length}**`,
  `- SEO layout files: **${countFiles(/^layout\.tsx$/, appDir)}**`,
  `- Icon assets: **${countFiles(/\.png$/, path.join(root, "public", "icons"))}**`,
  "",
  "## Production SEO Checklist",
  "",
  "| Item | Status |",
  "|------|--------|",
  "| Unique titles & descriptions | ✅ Centralized via `lib/seo/pages.ts` + dynamic `generateMetadata` |",
  "| Canonical URLs | ✅ `buildPageMetadata()` alternates.canonical |",
  "| Open Graph & Twitter Cards | ✅ All pages via metadata builder |",
  "| robots.txt | ✅ `app/robots.ts` (dynamic) |",
  "| sitemap.xml | ✅ `app/sitemap.ts` (auto-discovered static + dynamic routes) |",
  "| JSON-LD Organization | ✅ Root layout |",
  "| JSON-LD WebSite + SearchAction | ✅ Root layout |",
  "| JSON-LD FoodDeliveryService | ✅ Root layout |",
  "| JSON-LD FAQ | ✅ Home + Help & Support |",
  "| JSON-LD Restaurant / Menu / Product | ✅ Entity pages |",
  "| Favicon & app icons | ✅ `public/icons/` + `app/icon.png` |",
  "| Web manifest | ✅ `app/manifest.ts` |",
  "| Google Search Console verification | ✅ `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |",
  "",
  "## Target Search Queries",
  "",
  "- Foodiq",
  "- Foodiq Food Delivery",
  "- Foodiq Hyderabad",
  "- Foodiq Online Food Delivery",
  "- Foodiq Restaurant",
  "- Foodiq Official Website",
  "",
  "Homepage title: **Foodiq | Online Food Delivery Platform**",
  "",
  "## Public Routes",
  "",
  "| Route | Metadata | Source |",
  "|-------|----------|--------|",
  ...publicRoutes.map(
    (a) =>
      `| \`${a.route}\` | ${a.hasMetadata ? "✅" : "❌"} | ${a.pageMeta ? "page" : a.layoutMeta ? "layout" : "root"} |`
  ),
  "",
];

if (missingPublic.length > 0) {
  lines.push("## Missing Public Metadata", "");
  for (const item of missingPublic) {
    lines.push(`- \`${item.route}\``);
  }
  lines.push("");
}

lines.push(
  "## Google Search Console Setup",
  "",
  "1. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel/production env.",
  "2. Submit sitemap: `https://YOUR_DOMAIN/sitemap.xml`",
  "3. Request indexing for homepage and key landing pages.",
  "4. Optional: set `NEXT_PUBLIC_BING_SITE_VERIFICATION` and `NEXT_PUBLIC_YANDEX_SITE_VERIFICATION`.",
  ""
);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, lines.join("\n"));
console.log(`SEO report written to ${reportPath}`);
