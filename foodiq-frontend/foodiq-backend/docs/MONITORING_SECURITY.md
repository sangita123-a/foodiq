# Foodiq Monitoring, Logging & Security

Enterprise ops layer for Foodiq — additive, does not replace completed business modules.

## Architecture

```
Request → requestContext (X-Request-Id, latency)
       → Helmet security headers
       → CORS + cookies
       → JSON (Razorpay rawBody preserved)
       → sanitize + optional CSRF
       → rate limit (/api, auth, OTP, uploads)
       → routes
       → errorHandler → error_events + rotated logs
```

| Area | Location |
|------|----------|
| Logger | `utils/logger.js` (winston daily rotate → `logs/`) |
| Metrics | `services/metricsService.js` |
| Audit | `services/auditService.js` → `audit_logs` |
| Errors | `services/errorTracker.js` → `error_events` |
| Alerts | `services/alertService.js` → `security_alerts` + admin notify |
| Backups | `services/backupService.js` → `backup_runs` |
| APIs | `/api/monitoring/*` |
| Admin UI | `/admin/monitoring` |

## Environment

```env
LOG_LEVEL=info
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
METRICS_INTERVAL_MS=60000
TRUST_PROXY=true
CORS_STRICT=false
CSRF_ENABLED=false
AUTH_SECURE_COOKIES=false
JWT_ACCESS_TTL=30d
JWT_REFRESH_TTL=30d
JWT_REFRESH_SECRET=
RATE_LIMIT_API_MAX=300
RATE_LIMIT_AUTH_MAX=30
RATE_LIMIT_OTP_MAX=10
RATE_LIMIT_UPLOAD_MAX=40
ALERT_FAILED_LOGIN_THRESHOLD=20
ALERT_PAYMENT_FAIL_THRESHOLD=10
BACKUP_STALE_HOURS=36
```

## Security controls

| Control | Implementation |
|---------|----------------|
| Helmet | XSS / referrer / CORP headers (CSP left to frontend) |
| CORS | Credentials + allowlist; optional `CORS_STRICT` |
| Rate limit | Global API + stricter auth/OTP/upload; **webhook skipped** |
| JWT | Existing Bearer validation; optional shorter TTL via env |
| Refresh rotation | `POST /api/auth/refresh` — hash stored, old token revoked |
| Secure cookies | Optional `AUTH_SECURE_COOKIES=true` (httpOnly, SameSite=lax) |
| CSRF | Optional; Bearer JWT exempt (SPA default) |
| XSS | Body sanitize / prototype key strip; Helmet |
| SQLi | Parameterized queries only (policy) |
| Uploads | Existing MIME/size/purpose validation |

## Monitoring APIs

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/health` or `/api/monitoring/health` | Public (sanitized) |
| GET | `/api/monitoring/dashboard` | Admin |
| GET | `/api/monitoring/metrics` | Admin |
| GET | `/api/monitoring/audits` (+ `/export`) | Admin |
| GET | `/api/monitoring/errors` | Admin |
| POST | `/api/monitoring/client-error` | Public/optional auth |
| GET/PUT | `/api/monitoring/alerts` | Admin |
| GET | `/api/monitoring/logs` / `:name` / download | Admin |
| GET/POST | `/api/monitoring/backups` | Admin |

Tracked services: Database, Socket.IO, Razorpay, Email, SMS, Cloud Storage + CPU/memory/uptime/error rate/active orders.

## Logging strategy

- `logs/app-YYYY-MM-DD.log` — app + HTTP
- `logs/error-YYYY-MM-DD.log` — errors
- `logs/audit-YYYY-MM-DD.log` — security/business actions
- Rotation by size/day; searchable in Admin → Monitoring → Logs
- Audit CSV export from Monitoring UI

Audit categories include: login, signup, logout, failed_login, password_reset, upload, payments (via metrics), admin ops.

## Alerts

Auto-created (deduped 10 min) for:

- Database down
- High CPU / memory
- Elevated failed logins
- Payment failure bursts
- Backup failures

Admins also get in-app notifications (`/admin/monitoring`).

## Backup monitoring

Record runs via:

```http
POST /api/monitoring/backups
Authorization: Bearer <admin>
{ "type": "database", "status": "success", "location": "s3://…", "size_bytes": 123 }
```

Cron should call this after `pg_dump` / media sync. Stale backups (default >36h) flag on the dashboard.

## Incident response (short)

1. Check `/admin/monitoring` Overview — which service is red?
2. Open Errors + Logs tabs for stack / request_id.
3. Ack alerts after mitigation.
4. For auth abuse: inspect Audit `failed_login`, temporarily lower `RATE_LIMIT_AUTH_MAX`.
5. For payments: verify Razorpay dashboard + webhook logs; do not rate-limit `/api/payments/webhook`.
6. For DB: restore from latest `backup_runs` location; re-run health.

## Frontend

- Global `ErrorBoundary` reports to `/api/monitoring/client-error`
- Admin Monitoring dashboard with live refresh (30s)

## Deployment notes

1. Ensure `JWT_SECRET` is set in production.
2. Set `CORS_STRICT=true` with correct `FRONTEND_URL`.
3. Mount persistent volume for `logs/` (and `uploads/` if mock storage).
4. Point load balancer health checks at `GET /api/health`.
5. Restart API so `ensureSchema` creates monitoring tables.
