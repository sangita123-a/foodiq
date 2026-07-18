# Foodiq Production Maintenance

Post-launch maintenance for feedback, ratings, bugs, health, and reports.

## Features

| Area | Customer / partner | Admin |
|------|--------------------|-------|
| Order feedback | Delivered order → Rate Order (`#feedback`) | Reviews tab in Feedback |
| Restaurant reviews | Submitted with order feedback | Moderate hide/visible |
| Delivery ratings | Same form; partners see `/delivery/reviews` | Analytics on Maintenance |
| Product feedback | Help & Support → Product feedback | `/admin/feedback` |
| Support tickets | Help & Support → Support ticket | `/admin/feedback` |
| Bug reports | Help & Support → Report a bug | `/admin/bugs` |
| Error logging | Existing client/backend → `error_events` | `/admin/monitoring` + create bug from error |
| Weekly / monthly reports | — | `/admin/maintenance` |

## API reference

### Customer
- `POST /api/orders/:id/feedback` — restaurant + delivery + overall (auth, delivered, once)
- `GET /api/orders/:id/feedback`
- `POST /api/feedback` — general product feedback (optional auth, rate limited)
- `POST /api/bugs` — bug report (optional auth, rate limited)
- `POST /api/support`, `POST /api/contact` — existing (contact now stores `phone`, `reason`)

### Partner / delivery
- `GET /api/partner/reviews`, `PUT /api/partner/reviews/:id` (reply / hide)
- `GET /api/delivery/me/reviews`

### Admin (`protect` + `admin`)
- `GET /api/admin/feedback?type=all|product|support|contact`
- `PUT /api/admin/feedback/product|support|contact/:id`
- `GET|PUT /api/admin/reviews[/:id]`
- `GET|PUT /api/admin/bugs[/:id]`, `POST /api/admin/bugs/from-error`
- `GET /api/admin/analytics/reviews?days=30`
- `GET /api/admin/analytics/v2-adoption?days=30`
- `GET /api/admin/maintenance/health`
- `GET /api/admin/maintenance/report?period=weekly|monthly`
- `GET /api/admin/maintenance/reports`
- `POST /api/admin/maintenance/send-weekly`

## Cron / ops hooks

Hit with an admin JWT (or wire your scheduler to the same functions):

```bash
# Weekly review email to admins
curl -X POST "$API/api/admin/maintenance/send-weekly" -H "Authorization: Bearer $ADMIN_TOKEN"

# Persist monthly maintenance snapshot
curl "$API/api/admin/maintenance/report?period=monthly" -H "Authorization: Bearer $ADMIN_TOKEN"
```

Service entry points: `services/maintenanceReportService.js`, also exported from `reportEmailService.js` as `sendWeeklyReviewReport` / `generateMonthlyMaintenanceReport`.

## Schema

Boot-time via `utils/ensureSchema.js` and documented in `database/schema.sql`:

- `reviews` (+ `status`, `admin_reply`, unique user+order)
- `delivery_reviews`, `order_feedback`, `user_feedback`, `bug_reports`, `maintenance_reports`

## Security notes

- Order feedback: owner-only, delivered-only, idempotent
- Feedback/bug POSTs: `feedbackLimiter` + optional auth
- Admin routes: `authorize('admin')`
- Never trust client `user_id` on create

## Related UI

- `/admin/feedback`, `/admin/bugs`, `/admin/maintenance`
- `/admin/monitoring` — production error logs (existing)
- Partner `/partner/reviews`, Delivery `/delivery/reviews`
