# Foodiq Release Notes — v4.1.0

**Release date:** 2026-07-18  
**Codename:** Continuous Product Improvement (CPI) Production Release  
**Branch:** `release/4.1.0` (frozen) · **Tag:** `v4.1.0`

---

## Summary

Foodiq **4.1.0** packages the CPI workstream on top of the 4.0 enterprise foundation: production bug tracking, new customer features, analytics/BI, security & compliance hardening, and performance/release engineering — without UI redesign.

---

## What's included

### Continuous Product Improvement
- **Bug tracking:** crash fields, fingerprint dedupe, weekly reports, admin filters
- **New features:** wishlist, recently viewed, referrals, gift cards, collections, seasonal campaigns, feature flags, smart search suggest, advanced filters, personalized rails, coupon recs, reorder, improved ETA
- **Analytics & BI:** admin BI dashboard, funnel/retention/CLV/AOV, exports, forecasts/anomalies
- **Security (Task 5):** JWT hardening, ownership RBAC, CSRF/CORS/Helmet/HTTPS, PCI no-PAN, GDPR erase, field encryption, dependency audit clean (88/100 readiness)
- **Performance (Task 6):** CDN-friendly catalog cache headers, search cache, query joins, visibility-aware polling, load/stress tooling

### Platform (from 4.0 foundation)
- i18n, tax/currency stubs (flagged), SSO stubs, corporate ordering, fleet/IoT, privacy APIs, OpenAPI v4

---

## Compatibility

- Feature flags that change checkout/pricing remain **off by default**
- Legacy `/api/*` and `/api/v1` preserved; `/api/v4` additive
- **Ops:** API requires `JWT_SECRET` ≥ 32 characters or it will not start

---

## Deploy notes

1. Merge/push `release/4.1.0` → `main` (or deploy tag `v4.1.0` via Production Deploy workflow)
2. Render runs `npm run db:migrate` (preDeploy) — idempotent `ensureSchema`
3. Confirm Redis if running multiple API replicas
4. Disable Vercel Deployment Protection on Production for public SEO
5. Set live Razorpay keys; keep mocks off
6. Monitor health + `/admin/monitoring` for **48 hours** post-cutover

---

## Verification checklist (post-deploy)

| Check | Endpoint / action |
|-------|-------------------|
| API health | `GET /api/health`, `GET /api/v1/health` |
| Monitoring | `GET /api/monitoring/health`, Admin `/admin/monitoring` |
| Backups | Monitoring backups API / managed Postgres backup status |
| Analytics | Admin `/admin/bi` + `/api/analytics/*` (auth) |
| Payments | Razorpay create-order smoke (test or live) |
| SEO | `/robots.txt`, `/sitemap.xml` public 200 (no SSO) |
| Indexing | Google Search Console → Inspect URL after Protection off |

---

## Links

- [FINAL_LAUNCH_CHECKLIST.md](./FINAL_LAUNCH_CHECKLIST.md)
- [RELEASE_READINESS_REPORT.md](./RELEASE_READINESS_REPORT.md)
- [SECURITY_READINESS_SCORE.md](./SECURITY_READINESS_SCORE.md)
- [PRODUCTION_PERFORMANCE_REPORT.md](./PRODUCTION_PERFORMANCE_REPORT.md)
- [V4_COMPLIANCE.md](./V4_COMPLIANCE.md)
