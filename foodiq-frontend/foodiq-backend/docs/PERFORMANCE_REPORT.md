# Foodiq Performance Optimization — Final Report

**Date:** 2026-07-18  
**Scope:** Additive enterprise performance layer (no UI redesign, no API contract breaks)

---

## 1. Executive summary

Foodiq now has production-grade caching, DB indexes, HTTP compression, tunable pooling, Socket.IO tuning, Next.js asset/image/font optimizations, load-test + memory-probe tooling, and session user caching.

Verified live after API restart:
- `GET /api/restaurants` → **`X-Cache: MISS`** then **`X-Cache: HIT`**
- Catalog responses compressed (`Vary: Accept-Encoding`)

---

## 2. Before vs after

| Area | Before | After |
|------|--------|-------|
| Catalog reads | Always Postgres | Redis or in-memory cache + TTL + invalidation |
| Restaurant list SQL | Correlated review subquery | Aggregated `LEFT JOIN` counts |
| Postgres indexes | Ops/partial | Catalog, orders, payments, reviews indexes |
| HTTP payloads | Uncompressed | gzip via `compression` |
| DB pool | Fixed ~20 | `DB_POOL_MAX` + idle/connect/statement timeout envs |
| Auth `findUserById` | Every request | Session cache TTL 30s + invalidate on profile update |
| Socket.IO | In-memory only | Tuned ping/deflate; Redis adapter when Redis up |
| Next images | Defaults | AVIF/WebP, cache TTL, responsive `sizes`, lazy |
| Static assets | Short cache | `/_next/static` immutable 1y |
| Push provider | Eager in root | Dynamic `ssr: false` |
| Fonts | Default display | `display: "swap"` + preload |
| Touch (mobile) | Tap highlight only | `touch-action: manipulation` |
| Load / memory tools | None | `npm run perf:load` / `perf:memory` |

---

## 3. Lighthouse / Core Web Vitals (targets)

Measure on staging after `next build` + production start:

| Metric | Target |
|--------|--------|
| Performance | **> 95** |
| FCP | **< 1.8s** |
| LCP | **< 2.5s** |
| TBT | **< 200ms** |
| CLS | **< 0.1** |

Frontend changes that support these: compression, image formats, font swap, long-cache headers, package import optimization, lazy images, deferred push provider.

*Run Chrome Lighthouse (Mobile) on `/` and `/popular-restaurants` after deploy.*

---

## 4. API latency (measured locally)

### Cache correctness
| Call | Result |
|------|--------|
| 1st `/api/restaurants?page=1&limit=5` | `X-Cache: MISS` |
| 2nd same URL | `X-Cache: HIT` |

### Warm cache latency (sequential, after HIT)
```
X-Cache: HIT
avg ≈ 36ms | p50 ≈ 36ms | p95 ≈ 49ms
```
**Warm catalog GETs meet the &lt;200ms target easily.**

### Load test A (100 concurrency, 2000 requests, rate-limit bypass on staging-style run)
```
Concurrency=100  Requests=2000
completed=2000  errors=0  rps≈431
latency: avg 227ms | p50 108ms | p95 866ms | p99 1074ms
```
Under heavy concurrency, p95 rises due to Node/Postgres queueing on a single local instance — scale horizontally + Redis in production.

### Load test B (production rate limit 300/min)
```
Concurrency=50  Requests=500
200=397  429=103  (rate limiter working as designed)
```

---

## 5. Database improvements

Indexes (idempotent via `ensureSchema`):
- `idx_restaurants_active_rating`, `idx_restaurants_category_active`
- `idx_menu_items_restaurant_available`, `idx_menu_items_trending`
- `idx_reviews_restaurant`
- `idx_orders_user_created`, `idx_orders_restaurant_status`
- `idx_offers_active_valid`, `idx_payments_user_created`

Pool: `DB_POOL_MAX`, `DB_POOL_IDLE_MS`, `DB_POOL_CONNECT_MS`, optional `DB_STATEMENT_TIMEOUT_MS`.

Query: restaurant list review counts via join aggregate (fewer round-trips).

Vacuum: rely on Postgres autovacuum; schedule weekly `VACUUM (ANALYZE)` on hot tables in ops.

---

## 6. Redis / cache

| Feature | Status |
|---------|--------|
| Redis + memory fallback | ✅ |
| TTL per namespace | ✅ |
| Pattern invalidation | ✅ |
| Boot warming (categories/offers) | ✅ |
| Hit ratio in monitoring | ✅ `services.cache` |
| Session user cache | ✅ 30s TTL |

Cached: restaurants list/id/menu, categories, offers, cuisines.  
Invalidated on partner dish + restaurant/category writes.

---

## 7. Bundle / frontend

| Optimization | Status |
|--------------|--------|
| `compress: true` | ✅ |
| AVIF/WebP | ✅ |
| `optimizePackageImports` (lucide, framer-motion) | ✅ |
| Static immutable cache headers | ✅ |
| SafeImage responsive + lazy | ✅ |
| Dynamic push provider | ✅ |
| Optional `DynamicShells` helper | ✅ (available, not forced into all pages) |
| FCM service worker rewrite (existing) | ✅ SW readiness |

---

## 8. Socket.IO

- Configurable `SOCKET_PING_INTERVAL_MS` / `SOCKET_PING_TIMEOUT_MS`
- `perMessageDeflate` for larger payloads
- Redis adapter when Redis connected (`SOCKET_REDIS_ADAPTER`)

---

## 9. Memory leak tooling

```bash
npm run perf:memory
# INTERVAL_MS=5000 DURATION_MS=120000 npm run perf:memory
```

Writes heap/RSS deltas under `logs/`. Flag if heap grows &gt;50MB in the window. Also review Socket.IO disconnect handlers and React effect cleanups (existing patterns preserved).

---

## 10. Recommendations (next iteration)

1. Put Redis in production and watch `hit_ratio` on `/admin/monitoring`.
2. Run Lighthouse CI on staging after each release.
3. Batch order-item hydration in `orderModel` (N+1 cleanup).
4. `pg_trgm` GIN indexes when search traffic grows.
5. CDN in front of Next; Cloudinary/S3 already for media.
6. Capacity test with `PERF_LOADTEST_BYPASS=true` on staging only (never public prod without edge rate limits).

---

## 11. How to operate

Docs: `foodiq-frontend/foodiq-backend/docs/PERFORMANCE.md`

```bash
cd foodiq-frontend/foodiq-backend
npm run perf:load      # HTTP load test
npm run perf:memory    # heap probe
```

Env: see `.env.example` (`REDIS_*`, `CACHE_*`, `DB_POOL_*`, `PERF_LOADTEST_BYPASS`).
