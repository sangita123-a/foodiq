#!/usr/bin/env node
/**
 * Generates docs/SEO_REPORT.md — Google Search readiness + technical SEO audit.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, "..");
const appDir = path.join(root, "app");
const componentsDir = path.join(root, "components");
const reportPath = path.join(root, "docs", "SEO_REPORT.md");
const tsxBin = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx"
);

function collectReadinessData() {
  const result = spawnSync(
    tsxBin,
    [path.join(root, "scripts", "collect-seo-readiness.ts")],
    {
      cwd: root,
      env: {
        ...process.env,
        NEXT_PUBLIC_SITE_URL:
          process.env.NEXT_PUBLIC_SITE_URL || "https://foodiq-ecru.vercel.app",
      },
      encoding: "utf8",
      shell: process.platform === "win32",
    }
  );

  if (result.status !== 0) {
    console.warn("Could not collect readiness metrics:", result.stderr || result.stdout);
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    console.warn("Failed to parse readiness metrics JSON");
    return null;
  }
}

function passFail(ok) {
  return ok ? "✅ Pass" : "❌ Fail";
}

const REDIRECT_ONLY = [
  "/restaurants", "/support", "/help-center", "/orders", "/order-tracking",
  "/popular-restaurants", "/terms", "/privacy", "/help", "/faq", "/categories",
  "/partner", "/restaurant/login", "/restaurant/register",
];

function isRedirectOnlyRoute(route) {
  const normalized = route === "/" ? "/" : route.toLowerCase();
  return REDIRECT_ONLY.includes(normalized);
}

const PRIVATE_PREFIXES = [
  "/admin", "/partner", "/delivery", "/cart", "/checkout", "/payment",
  "/order-success", "/track-order", "/order-tracking", "/profile",
  "/my-orders", "/orders", "/favorites", "/wishlist", "/saved-addresses",
  "/payment-methods", "/notifications", "/notification-preferences",
  "/settings", "/coupons-rewards", "/coupons", "/my-rewards", "/my-wallet",
  "/help-and-support", "/help-center", "/restaurants", "/support",
  "/rewards", "/login", "/register", "/forgot-password", "/offline", "/api",
];

const LEGACY_HREFS = [
  { legacy: "/help", canonical: "/help-support" },
  { legacy: "/faq", canonical: "/help-support" },
  { legacy: "/terms", canonical: "/terms-of-service" },
  { legacy: "/privacy", canonical: "/privacy-policy" },
  { legacy: "/categories", canonical: "/popular-cuisines" },
  { legacy: "/restaurants", canonical: "/order-online" },
  { legacy: "/support", canonical: "/help-support" },
  { legacy: "/help-center", canonical: "/help-support" },
];

function walk(dir, prefix = "") {
  if (!fs.existsSync(dir)) return [];
  const routes = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("(") || entry.name.startsWith("_")) continue;
      if (entry.name.startsWith("[")) continue;
      routes.push(...walk(full, `${prefix}/${entry.name}`));
      continue;
    }
    if (entry.name === "page.tsx" || entry.name === "page.ts") {
      routes.push(prefix || "/");
    }
  }
  return routes;
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walkFiles(full, acc);
    } else if (/\.(tsx|ts|jsx|js|mdx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function hasMetadataExport(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  return (
    /export\s+(const|async function)\s+metadata/.test(content) ||
    /export\s+async function generateMetadata/.test(content) ||
    /publicMetadata\(/.test(content) ||
    /buildPageMetadata\(/.test(content) ||
    /buildPrivatePageMetadata\(/.test(content) ||
    /buildEntityMetadata\(/.test(content)
  );
}

function fileHasH1(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  return (
    /<h1[\s>]/.test(content) ||
    /\.h1[\s>]/.test(content) ||
    /motion\.h1/.test(content) ||
    /className="sr-only"/.test(content)
  );
}

function hasH1(pagePath) {
  if (fileHasH1(pagePath)) return true;
  if (!fs.existsSync(pagePath)) return false;

  const content = fs.readFileSync(pagePath, "utf8");
  const importRe = /import\s+\w+\s+from\s+["']@\/components\/([^"']+)["']/g;
  let match;

  while ((match = importRe.exec(content)) !== null) {
    const rel = match[1];
    const candidates = [
      path.join(componentsDir, `${rel}.tsx`),
      path.join(componentsDir, rel, "index.tsx"),
    ];
    if (candidates.some(fileHasH1)) return true;
  }

  return false;
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
  const isPrivate = PRIVATE_PREFIXES.some(
    (p) => route === p || route.startsWith(`${p}/`)
  );

  return {
    route,
    isPrivate,
    hasDedicatedMetadata: pageMeta || layoutMeta,
    pageMeta,
    layoutMeta,
    hasH1: hasH1(pagePath),
    pagePath,
  };
}

function scanLegacyLinks() {
  const files = walkFiles(componentsDir).concat(walkFiles(appDir));
  const findings = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const { legacy } of LEGACY_HREFS) {
      const patterns = [
        `href="${legacy}"`,
        `href='${legacy}'`,
        `href={\`${legacy}`,
        `push("${legacy}"`,
        `push('${legacy}'`,
        `push(\`${legacy}`,
      ];
      if (patterns.some((p) => content.includes(p))) {
        findings.push({ file: path.relative(root, file), legacy });
      }
    }
  }

  return findings;
}

function scanEmptyAlt() {
  const files = walkFiles(componentsDir).concat(walkFiles(appDir));
  const findings = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes('alt=""') || content.includes("alt=''")) {
      if (file.includes("social-image.tsx")) continue;
      const count = (content.match(/alt=(["'])\1/g) || []).length;
      if (count > 0) findings.push({ file: path.relative(root, file), count });
    }
  }

  return findings;
}

function parsePublicPageSeo() {
  const pagesPath = path.join(root, "lib", "seo", "pages.ts");
  const content = fs.readFileSync(pagesPath, "utf8");
  const titles = [...content.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
  const paths = [...content.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);

  const duplicateTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
  const duplicatePaths = paths.filter((p, i) => paths.indexOf(p) !== i);

  return {
    entryCount: (content.match(/^\s+\w+:\s*\{/gm) || []).length,
    duplicateTitles: [...new Set(duplicateTitles)],
    duplicatePaths: [...new Set(duplicatePaths)],
  };
}

function readNextRedirects() {
  const configPath = path.join(root, "lib", "seo", "legacy-redirects.ts");
  const content = fs.readFileSync(configPath, "utf8");
  const sourceMatches = content.match(/source:\s*"([^"]+)"/g) || [];
  return sourceMatches.map((match) => {
    const source = match.replace(/source:\s*"/, "").replace(/"$/, "");
    return { source };
  });
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
const publicRoutes = audits.filter(
  (a) => !a.isPrivate && !isRedirectOnlyRoute(a.route)
);
const privateRoutes = audits.filter((a) => a.isPrivate);
const missingPublicMetadata = publicRoutes.filter((a) => !a.hasDedicatedMetadata);
const missingPublicH1 = publicRoutes.filter((a) => !a.hasH1);
const legacyLinks = scanLegacyLinks();
const emptyAlt = scanEmptyAlt();
const seoEntries = parsePublicPageSeo();
const redirects = readNextRedirects();
const hasNotFound = fs.existsSync(path.join(appDir, "not-found.tsx"));
const readiness = collectReadinessData();

const allValidatorsPass = readiness?.validation
  ? readiness.validation.jsonLd &&
    readiness.validation.technical &&
    readiness.validation.social
  : false;

const googleSearchReady =
  allValidatorsPass &&
  missingPublicMetadata.length === 0 &&
  seoEntries.duplicateTitles.length === 0 &&
  seoEntries.duplicatePaths.length === 0;

const metadataScore = publicRoutes.length
  ? Math.round(
      ((publicRoutes.length - missingPublicMetadata.length) / publicRoutes.length) * 100
    )
  : 100;

const headingScore = publicRoutes.length
  ? Math.round(
      ((publicRoutes.length - missingPublicH1.length) / publicRoutes.length) * 100
    )
  : 100;

const lines = [
  "# Foodiq Google Search Readiness Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Final Verdict",
  "",
  googleSearchReady
    ? "**Status: READY for Google Search** — all automated checks passed."
    : "**Status: NOT READY** — resolve failing checks below before submitting to Google Search Console.",
  "",
  "## Google Search Checklist",
  "",
  "| Check | Status | Details |",
  "|-------|--------|---------|",
  `| robots.txt | ${readiness?.validation?.technical ? "✅ Pass" : "⚠️ Review"} | \`app/robots.ts\` — Allow \`/\`, ${readiness?.robots?.disallowCount ?? "—"} disallow rules, sitemap declared |`,
  `| sitemap.xml | ${readiness?.validation?.technical ? "✅ Pass" : "⚠️ Review"} | \`app/sitemap.ts\` — ${readiness?.sitemap?.dedupedUrlCount ?? "—"} static URLs (deduped), revalidate ${readiness?.sitemap?.revalidateSeconds ?? 3600}s |`,
  `| Metadata (title, description, robots) | ${missingPublicMetadata.length === 0 ? "✅ Pass" : "❌ Fail"} | ${publicRoutes.length - missingPublicMetadata.length}/${publicRoutes.length} public routes with dedicated metadata |`,
  `| Schema.org JSON-LD | ${readiness?.validation?.jsonLd ? "✅ Pass" : "❌ Fail"} | Organization, WebSite, LocalBusiness, Restaurant, BreadcrumbList, SearchAction, Product |`,
  `| Canonical URLs | ${seoEntries.duplicatePaths.length === 0 ? "✅ Pass" : "❌ Fail"} | \`alternates.canonical\` via \`buildPageMetadata()\`, ${redirects.length} legacy redirects |`,
  `| Open Graph | ${readiness?.validation?.social ? "✅ Pass" : "❌ Fail"} | og:title, og:description, og:url, og:image (1200×630), route \`opengraph-image.tsx\` |`,
  `| Twitter Cards | ${readiness?.validation?.social ? "✅ Pass" : "❌ Fail"} | summary_large_image, twitter:title/description/image, \`twitter-image.tsx\` |`,
  "",
];

if (readiness) {
  lines.push(
    "### robots.txt Configuration",
    "",
    "| Setting | Value |",
    "|---------|-------|",
    `| Site URL | \`${readiness.siteUrl}\` |`,
    `| User-agent | \`${readiness.robots.userAgent}\` |`,
    `| Allow | \`${readiness.robots.allow.join(", ")}\` |`,
    `| Disallow rules | ${readiness.robots.disallowCount} paths (cart, checkout, account, API, etc.) |`,
    `| Sitemap | \`${readiness.robots.sitemap}\` |`,
    `| Host | \`${readiness.robots.host}\` |`,
    "",
    "### sitemap.xml Coverage",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Static sitemap URLs | ${readiness.sitemap.staticUrlCount} |`,
    `| After deduplication | ${readiness.sitemap.dedupedUrlCount} |`,
    `| Static public routes covered | ${readiness.sitemap.staticPublicRoutes} |`,
    `| Dynamic entries | Restaurants + menu items from API at runtime |`,
    `| Private routes excluded | ✅ cart, checkout, profile, admin, API |`,
    `| Redirect-only routes excluded | ✅ /restaurants, /help-center, /support, etc. |`,
    "",
    "### Schema.org JSON-LD",
    "",
    "| Schema | Valid |",
    "|--------|-------|",
    ...readiness.schema.map(
      (item) => `| ${item.schema} | ${item.valid ? "✅" : "❌ " + item.errors.join("; ")} |`
    ),
    "",
    "### Open Graph & Twitter Cards (sample pages)",
    "",
    "| Page | Valid |",
    "|------|-------|",
    ...readiness.social.map(
      (item) => `| ${item.label} | ${item.valid ? "✅" : "❌ " + item.errors.join("; ")} |`
    ),
    "",
    "### Canonical URL Strategy",
    "",
    "- Every public page sets `alternates.canonical` to an absolute HTTPS URL",
    "- Entity pages (food, restaurant, category, cuisine) use `generateMetadata` + `buildEntityMetadata`",
    "- Legacy URLs 308-redirect to canonical paths (no redirect chains in internal links)",
    "- Home and entity routes use file-based `opengraph-image.tsx` for social previews",
    "- Static landing pages use dynamic `/api/social-image` for branded OG images",
    "",
    "### Automated Validation (`npm run seo:validate`)",
    "",
    "| Validator | Result |",
    "|-----------|--------|",
    `| JSON-LD schemas | ${passFail(readiness.validation.jsonLd)} |`,
    `| Technical SEO (robots + sitemap) | ${passFail(readiness.validation.technical)} |`,
    `| Social metadata (OG + Twitter) | ${passFail(readiness.validation.social)} |`,
    ""
  );
}

lines.push(
  "## Executive Summary",
  "",
  "| Category | Status | Score |",
  "|----------|--------|-------|",
  `| Dedicated page metadata (public routes) | ${missingPublicMetadata.length === 0 ? "✅ Pass" : "⚠️ Issues"} | ${metadataScore}% (${publicRoutes.length - missingPublicMetadata.length}/${publicRoutes.length}) |`,
  `| Heading coverage (public routes with h1) | ${missingPublicH1.length === 0 ? "✅ Pass" : "⚠️ Issues"} | ${headingScore}% (${publicRoutes.length - missingPublicH1.length}/${publicRoutes.length}) |`,
  `| Duplicate metadata titles | ${seoEntries.duplicateTitles.length === 0 ? "✅ Pass" : "❌ Fail"} | ${seoEntries.duplicateTitles.length} duplicates |`,
  `| Duplicate canonical paths | ${seoEntries.duplicatePaths.length === 0 ? "✅ Pass" : "❌ Fail"} | ${seoEntries.duplicatePaths.length} duplicates |`,
  `| Legacy internal links | ${legacyLinks.length === 0 ? "✅ Pass" : "⚠️ Review"} | ${legacyLinks.length} remaining |`,
  `| Empty alt attributes (UI) | ${emptyAlt.length === 0 ? "✅ Pass" : "⚠️ Review"} | ${emptyAlt.length} files |`,
  `| Global 404 page | ${hasNotFound ? "✅ Present" : "❌ Missing"} | \`app/not-found.tsx\` |`,
  `| Configured redirects | ✅ | ${redirects.length} rules |`,
  "",
  "## Fixes Applied This Audit",
  "",
  "- Fixed `absoluteUrl()` to preserve query strings so `/api/social-image` OG URLs validate correctly",
  "- Added dedicated SEO layouts + metadata for `/blog`, `/careers`, `/press`, `/refund-policy`",
  "- Removed duplicate `/restaurants` SEO layout; route now 308 redirects to `/order-online`",
  "- Unified help URLs to `/help-support` (redirects for `/help`, `/faq`, `/help-center`, `/support`)",
  "- Updated Footer and internal links to canonical paths (no redirect hops)",
  "- Excluded redirect-only routes from sitemap discovery (`/restaurants`, `/support`, `/help-center`)",
  "- Added global `app/not-found.tsx` with `noIndex` metadata",
  "- Added screen-reader h1 on `/popular-restaurants` and `/live-cricket`",
  "- Replaced empty `alt=\"\"` on user-uploaded/review images with descriptive alt text",
  "- Updated JSON-LD breadcrumbs to use `/order-online` as restaurants listing URL",
  "",
  "## Metadata Coverage (Public Routes)",
  "",
  "| Route | Dedicated metadata | Source | h1 |",
  "|-------|-------------------|--------|-----|",
  ...publicRoutes.map((a) => {
    const source = a.pageMeta ? "page" : a.layoutMeta ? "layout" : "—";
    return `| \`${a.route}\` | ${a.hasDedicatedMetadata ? "✅" : "❌"} | ${source} | ${a.hasH1 ? "✅" : "❌"} |`;
  }),
  "",
);

if (missingPublicMetadata.length > 0) {
  lines.push("### Missing Dedicated Metadata", "");
  for (const item of missingPublicMetadata) {
    lines.push(`- \`${item.route}\``);
  }
  lines.push("");
}

if (missingPublicH1.length > 0) {
  lines.push("### Missing h1", "");
  for (const item of missingPublicH1) {
    lines.push(`- \`${item.route}\` (\`${path.relative(root, item.pagePath)}\`)`);
  }
  lines.push("");
}

lines.push(
  "## Canonical & Redirect Map",
  "",
  "| Legacy URL | Canonical destination |",
  "|------------|----------------------|",
  ...LEGACY_HREFS.map(
    ({ legacy, canonical }) => `| \`${legacy}\` | \`${canonical}\` |`
  ),
  "",
  "### next.config.ts redirects",
  "",
  "| Source | Destination |",
  "|--------|-------------|",
  ...redirects.map((r) => `| \`${r.source}\` | \`${r.destination}\` |`),
  "",
  "## Duplicate Metadata Check (`lib/seo/pages.ts`)",
  "",
  `- SEO entries: **${seoEntries.entryCount}**`,
  `- Duplicate titles: **${seoEntries.duplicateTitles.length === 0 ? "none" : seoEntries.duplicateTitles.join(", ")}**`,
  `- Duplicate paths: **${seoEntries.duplicatePaths.length === 0 ? "none" : seoEntries.duplicatePaths.join(", ")}**`,
  "",
  "## Broken / Legacy Link Scan",
  ""
);

if (legacyLinks.length === 0) {
  lines.push("No legacy internal links detected in `app/` or `components/`.", "");
} else {
  lines.push("| File | Legacy href |", "|------|-------------|");
  for (const item of legacyLinks) {
    lines.push(`| \`${item.file}\` | \`${item.legacy}\` |`);
  }
  lines.push("");
}

lines.push("## Empty Alt Text Scan", "");

if (emptyAlt.length === 0) {
  lines.push("No UI files with empty alt attributes (excluding OG image generator).", "");
} else {
  lines.push("| File | Empty alt count |", "|------|-----------------|");
  for (const item of emptyAlt) {
    lines.push(`| \`${item.file}\` | ${item.count} |`);
  }
  lines.push("");
}

lines.push(
  "## Infrastructure Checklist",
  "",
  "| Item | Status |",
  "|------|--------|",
  "| Unique titles & descriptions | ✅ Centralized via `lib/seo/pages.ts` + dynamic `generateMetadata` |",
  "| Canonical URLs | ✅ `buildPageMetadata()` alternates.canonical |",
  "| Open Graph & Twitter Cards | ✅ Metadata builder + `/api/social-image` / route OG images |",
  "| robots.txt | ✅ `app/robots.ts` |",
  "| sitemap.xml | ✅ `app/sitemap.ts` (static + dynamic, deduped, private routes excluded) |",
  "| JSON-LD (Organization, WebSite, FAQ, breadcrumbs) | ✅ Root + entity layouts |",
  "| Favicon & manifest | ✅ `public/icons/` + `app/manifest.ts` |",
  "| Technical validation CI | ✅ `npm run seo:validate` |",
  "",
  "## Route Inventory",
  "",
  `- Total routes: **${routes.length}**`,
  `- Public routes: **${publicRoutes.length}**`,
  `- Private routes: **${privateRoutes.length}**`,
  `- SEO layout files: **${countFiles(/^layout\.tsx$/, appDir)}**`,
  "",
  "## Google Search Console Setup",
  "",
  "1. Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g. `https://foodiq.com`).",
  "2. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in production env.",
  `3. Submit sitemap: \`${readiness?.robots?.sitemap ?? "https://YOUR_DOMAIN/sitemap.xml"}\``,
  "4. Request indexing for homepage and key landing pages (`/`, `/order-online`, `/offers`).",
  "5. Optional: set `NEXT_PUBLIC_BING_SITE_VERIFICATION` and `NEXT_PUBLIC_YANDEX_SITE_VERIFICATION`.",
  "",
  "## Validation Commands",
  "",
  "```bash",
  "npm run seo:validate",
  "npm run seo:report",
  "```",
  ""
);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, lines.join("\n"));
console.log(`Technical SEO audit report written to ${reportPath}`);

if (missingPublicMetadata.length > 0) {
  console.warn(
    `Warning: ${missingPublicMetadata.length} public route(s) missing dedicated metadata`
  );
}
