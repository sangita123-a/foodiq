# Foodiq — Bug Tracking Module Report

**Module:** Production Bug Tracking & Resolution System  
**Version:** 4.0.0 (extends V2.0 maintenance foundation)  
**Date:** 2026-07-18  
**UI redesign:** None — AdminShell + existing orange token system preserved

---

## 1. Executive summary

Foodiq centralizes production crash and bug handling in PostgreSQL (`error_events` + `bug_reports`), with automatic ingest from frontend beacons and backend API failures, fingerprint-based duplicate detection, an admin resolution dashboard, and weekly bug reporting.

---

## 2. Architecture

```
Browser / Next.js
  ├─ GlobalErrorListeners / ErrorBoundary / trackJsError
  ├─ trackApiFailure (Axios)
  └─ SupportTicketForm → POST /api/bugs
           │
           ▼
Express API
  ├─ POST /api/monitoring/client-error  → errorTracker.trackError
  ├─ Express errorHandler               → errorTracker.trackError
  └─ trackError → INSERT error_events
                → bugTrackingService.ingestCrashFromError
                     → createOrMergeBug (fingerprint dedupe)
                           │
                           ▼
                    PostgreSQL bug_reports
                           │
Admin (JWT role=admin)
  ├─ GET  /api/admin/bugs (+ filters)
  ├─ PUT  /api/admin/bugs/:id
  ├─ POST /api/admin/bugs/from-error
  └─ GET|POST /api/admin/bugs/weekly-report
           │
           ▼
     /admin/bugs dashboard
```

---

## 3. Requirement matrix

| # | Requirement | Status | Deliverable |
|---|-------------|--------|-------------|
| 1 | Centralized production error logging | Done | `errorTracker` → `error_events` + Winston |
| 2 | Capture frontend JS errors | Done | `GlobalErrorListeners`, `ErrorBoundary`, `trackJsError` → client-error beacon |
| 3 | Capture backend API errors | Done | `errorHandler` + `trackApiFailure` |
| 4 | Store crash reports in PostgreSQL | Done | `bug_reports` (+ crash columns) |
| 5 | Record message, stack, endpoint, user, browser, device, timestamp | Done | Columns + UA parse on ingest |
| 6 | Admin Bug Dashboard | Done | `/admin/bugs` |
| 7 | Filters: Open / In Progress / Fixed / Critical / Low Priority | Done | Filter chips + `?filter=` |
| 8 | Developers update bug status | Done | `PUT /api/admin/bugs/:id` |
| 9 | Duplicate bug detection | Done | SHA-256 fingerprint + `occurrence_count` merge |
| 10 | Weekly bug reports | Done | `/api/admin/bugs/weekly-report` (+ optional persist) |
| 11 | API validation for bug reporting | Done | `validateBugPayload` (required fields, severity, UUIDs, length caps) |
| 12 | Authentication & authorization | Done | Public submit: `optionalProtect` + rate limit; admin: `protect` + `authorize('admin')` |
| 13 | Optimize bug queries | Done | Indexes on status/severity/fingerprint/error_event/created_at; COUNT+list parallel |
| 14 | Responsive UI | Done | Existing grid (`grid-cols-1 lg:grid-cols-5`), wrapping filter chips |
| 15 | Bug Tracking Module Report | Done | This document |

---

## 4. Data model (`bug_reports`)

| Column | Purpose |
|--------|---------|
| `title`, `description` | Error message / narrative |
| `stack_trace` | Stack trace |
| `api_endpoint` | API path or `METHOD path` |
| `reporter_id` | User ID (nullable for anonymous) |
| `browser`, `device` | Parsed from User-Agent |
| `user_agent`, `page_url` | Raw client context |
| `error_event_id` | Link to `error_events` |
| `fingerprint` | Dedupe key |
| `occurrence_count` | Merged duplicate hits |
| `duplicate_of_id` | Optional child link |
| `severity` | `low` \| `medium` \| `high` \| `critical` |
| `status` | `open` \| `triaging` \| `in_progress` \| `resolved` \| `wont_fix` |
| `created_at` / `updated_at` | Timestamps |

**Filter alias:** UI/API `fixed` maps to status `resolved`.

---

## 5. API surface

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/api/bugs` | Optional JWT + rate limit | User/manual report; dedupes |
| `POST` | `/api/monitoring/client-error` | Optional JWT | Frontend beacon → errors + crash ingest |
| `GET` | `/api/admin/bugs` | Admin | `filter`, `status`, `severity`, `q`, pagination |
| `GET` | `/api/admin/bugs/:id` | Admin | Detail |
| `PUT` | `/api/admin/bugs/:id` | Admin | Status / severity / notes |
| `POST` | `/api/admin/bugs/from-error` | Admin | Promote `error_events` row |
| `GET`/`POST` | `/api/admin/bugs/weekly-report` | Admin | `?persist=1` stores in `maintenance_reports` |

---

## 6. Duplicate detection

1. Normalize message (strip UUIDs / large numbers).
2. Fingerprint = SHA-256(`message|endpoint|source`) truncated to 64 hex chars.
3. If an open/triaging/in_progress bug shares the fingerprint → increment `occurrence_count` instead of inserting.
4. Admin list hides rows with `duplicate_of_id` by default.

---

## 7. Weekly report contents

- Created / fixed / still-open / occurrence totals (7-day window)
- Breakdown by status and severity
- Top recurring fingerprints (`occurrence_count > 1`)
- Open critical sample list
- Live dashboard counts
- Optional persistence as `maintenance_reports` payload `{ type: 'bug_weekly', ... }`

---

## 8. Security

- Admin routes: Bearer JWT + `role === 'admin'`
- Public bug POST: rate-limited (`feedbackLimiter`); never trusts client `reporter_id` (uses `req.user.id`)
- Validation: length caps, severity allow-list, UUID checks
- Production 500 responses do not leak stacks to clients (stacks stored server-side only)

---

## 9. Files touched

| Area | Paths |
|------|--------|
| Schema | `database/schema.sql`, `utils/ensureSchema.js`, `scripts/ci/verify-schema.js` |
| Model / service | `models/bugReportModel.js`, `services/bugTrackingService.js`, `services/errorTracker.js` |
| API | `controllers/bugController.js`, `controllers/monitoringController.js`, `routes/adminRoutes.js` |
| Admin UI | `app/admin/bugs/page.tsx`, `services/adminApi.ts` |
| Client capture | `services/monitoringApi.ts`, `components/support/SupportTicketForm.tsx` |
| CI | `scripts/ci/api-smoke.js`, `scripts/ci/v2-regression.js` |

---

## 10. Ops notes

1. Schema is applied on API boot via `ensureSchema` (`ADD COLUMN IF NOT EXISTS`).
2. Verify with `npm run db:verify` in `foodiq-frontend/foodiq-backend`.
3. Dashboard: `/admin/bugs` (sidebar **Bugs**).
4. Monitoring Errors tab remains available for raw `error_events`; promote via UUID or rely on auto-ingest for 5xx / frontend exceptions.
