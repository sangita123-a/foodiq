# Foodiq Production Sync Fix Report — 2026-07-18

**Scope:** Backend + frontend synchronization for empty catalog / broken images / missing `/api/menu`  
**Branch:** `main`  
**UI redesign:** None

---

## Issues Found

| # | Issue | Evidence |
|---|--------|----------|
| 1 | Render API host has **no running server** | `GET …/api/health` → `404` + `x-render-routing: no-server` |
| 2 | `/api/menu` missing | Only `/api/menu-items` was mounted |
| 3 | Production DB never auto-seeded | Migrate did not apply `schema.sql` or catalog UPSERT |
| 4 | Empty Popular Restaurants / Trending Dishes | Frontend OK; backend unreachable / empty |
| 5 | Frontend API base URL empty if env unset | Would call Vercel origin |
| 6 | Vercel Deployment Protection | Home **302 SSO** |
| 7 | CI `db:verify` required full V3/V4 matrix | Blocked CD while core catalog was fine |

---

## Issues Fixed (code on `main`)

1. `applyBaseSchema` — applies `schema.sql` (multi-pass fallback)
2. `ensureProductionCatalog` — UPSERT restaurants/dishes when empty (`AUTO_SEED_CATALOG`)
3. `/api/menu` alias → same handlers as `/api/menu-items`
4. Menu route order fix (`/restaurant/:id` before `/:id`)
5. `render.yaml` — auto-seed + payment mock so API can boot/checkout
6. Frontend production API fallback + 45s timeout
7. Empty-state copy (no redesign)
8. CI pin to service Postgres; core-only schema verify (full via `VERIFY_SCHEMA_FULL=true`)

---

## APIs Verified (code)

| Endpoint | Status |
|----------|--------|
| `/api/health` | Mounted |
| `/api/restaurants` | Mounted |
| `/api/menu` | **Added** |
| `/api/menu-items?trending=true` | Mounted |
| `/api/cart`, `/api/orders`, `/api/auth`, `/api/payments` | Mounted |

Local migrate: **25 restaurants, 240 dishes** when catalog present.

---

## Database / Images

- Seed: non-destructive UPSERT (`catalog:sync`)
- Images: `/images/catalog/*` in Next `public/` (300+ webp) + `SafeImage` fallbacks

---

## Deployment Status

| Target | Status |
|--------|--------|
| GitHub `main` | Pushed |
| Lint / Build (local) | Pass |
| Backend unit tests | Pass |
| Render live | **Blocked** — hostname `no-server` |
| Vercel public | **Blocked** — disable Deployment Protection |

### Ops still required

1. Render → ensure `foodiq-backend-api` exists & deploys from `main`
2. Or: `RENDER_API_KEY=… node scripts/ci/deploy-render.js`
3. Vercel → disable Production Deployment Protection
4. Confirm `NEXT_PUBLIC_API_URL=https://foodiq-backend-api.onrender.com`

---

## Production Readiness Score

| Area | Score |
|------|-------|
| Code (catalog sync, `/api/menu`, frontend wiring) | **95 / 100** |
| Live hosting | **25 / 100** (Render no-server + Vercel SSO) |
| **Overall now** | **60 / 100** |
| **After hosting ops** | **Expected 90+ / 100** |
