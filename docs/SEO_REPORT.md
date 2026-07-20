# Foodiq SEO Report

Generated: 2026-07-20T08:35:53.681Z

## Summary

- Total routes: **97**
- Public routes: **17**
- Private routes: **80**
- Public routes with metadata: **17/17**
- SEO layout files: **41**
- Icon assets: **16**

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
| `/offline` | ✅ | page |
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
