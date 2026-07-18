# Foodiq Production Performance Report

**CPI Task 6 — Performance Optimization & Release Engineering**  
**Date:** 2026-07-18 · **Version:** 4.0.0  
**Scope:** Next.js frontend + Express/Postgres API (no UI redesign)

---

## Executive summary

Foodiq’s performance layer was audited and extended for production launch. Catalog APIs now emit **CDN-friendly Cache-Control**, search/suggest use short-TTL Redis/memory cache, restaurant-by-id SQL matches the list join pattern, client polling pauses when tabs are hidden, and load/stress tooling covers search endpoints. Frontend already ships AVIF/WebP, code splitting, gzip, and long-lived static caches.

| Area | Status |
|------|--------|
| Frontend bundle / lazy load | Optimized (home dynamic sections; shells already split) |
| Images | AVIF/WebP via `next/image` + `SafeImage` |
| Compression | Next `compress` + Express gzip (Brotli at CDN/edge) |
| Browser / CDN cache | Static immutable + public catalog `s-maxage` |
| API latency | Redis/memory catalog cache; warm p95 target &lt; 200ms |
| Postgres | Composite + trgm indexes via `ensureSchema` |
| React polling | Visibility-aware intervals for orders/notifications |
| CWV / Lighthouse | Targets ≥95 — measure on staging after deploy |
| Load / stress | `npm run perf:load` / `perf:stress` |

---

## Requirement coverage

| # | Requirement | Result |
|---|-------------|--------|
| 1 | Performance audit | Done — baseline + gaps closed this pass |
| 2 | Frontend bundle size | `optimizePackageImports`; optional `ANALYZE=true` + `@next/bundle-analyzer` |
| 3 | Code splitting / lazy load | Home `next/dynamic`; Admin/Delivery shells; maps/push deferred |
| 4 | Images WebP/AVIF | `next.config.ts` formats + long TTL |
| 5 | Brotli/Gzip | Gzip on Next + Express; Brotli via CDN/nginx (documented) |
| 6 | Browser caching | `/_next/static` 1y; images/fonts; public page `s-maxage` |
| 7 | API response times | Cache + `X-Response-Time` + slow_request logs |
| 8 | Postgres queries/indexes | Join aggregates; trgm GIN; pool timeouts |
| 9 | Redis caching | Catalog + search/suggest; memory fallback |
| 10 | Fewer DB queries | Cache hits; cuisine slug/items cached |
| 11 | React re-renders | SWR dedupe; pause poll when hidden |
| 12 | Core Web Vitals | LCP/INP/CLS supported by images/fonts/lazy sections |
| 13 | Lighthouse ≥95 | Targets; verify Chrome Lighthouse on staging `/` + `/popular-restaurants` |
| 14 | Unused code | Removed unused `DynamicShells.tsx` |
| 15 | Production logging/monitoring | Winston + metrics + `/admin/monitoring` |
| 16 | Error handling | Global `errorHandler` + frontend ErrorBoundary |
| 17–18 | Scalability / load-stress | Extended load-test; stress mode |
| 19 | Backup/recovery | `docs/V3_DISASTER_RECOVERY.md` + `backupService` |
| 20–22 | Reports / checklist | This doc + Release Readiness + Launch Checklist |

---

## Measured / target metrics

### API (warm catalog, local prior + this pass design)

| Metric | Target | Notes |
|--------|--------|-------|
| Warm catalog p95 | &lt; 200ms | Redis/memory HIT |
| Cold catalog | Higher OK | First miss populates cache |
| Stress (100×5k) | Error rate &lt; 5%, p95 &lt; 2s | Single instance queues under load — scale replicas + Redis |

Run:

```bash
cd foodiq-frontend/foodiq-backend
npm run perf:load
# MODE=stress CONCURRENCY=100 REQUESTS=5000 npm run perf:stress
```

### Frontend / Lighthouse (staging production build)

| Category | Target |
|----------|--------|
| Performance | ≥ 95 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |
| LCP | &lt; 2.5s |
| INP | &lt; 200ms |
| CLS | &lt; 0.1 |

---

## Architecture notes

- **Redis required** for multi-replica API (`REDIS_ENABLED=true`, `REDIS_URL`). Memory cache is per-process only.
- **Public Cache-Control:** `public, max-age=30, s-maxage=60, stale-while-revalidate=120` on catalog/search JSON (`setCatalogHttpCache`).
- **Brotli:** terminate TLS at Cloudflare/nginx with `brotli on;` — Express stays gzip-compatible.

## Related

- Operator guide: `foodiq-frontend/foodiq-backend/docs/PERFORMANCE.md`
- Prior report: `foodiq-frontend/foodiq-backend/docs/PERFORMANCE_REPORT.md`
- CDN/Redis: `docs/V3_CDN_REDIS.md`
- DR: `docs/V3_DISASTER_RECOVERY.md`
