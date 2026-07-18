# Changelog

All notable releases are tracked here. Automated entries may be appended by the **Release** GitHub Action.

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
