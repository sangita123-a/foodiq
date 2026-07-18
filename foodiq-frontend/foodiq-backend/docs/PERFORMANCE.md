# Foodiq Performance Optimization

Production-grade performance layer — additive, no UI redesigns, no breaking API changes.

## Summary (Before → After)

| Area | Before | After |
|------|--------|-------|
| Catalog APIs | Always hit Postgres | Redis/memory cache + `X-Cache` header |
| Restaurant list | Correlated review subquery | Aggregated `LEFT JOIN` review counts |
| DB indexes | Partial / ops-only | Catalog + orders + payments indexes via `ensureSchema` |
| HTTP | Uncompressed JSON | `compression` middleware (gzip) |
| Pool | Fixed max 20 | `DB_POOL_MAX` tunable + pool stats in monitoring |
| Socket.IO | In-memory only | Optional Redis adapter; tuned ping/deflate |
| Next.js images | Default | AVIF/WebP, cache TTL, responsive sizes |
| Static assets | No long cache headers | `/_next/static` immutable 1y |
| Push provider | Eager in root | Dynamic `ssr: false` import |
| SafeImage | `sizes=100vw` | Responsive sizes + lazy |

**Targets (measure after deploy):**
- API p95 catalog reads **&lt; 200ms** (warm cache)
- Lighthouse Performance **&gt; 95** (home + restaurant list)
- FCP **&lt; 1.8s**, LCP **&lt; 2.5s**, TBT **&lt; 200ms**, CLS **&lt; 0.1**

## Redis caching

```env
# Optional — without Redis, in-memory cache is used automatically
REDIS_URL=redis://127.0.0.1:6379
# or REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
REDIS_ENABLED=true
CACHE_TTL_SECONDS=60
CACHE_TTL_RESTAURANTS=45
CACHE_TTL_MENU=60
CACHE_TTL_CATEGORIES=300
CACHE_TTL_OFFERS=120
CACHE_TTL_CUISINES=300
CACHE_PREFIX=foodiq:
SOCKET_REDIS_ADAPTER=true
```

Cached GETs:
- `/api/restaurants`, `/api/restaurants/:id`, `/api/restaurants/:id/menu`
- `/api/restaurant-categories`
- `/api/offers`
- `/api/cuisines`

Invalidation on partner dish create/update/delete and restaurant/category writes.

Warming: categories + offers on API boot.

Hit ratio: `GET /api/monitoring/dashboard` → `services.cache`.

## Database

Indexes added (idempotent):
- `restaurants(is_active, rating)`
- `restaurants(category_id, is_active)`
- `menu_items(restaurant_id, is_available)`
- `menu_items` trending partial
- `reviews(restaurant_id)`
- `orders(user_id, created_at)`
- `orders(restaurant_id, status)`
- `payments(user_id, created_at)` when present

Pool:
```env
DB_POOL_MAX=20
DB_POOL_IDLE_MS=30000
DB_POOL_CONNECT_MS=10000
DB_STATEMENT_TIMEOUT_MS=15000   # optional; 0 = off
```

Vacuum: rely on Postgres autovacuum; for large tables schedule weekly `VACUUM (ANALYZE)` in ops.

## Frontend

- `next.config.ts`: `compress`, AVIF/WebP, long-cache headers, public page `s-maxage`, `optimizePackageImports` for lucide/framer-motion
- Font `display: "swap"` + preload
- `SafeImage` responsive `sizes` + lazy loading
- Push notifications loaded dynamically
- Admin/Delivery shells already dynamic-import their heavy inners
- Orders/notifications SWR polling pauses when the tab is hidden

## Socket.IO

- Longer configurable ping intervals
- `perMessageDeflate` for large payloads
- Redis adapter when Redis is connected (multi-node rooms)

## Load testing

```bash
cd foodiq-frontend/foodiq-backend
npm run perf:load
npm run perf:stress
# CONCURRENCY=100 REQUESTS=10000 BASE_URL=http://localhost:4000 node scripts/load-test.js
```

For capacity tests on **staging**, restart API with:

```bash
PERF_LOADTEST_BYPASS=true RATE_LIMIT_API_MAX=100000 node server.js
```

(`PERF_LOADTEST_BYPASS` only skips the API limiter for User-Agent `foodiq-load-test`.)

Reports JSON: RPS, p50/p95/p99 latency, status codes, pass/fail vs 200ms p95.

Full write-up: [PERFORMANCE_REPORT.md](./PERFORMANCE_REPORT.md) and root `docs/PRODUCTION_PERFORMANCE_REPORT.md`.

## Memory leak probe

```bash
node scripts/memory-probe.js
# INTERVAL_MS=5000 DURATION_MS=120000 node scripts/memory-probe.js
```

Writes `logs/memory-probe-*.json` with heap/RSS delta. Flag if heap grows &gt;50MB in window.

## Job queue

`services/jobQueue.js` — in-process deferred jobs for non-blocking side work (register handlers as needed).

## Recommendations (next iteration)

1. Add `pg_trgm` GIN indexes for search `ILIKE` when search traffic grows.
2. Batch order-item hydration in `orderModel` (remove per-order loops).
3. CDN in front of Next + Cloudinary already for media.
4. Run Lighthouse CI in GitHub Actions against staging.
5. Use Redis session store if sticky sessions are removed at the load balancer.
6. Consider React Server Components for pure catalog pages when migrating further.

## Verification checklist

1. Restart API → indexes + cache warm
2. Hit `/api/restaurants` twice → second response `X-Cache: HIT`
3. Run `node scripts/load-test.js`
4. Open `/admin/monitoring` → cache + db_pool stats
5. Lighthouse mobile on `/` and `/popular-restaurants`
