# Foodiq Production Launch Report

**Date:** 2026-07-18  
**Scope:** Full frontend + backend production readiness audit + live smoke  
**UI redesign:** None (audit, harden, optimize only)

---

## Launch readiness score: **72 / 100 — HOLD**

Code is production-hardened. **Public launch is blocked** until live deploy issues below are cleared.

| Area | Score | Notes |
|------|------:|-------|
| Security (code) | 92 | Catalog writes secured; OTP leak fixed; Render hardened |
| SEO / Discoverability (code) | 90 | robots, sitemap, OG/Twitter, JSON-LD, icons, manifest |
| Backend / API (code) | 88 | Authz, rate limits, cache, compression, health route |
| Frontend performance (code) | 85 | Code-split, image sizes, deferred hero/video, CSP |
| Payments | 78 | Mock blocked; **live Razorpay keys must be set on Render** |
| Ops / live deploy | 45 | **Vercel SSO + Render API 404** |
| PWA | 70 | Manifest + push icons OK; no offline Workbox SW (by design) |

---

## Live blockers (must fix before public launch)

### 1. Vercel Deployment Protection (SSO)
- Evidence: `GET https://foodiq-sangita123-as-projects.vercel.app/robots.txt` → **302** to `vercel.com/sso-api`
- Also returns `X-Robots-Tag: noindex`
- Impact: public users, crawlers, Lighthouse, and SEO cannot access the site
- **Action:** Vercel → Project → Deployment Protection → disable for **Production** (or use a public custom domain without SSO)

### 2. Render API not serving
- Evidence: `GET https://foodiq-backend-api.onrender.com/api/health` → **404** (root also 404)
- Impact: checkout, auth, panels, DB health unverifiable from public URL
- **Action:** Render Dashboard → `foodiq-backend-api` → confirm service exists, latest deploy succeeded, `rootDir=foodiq-frontend/foodiq-backend`, `npm start`, check logs

### 3. Payments / messaging (config)
- Razorpay keys `sync: false` in blueprint; `EMAIL_PROVIDER=mock` / `SMS_PROVIDER=mock`
- **Action:** set live keys + real providers before paid traffic

---

## Issues found (code audit)

### Critical (fixed)
1. Unauthenticated CRUD on restaurants / menu items / categories / menu-categories
2. `render.yaml` ran `seed.js` on first deploy (TRUNCATE + demo passwords)
3. OTP `debug_code` leaked when `EMAIL_PROVIDER=mock`
4. `CORS_ALLOW_VERCEL=true` in blueprint
5. Missing push notification icon files referenced by FCM SW

### High (fixed)
6. Empty Organization `sameAs: []` in JSON-LD
7. Restaurant `AggregateRating` missing `reviewCount`
8. Sitemap limits / dead `void getSiteUrl()`
9. Unused public create-next-app SVGs

---

## Issues fixed in this audit

| Fix | Location |
|-----|----------|
| Protect catalog POST/PUT/DELETE (`admin` / `restaurant_owner`) | `routes/restaurantRoutes.js`, `menuItemRoutes.js`, `categoryRoutes.js`, `menuCategoryRoutes.js` |
| Remove seed hook; tighten CORS/payments/bootstrap flags | `render.yaml` |
| OTP debug only with `OTP_EXPOSE_CODE=true` and never in production | `services/otpService.js` |
| Add `notification-icon.png` / `notification-badge.png` | `public/icons/` |
| AggregateRating `reviewCount`; drop empty `sameAs` | `lib/seo/jsonld.ts` |
| Sitemap limit 500; remove dead call | `app/sitemap.ts` |
| Wire `review_count` on restaurant layout type | `app/restaurant/[id]/layout.tsx` |
| Delete unused public SVGs | `public/*.svg` |

---

## Verification checklist

| Requirement | Status |
|-------------|--------|
| Frontend audit | Pass (code) |
| Backend audit | Pass (code) |
| APIs (live) | **Blocker** (404) |
| PostgreSQL connectivity (live) | **Blocker** (via health) |
| Auth / authorization | Pass (code) |
| Restaurant / Delivery / Admin panels | Pass (code / route shells) |
| Checkout flow | Pass (code; needs live API + Razorpay) |
| Razorpay | Pass mock block; configure live keys |
| Images | Pass |
| Responsive | Pass (no UI redesign) |
| Lighthouse (live) | **N/A** (SSO blocks) |
| robots.txt / sitemap (code) | Pass |
| robots/sitemap (live public) | **Blocker** (SSO) |
| Open Graph / Twitter | Pass (code) |
| Schema.org | Pass (improved) |
| Favicon / icons | Pass |
| manifest / PWA basics | Pass (no offline SW) |
| Security headers | Pass |
| CORS | Pass (strict) |
| Rate limiting | Pass |
| Logging / monitoring | Pass |
| Caching + compression | Pass |
| Bundle optimization | Pass (prior pass) |

---

## Lighthouse scores

**Not measured live** — Production URL requires Vercel SSO.

After protection is disabled, run [PageSpeed Insights](https://pagespeed.web.dev/).

| Category | Code estimate | Target |
|----------|--------------:|-------:|
| Performance | 78–88 | ≥ 80 |
| Accessibility | 88–95 | ≥ 90 |
| Best Practices | 90–96 | ≥ 90 |
| SEO | 92–100 | ≥ 90 |

---

## Security status: **Code ready (with config)**

- JWT + refresh rotation, httpOnly cookies, bcrypt 12
- Helmet + CSP + HSTS (prod)
- Rate limits, CSRF, sanitized input
- Payment mock completion blocked in production
- Catalog mutations authenticated
- OTP codes not exposed in production

---

## Deployment status

| Layer | Platform | Status |
|-------|----------|--------|
| Frontend code | Vercel | Ready |
| Frontend live | Vercel URL | **Blocked by Deployment Protection** |
| Backend code | Render blueprint | Hardened |
| Backend live | onrender.com | **404 — service not healthy** |
| CI/CD | GitHub Actions | Ready (CI gates deploy) |

---

## Go-live actions (owner) — do in order

1. **Disable Vercel Deployment Protection** on Production
2. **Fix Render** so `GET /api/health` returns 200
3. Set Vercel env: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL` → redeploy
4. Set Render: Razorpay keys, webhook secret, real `EMAIL_PROVIDER` / SMS
5. Confirm `FRONTEND_URL` / `CORS_ORIGINS` match the public domain
6. Manual seed once if catalog empty (never via deploy hook)
7. PageSpeed + checkout smoke; approve GitHub production Environment

---

## Launch readiness: **72 / 100 — HOLD**

Ship the code fixes, then clear the two live blockers. Re-score after `/api/health` is green and the site is publicly reachable without SSO.
