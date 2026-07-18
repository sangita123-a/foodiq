# Foodiq 2.0 — Admin Guide

Admin operations for Version 2.0 maintenance features. UI chrome matches the existing AdminShell (no redesign).

## New sidebar pages

| Page | Path | Purpose |
|------|------|---------|
| Feedback | `/admin/feedback` | Product feedback, support tickets, contact messages, review moderation |
| Bugs | `/admin/bugs` | Bug tracker; create bug from `error_events` UUID |
| Maintenance | `/admin/maintenance` | Health, review analytics, V2 adoption, generate/send reports |
| Monitoring | `/admin/monitoring` | Existing errors, audits, logs, backups |

## Feedback inbox

1. Open **Feedback**.
2. Switch tabs: Product / Support / Contact / Reviews.
3. Mark items resolved or hide/show reviews.

Contact messages now store **reason** and **phone** when submitted from the public contact form.

## Bug management

1. Open **Bugs**.
2. Filter by status / severity.
3. Select a bug → update status, severity, admin notes → Save.
4. Optional: paste an **error event UUID** from Monitoring → **Create from error**.

Statuses: `open` → `triaging` → `in_progress` → `resolved` / `wont_fix`.

## Maintenance & reports

1. Open **Maintenance**.
2. Check health cards (DB, errors 7d, open bugs, reviews 7d).
3. Review **V2.0 adoption** (order feedback rate, delivery reviews, bugs, product feedback).
4. **Generate weekly/monthly** report (stored in `maintenance_reports`).
5. **Email weekly report** to admin users (requires email provider configured).

API equivalents (admin JWT):

```bash
GET  /api/admin/maintenance/health
GET  /api/admin/analytics/reviews?days=30
GET  /api/admin/analytics/v2-adoption?days=30
GET  /api/admin/maintenance/report?period=monthly
POST /api/admin/maintenance/send-weekly
```

## Partner & delivery (for support)

- Restaurant owners manage replies at `/partner/reviews`.
- Delivery partners view ratings at `/delivery/reviews`.

## Post-release monitoring checklist

1. `/admin/monitoring` — error rate vs pre-release baseline
2. `/admin/maintenance` — adoption climbing; open bugs stable
3. `/admin/feedback` — triage new tickets daily for first week
4. Confirm Vercel + Render health; `/api/health` returns success

## Security notes

- All admin routes require `admin` role.
- Public feedback/bug POSTs are rate-limited.
- Order feedback is owner-only and delivered-only.

Full API list: [MAINTENANCE.md](MAINTENANCE.md) · Release: [RELEASE_NOTES_v2.md](RELEASE_NOTES_v2.md)
