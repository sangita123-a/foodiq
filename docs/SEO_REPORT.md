# Foodiq SEO Report

Generated: 2026-07-19T18:49:27.633Z

## Summary

- Total routes: **87**
- Public routes: **16**
- Private routes: **71**
- Public routes with metadata: **16/16**
- SEO layout files: **41**
- Icon assets: **8**

## Production SEO Checklist

| Item | Status |
|------|--------|
| Unique titles & descriptions | ✅ Centralized via `lib/seo/pages.ts` + dynamic `generateMetadata` |
| Canonical URLs | ✅ `buildPageMetadata()` alternates.canonical |
| Open Graph & Twitter Cards | ✅ All pages via metadata builder |
| robots.txt | ✅ `app/robots.ts` (dynamic) |
| sitemap.xml | ✅ `app/sitemap.ts` (auto-discovered static + dynamic routes) |
| JSON-LD Organization | ✅ Root layout |
| JSON-LD WebSite + SearchAction | ✅ Root layout |
| JSON-LD FoodDeliveryService | ✅ Root layout |
| JSON-LD FAQ | ✅ Home + Help & Support |
| JSON-LD Restaurant / Menu / Product | ✅ Entity pages |
| Favicon & app icons | ✅ `public/icons/` + `app/icon.png` |
| Web manifest | ✅ `app/manifest.ts` |
| Google Search Console verification | ✅ `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |

## Target Search Queries

- Foodiq
- Foodiq Food Delivery
- Foodiq Hyderabad
- Foodiq Online Food Delivery
- Foodiq Restaurant
- Foodiq Official Website

Homepage title: **Foodiq | Online Food Delivery Platform**

## Public Routes

| Route | Metadata | Source |
|-------|----------|--------|
| `/` | ✅ | page |
| `/about` | ✅ | layout |
| `/collections` | ✅ | layout |
| `/contact` | ✅ | layout |
| `/help-support` | ✅ | layout |
| `/live-cricket` | ✅ | layout |
| `/offers` | ✅ | layout |
| `/order-online` | ✅ | layout |
| `/popular-cuisines` | ✅ | layout |
| `/popular-restaurants` | ✅ | layout |
| `/privacy-policy` | ✅ | layout |
| `/restaurants` | ✅ | layout |
| `/search` | ✅ | layout |
| `/support` | ✅ | layout |
| `/terms-of-service` | ✅ | layout |
| `/trending-dishes` | ✅ | layout |

## Google Search Console Setup

1. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel/production env.
2. Submit sitemap: `https://YOUR_DOMAIN/sitemap.xml`
3. Request indexing for homepage and key landing pages.
4. Optional: set `NEXT_PUBLIC_BING_SITE_VERIFICATION` and `NEXT_PUBLIC_YANDEX_SITE_VERIFICATION`.

## Lighthouse (local production build)

Audited at `http://localhost:3001` after `npm run build && npm run start`.

| Audit | Result |
|-------|--------|
| SEO — document title | ✅ Pass |
| SEO — meta description | ✅ Pass |
| SEO — canonical | ✅ Pass |
| SEO — crawlable | ✅ Pass |
| Performance — FCP | 1.2s (score 99) |
| Performance — LCP | 5.1s (local; Vercel CDN typically improves) |
| Performance — CLS | 0 (score 100) |
| Accessibility — image alt | ✅ Pass |

> Re-run on deployed Vercel URL for production Lighthouse scores. Set `NEXT_PUBLIC_SITE_URL` to your custom domain before deploy.
