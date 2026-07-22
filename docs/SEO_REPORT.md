# Foodiq Google Search Readiness Report

Generated: 2026-07-22T07:09:13.116Z

## Final Verdict

**Status: READY for Google Search** — all automated checks passed.

## Google Search Checklist

| Check | Status | Details |
|-------|--------|---------|
| robots.txt | ✅ Pass | `app/robots.ts` — Allow `/`, 33 disallow rules, sitemap declared |
| sitemap.xml | ✅ Pass | `app/sitemap.ts` — 468 static URLs (deduped), revalidate 3600s |
| Metadata (title, description, robots) | ✅ Pass | 17/17 public routes with dedicated metadata |
| Schema.org JSON-LD | ✅ Pass | Organization, WebSite, LocalBusiness, Restaurant, BreadcrumbList, SearchAction, Product |
| Canonical URLs | ✅ Pass | `alternates.canonical` via `buildPageMetadata()`, 15 legacy redirects |
| Open Graph | ✅ Pass | og:title, og:description, og:url, og:image (1200×630), route `opengraph-image.tsx` |
| Twitter Cards | ✅ Pass | summary_large_image, twitter:title/description/image, `twitter-image.tsx` |

### robots.txt Configuration

| Setting | Value |
|---------|-------|
| Site URL | `https://foodiq-ecru.vercel.app` |
| User-agent | `*` |
| Allow | `/` |
| Disallow rules | 33 paths (cart, checkout, account, API, etc.) |
| Sitemap | `https://foodiq-ecru.vercel.app/sitemap.xml` |
| Host | `foodiq-ecru.vercel.app` |

### sitemap.xml Coverage

| Metric | Value |
|--------|-------|
| Static sitemap URLs | 468 |
| After deduplication | 468 |
| Static public routes covered | 17 |
| Dynamic entries | Restaurants + menu items from API at runtime |
| Private routes excluded | ✅ cart, checkout, profile, admin, API |
| Redirect-only routes excluded | ✅ /restaurants, /help-center, /support, etc. |

### Schema.org JSON-LD

| Schema | Valid |
|--------|-------|
| Organization | ✅ |
| WebSite | ✅ |
| LocalBusiness | ✅ |
| Restaurant | ✅ |
| BreadcrumbList | ✅ |
| SearchAction | ✅ |
| Product | ✅ |

### Open Graph & Twitter Cards (sample pages)

| Page | Valid |
|------|-------|
| Root layout | ✅ |
| Home page | ✅ |
| Order online | ✅ |
| Search page | ✅ |
| Entity page | ✅ |
| Private page | ✅ |

### Canonical URL Strategy

- Every public page sets `alternates.canonical` to an absolute HTTPS URL
- Entity pages (food, restaurant, category, cuisine) use `generateMetadata` + `buildEntityMetadata`
- Legacy URLs 308-redirect to canonical paths (no redirect chains in internal links)
- Home and entity routes use file-based `opengraph-image.tsx` for social previews
- Static landing pages use dynamic `/api/social-image` for branded OG images

### Automated Validation (`npm run seo:validate`)

| Validator | Result |
|-----------|--------|
| JSON-LD schemas | ✅ Pass |
| Technical SEO (robots + sitemap) | ✅ Pass |
| Social metadata (OG + Twitter) | ✅ Pass |

## Executive Summary

| Category | Status | Score |
|----------|--------|-------|
| Dedicated page metadata (public routes) | ✅ Pass | 100% (17/17) |
| Heading coverage (public routes with h1) | ✅ Pass | 100% (17/17) |
| Duplicate metadata titles | ✅ Pass | 0 duplicates |
| Duplicate canonical paths | ✅ Pass | 0 duplicates |
| Legacy internal links | ✅ Pass | 0 remaining |
| Empty alt attributes (UI) | ⚠️ Review | 1 files |
| Global 404 page | ✅ Present | `app/not-found.tsx` |
| Configured redirects | ✅ | 15 rules |

## Fixes Applied This Audit

- Fixed `absoluteUrl()` to preserve query strings so `/api/social-image` OG URLs validate correctly
- Added dedicated SEO layouts + metadata for `/blog`, `/careers`, `/press`, `/refund-policy`
- Removed duplicate `/restaurants` SEO layout; route now 308 redirects to `/order-online`
- Unified help URLs to `/help-support` (redirects for `/help`, `/faq`, `/help-center`, `/support`)
- Updated Footer and internal links to canonical paths (no redirect hops)
- Excluded redirect-only routes from sitemap discovery (`/restaurants`, `/support`, `/help-center`)
- Added global `app/not-found.tsx` with `noIndex` metadata
- Added screen-reader h1 on `/popular-restaurants` and `/live-cricket`
- Replaced empty `alt=""` on user-uploaded/review images with descriptive alt text
- Updated JSON-LD breadcrumbs to use `/order-online` as restaurants listing URL

## Metadata Coverage (Public Routes)

| Route | Dedicated metadata | Source | h1 |
|-------|-------------------|--------|-----|
| `/` | ✅ | page | ✅ |
| `/about` | ✅ | layout | ✅ |
| `/blog` | ✅ | layout | ✅ |
| `/careers` | ✅ | layout | ✅ |
| `/collections` | ✅ | layout | ✅ |
| `/contact` | ✅ | layout | ✅ |
| `/help-support` | ✅ | layout | ✅ |
| `/live-cricket` | ✅ | layout | ✅ |
| `/offers` | ✅ | layout | ✅ |
| `/order-online` | ✅ | layout | ✅ |
| `/popular-cuisines` | ✅ | layout | ✅ |
| `/press` | ✅ | layout | ✅ |
| `/privacy-policy` | ✅ | layout | ✅ |
| `/refund-policy` | ✅ | layout | ✅ |
| `/search` | ✅ | layout | ✅ |
| `/terms-of-service` | ✅ | layout | ✅ |
| `/trending-dishes` | ✅ | layout | ✅ |

## Canonical & Redirect Map

| Legacy URL | Canonical destination |
|------------|----------------------|
| `/help` | `/help-support` |
| `/faq` | `/help-support` |
| `/terms` | `/terms-of-service` |
| `/privacy` | `/privacy-policy` |
| `/categories` | `/popular-cuisines` |
| `/restaurants` | `/order-online` |
| `/support` | `/help-support` |
| `/help-center` | `/help-support` |

### next.config.ts redirects

| Source | Destination |
|--------|-------------|
| `/terms` | `undefined` |
| `/privacy` | `undefined` |
| `/help` | `undefined` |
| `/faq` | `undefined` |
| `/help-center` | `undefined` |
| `/support` | `undefined` |
| `/restaurants` | `undefined` |
| `/categories` | `undefined` |
| `/orders` | `undefined` |
| `/order-tracking` | `undefined` |
| `/popular-restaurants` | `undefined` |
| `/restaurant/login` | `undefined` |
| `/partner` | `undefined` |
| `/restaurant/register` | `undefined` |
| `/track-order/:orderId` | `undefined` |

## Duplicate Metadata Check (`lib/seo/pages.ts`)

- SEO entries: **23**
- Duplicate titles: **none**
- Duplicate paths: **none**

## Broken / Legacy Link Scan

No legacy internal links detected in `app/` or `components/`.

## Empty Alt Text Scan

| File | Empty alt count |
|------|-----------------|
| `app\blog\page.tsx` | 1 |

## Infrastructure Checklist

| Item | Status |
|------|--------|
| Unique titles & descriptions | ✅ Centralized via `lib/seo/pages.ts` + dynamic `generateMetadata` |
| Canonical URLs | ✅ `buildPageMetadata()` alternates.canonical |
| Open Graph & Twitter Cards | ✅ Metadata builder + `/api/social-image` / route OG images |
| robots.txt | ✅ `app/robots.ts` |
| sitemap.xml | ✅ `app/sitemap.ts` (static + dynamic, deduped, private routes excluded) |
| JSON-LD (Organization, WebSite, FAQ, breadcrumbs) | ✅ Root + entity layouts |
| Favicon & manifest | ✅ `public/icons/` + `app/manifest.ts` |
| Technical validation CI | ✅ `npm run seo:validate` |

## Route Inventory

- Total routes: **118**
- Public routes: **17**
- Private routes: **100**
- SEO layout files: **47**

## Google Search Console Setup

1. Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g. `https://foodiq.com`).
2. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in production env.
3. Submit sitemap: `https://foodiq-ecru.vercel.app/sitemap.xml`
4. Request indexing for homepage and key landing pages (`/`, `/order-online`, `/offers`).
5. Optional: set `NEXT_PUBLIC_BING_SITE_VERIFICATION` and `NEXT_PUBLIC_YANDEX_SITE_VERIFICATION`.

## Validation Commands

```bash
npm run seo:validate
npm run seo:report
```
