# Changelog

All notable releases are tracked here. Automated entries may be appended by the **Release** GitHub Action.

## 4.1.0 — 2026-07-18 (CPI Production Release)

### Added
- Continuous Product Improvement package: bug tracking, new features, analytics/BI, security hardening, performance & release engineering
- Release notes: `docs/RELEASE_NOTES_v4.1.0.md`
- Final production release report: `docs/FINAL_PRODUCTION_RELEASE_REPORT.md`

### Changed
- Version bumped to **4.1.0** (frontend + backend + `VERSION`)
- Frozen release branch: `release/4.1.0` · tag `v4.1.0`

### Compatibility
- Same as 4.0.0: feature flags default off; `/api/v4` additive; strong `JWT_SECRET` required

## 4.0.0 — 2026-07-18 (Enterprise & Global Expansion Foundation)

### Added
- i18n catalogs (`en`/`hi`/`ar`), locale middleware, timezone helpers
- Tax engine + `tax_rules` (flagged off); multi-currency payment helper (flagged off)
- SSO adapter stubs (Google/Microsoft/Apple); enterprise roles & org memberships
- Corporate accounts/orders + recurring schedule runner
- AI voice intent parser, support chatbot sessions, recommendations, personalized offers
- Fleet vehicles + nearest-neighbor route optimizer; IoT device/telemetry ingest
- Predictive inventory reorder suggestions; API marketplace listings/subscriptions
- GDPR privacy export/delete-request queue; enterprise BI + audit export
- Admin pages `/admin/ai`, `/admin/fleet`; docs for compliance & multi-region
- OpenAPI `docs/api/openapi-v4.yaml`; Enterprise Readiness Report
- Production bug tracking enhancements: crash fields on `bug_reports`, fingerprint duplicate merge, weekly bug report API, admin filter chips (Open / In Progress / Fixed / Critical / Low Priority), auto-ingest from `error_events`
- Module report: `docs/BUG_TRACKING_MODULE_REPORT.md`
- CPI Task 3 new features foundation: wishlist, recently viewed, referrals, gift cards, collections, seasonal campaigns, product feature flags (% rollout), smart search suggest, advanced restaurant filters, personalized home rails, coupon recommendations, order reorder API, improved ETA; report `docs/NEW_FEATURES_MODULE_REPORT.md`
- CPI Task 4 Analytics & BI: admin BI dashboard, role-scoped analytics APIs, funnel/retention/CLV/AOV/abandonment, city/coupon/campaign reports, CSV/Excel/PDF export, email reports, interactive charts, AI insights, forecast + anomaly detection, query indexes; report `docs/ANALYTICS_BI_MODULE_REPORT.md`
- CPI Task 5 Security Maintenance & Compliance: JWT/HS256 hardening (no weak secrets), restaurant/menu ownership RBAC, CSRF/CORS/Helmet/HTTPS enforce, PCI no-PAN payment methods, GDPR erase anonymization, field encryption helper, upload magic-byte sniff, session revoke on password reset/change, dependency overrides (`uuid`/`postcss`); reports `docs/SECURITY_COMPLIANCE_REPORT.md`, `docs/VULNERABILITY_REPORT.md`, `docs/SECURITY_READINESS_SCORE.md` (score **88/100**)
- CPI Task 6 Performance & Release Engineering: CDN-friendly catalog Cache-Control, search/suggest Redis cache, restaurant-by-id join optimization, visibility-aware SWR polling, request timing / slow logs, extended load+stress tests, public page `s-maxage`; reports `docs/PRODUCTION_PERFORMANCE_REPORT.md`, `docs/RELEASE_READINESS_REPORT.md`, `docs/FINAL_LAUNCH_CHECKLIST.md`

### Compatibility
- Feature flags default off — checkout and auth match Foodiq 3.0
- `/api/v1` and legacy `/api/*` unchanged; `/api/v4` additive
- **Breaking ops note:** API refuses to start without a strong `JWT_SECRET` (≥32 characters)

## 3.0.0 — 2026-07-18 (Business Scaling Foundation)

### Added
- Multi-tenant schema: organizations, markets, franchises, chains, white-label, API keys, inventory, warehouses, integration connectors, pricing rules, surge events, AI forecast runs
- Versioned public API `/api/v1` (health, branding, markets, restaurants, partner summary, integration sync stubs)
- Admin `/api/admin/v3/*` (orgs, markets, franchises, chains, BI, forecasts, pricing preview, connectors)
- Services: pricing engine (off by default), currency/FX helpers, BI KPIs, heuristic AI forecast, search adapter (`pg` | `elasticsearch`)
- Admin BI page `/admin/bi` (reuses AdminShell)
- Kubernetes manifests (`deploy/k8s/`), OpenAPI stub, CDN/Redis and DR/HA docs
- Architecture report: `docs/VERSION_3_ARCHITECTURE_REPORT.md`

### Compatibility
- Default org `foodiq-default` + market `IN-KA-BLR` seeded; existing restaurants backfilled
- `PRICING_ENGINE_ENABLED` defaults false — checkout totals match V2
- Legacy `/api/*` and `/api/partner` JWT unchanged; `/api/v1` is additive

## 2.0.0 — 2026-07-18 (Production Maintenance)

### Added
- Order feedback (restaurant + delivery + overall) after delivery
- Product feedback API and Help & Support feedback mode
- Bug reporting API and admin bug management dashboard
- Admin feedback inbox (product / support / contact / reviews)
- Admin maintenance dashboard (health, review analytics, weekly/monthly reports)
- V2 feature adoption analytics (`/api/admin/analytics/v2-adoption`)
- Partner reviews wired to live API; delivery partner ratings page
- Idempotent schema for `delivery_reviews`, `order_feedback`, `user_feedback`, `bug_reports`, `maintenance_reports`
- CI: `db:verify` V2 tables, `test:v2` regression, extended API smoke
- Docs: `RELEASE_NOTES_v2.md`, `USER_GUIDE_v2.md`, `ADMIN_GUIDE_v2.md`, `MAINTENANCE.md`

### Changed
- Package versions bumped to **2.0.0** (frontend + backend)
- Contact form persists `reason` and `phone`

### Compatibility
- All Foodiq 1.x customer APIs remain; V2 endpoints are additive
- Migrations are non-destructive (CREATE / ADD COLUMN IF NOT EXISTS)

## Unreleased

### Added
- Enterprise CI/CD: PR validation, develop/staging/production pipelines
- Automated unit, API smoke, module validation, and UI smoke tests
- DB migrate/verify scripts for CI (`db:migrate`, `db:verify`)
- Deploy helper (Vercel / SSH), rollback workflow, release tagging
- Optional Docker images and `docker-compose.yml`
- Slack / Teams / email webhook notifications

## 0.1.0 — baseline

- Customer App, Checkout, Restaurant / Admin / Delivery dashboards
- Razorpay, real-time tracking, push / email / SMS
- Cloud storage, monitoring & security, performance optimization
