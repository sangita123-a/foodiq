# Foodiq Final Launch Checklist

**Version:** 4.0.0 · **Date:** 2026-07-18  
Use this list before promoting production traffic.

---

## A. Build & quality

- [ ] Frontend: `npm run lint && npm run typecheck && npm run test:unit && npm run build`
- [ ] Backend: `npm run test:unit && npm run db:migrate && npm run db:verify`
- [ ] Optional: `npm run test:api` / `test:prod` against staging
- [ ] Tag release / run Release workflow

## B. Environment & secrets

- [ ] `JWT_SECRET` / `JWT_REFRESH_SECRET` ≥ 32 chars (not defaults)
- [ ] `FRONTEND_URL`, `CORS_STRICT=true`, `CORS_ALLOW_VERCEL=false`
- [ ] `CSRF_ENABLED=true`, `AUTH_SECURE_COOKIES=true`, `FORCE_HTTPS=true`
- [ ] `ALLOW_BOOTSTRAP_USERS=false`, `ALLOW_PAYMENT_MOCK=false`, `RAZORPAY_MOCK=false`
- [ ] Razorpay live keys + webhook secret configured
- [ ] Optional: `DATA_ENCRYPTION_KEY` (64 hex) before new PII writes
- [ ] `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` point at production

## C. Performance & scale

- [ ] `REDIS_ENABLED=true` + `REDIS_URL` on all API replicas
- [ ] `SOCKET_REDIS_ADAPTER=true` when Redis is up
- [ ] `DB_POOL_MAX` sized for instance count
- [ ] CDN / edge Brotli in front of Next + API (if available)
- [ ] Optional: `CDN_ASSET_PREFIX` for static assets
- [ ] Run `npm run perf:load` against staging; review p95 / errors
- [ ] Chrome Lighthouse (Mobile) on `/` and `/popular-restaurants` — all categories ≥ 95

## D. Monitoring & logging

- [ ] Confirm Winston logs shipping on host (or platform log drain)
- [ ] `/api/monitoring/health` and `/api/v1/health` green
- [ ] Admin `/admin/monitoring` reachable for ops
- [ ] Alerts configured (email/Slack/Teams as used)

## E. Payments & compliance

- [ ] Test one live (or Razorpay test→live cutover) checkout end-to-end
- [ ] Webhook delivery verified (`payment.captured` / failures)
- [ ] Confirm no PAN accepted by payment-method APIs
- [ ] Privacy export/erase smoke on a test account

## F. Backup & recovery

- [ ] Managed Postgres automated backups enabled
- [ ] Record a successful backup via monitoring backup API (or provider UI)
- [ ] Read `docs/V3_DISASTER_RECOVERY.md`; schedule restore drill
- [ ] Know rollback path (`docs/ROLLBACK.md` / rollback workflow)

## G. Smoke after deploy

- [ ] Home loads; restaurants list; search suggest
- [ ] Register/login; place cart checkout (test mode if needed)
- [ ] Partner menu edit invalidates cache (second list request fresh)
- [ ] Delivery / admin shells load for role accounts
- [ ] Socket order updates (or graceful poll fallback)

## H. Sign-off

| Role | Name | Date | OK |
|------|------|------|----|
| Engineering | | | ☐ |
| Ops / SRE | | | ☐ |
| Product | | | ☐ |

**Launch decision:** ☐ Go · ☐ Go with watch · ☐ No-go

---

Related: [RELEASE_READINESS_REPORT.md](./RELEASE_READINESS_REPORT.md) · [PRODUCTION_PERFORMANCE_REPORT.md](./PRODUCTION_PERFORMANCE_REPORT.md)
