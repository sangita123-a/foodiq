# Foodiq 2.0.0 — Release Notes

**Release date:** 2026-07-18  
**Codename:** Production Maintenance  
**Compatibility:** Backward compatible with Foodiq 1.x APIs and data

---

## Highlights

Foodiq 2.0 adds post-launch feedback, ratings, bug tracking, and maintenance tooling—without changing the customer UI design language.

### For customers
- **Rate your order** after delivery (restaurant + delivery partner + overall)
- **Help & Support** modes: support ticket, report a bug, product feedback
- Existing checkout, tracking, payments, and catalogs unchanged

### For restaurant partners
- **Reviews** page uses live customer ratings (reply / hide)
- No redesign of partner shell

### For delivery partners
- New **Ratings** page (`/delivery/reviews`) with average score and customer comments

### For admins
- **Feedback** inbox (product, support, contact, review moderation)
- **Bugs** management (severity/status, create from error events)
- **Maintenance** dashboard (health, review analytics, V2 adoption, weekly/monthly reports)
- Existing **Monitoring** remains the source of truth for production errors

---

## New APIs (additive)

| Method | Path | Auth |
|--------|------|------|
| POST/GET | `/api/orders/:id/feedback` | Customer (owner) |
| POST | `/api/feedback` | Optional |
| POST | `/api/bugs` | Optional |
| GET/PUT | `/api/admin/feedback*` | Admin |
| GET/PUT | `/api/admin/reviews*` | Admin |
| GET/PUT | `/api/admin/bugs*` | Admin |
| GET | `/api/admin/analytics/reviews` | Admin |
| GET | `/api/admin/analytics/v2-adoption` | Admin |
| GET/POST | `/api/admin/maintenance/*` | Admin |
| GET/PUT | `/api/partner/reviews*` | Restaurant owner |
| GET | `/api/delivery/me/reviews` | Delivery partner |

V1 routes (`/api/restaurants`, `/api/orders`, `/api/checkout`, `/api/payments`, etc.) are unchanged.

---

## Database (zero data loss)

Idempotent `ensureSchema` / `db:migrate` adds tables and columns only:

- `delivery_reviews`, `order_feedback`, `user_feedback`, `bug_reports`, `maintenance_reports`
- `reviews.status`, `reviews.admin_reply`, `reviews.replied_at`
- `contact_messages.phone`, `contact_messages.reason`, `contact_messages.status`

No destructive migrations. No TRUNCATE. Existing rows preserved.

---

## Upgrade steps (minimal downtime)

1. Deploy backend (Render `preDeployCommand: npm run db:migrate`)
2. Deploy frontend (Vercel)
3. Smoke: `npm run test:api` + `npm run test:v2` against production API
4. Monitor `/admin/monitoring` and `/admin/maintenance` for 24–48h

Rollback: see [docs/ROLLBACK.md](ROLLBACK.md). Schema additions are forward-compatible if you roll back app code only.

---

## Docs

- [User guide (V2)](USER_GUIDE_v2.md)
- [Admin guide (V2)](ADMIN_GUIDE_v2.md)
- [Maintenance ops](MAINTENANCE.md)
- [CI/CD](CICD.md)
