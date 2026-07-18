# Foodiq Security Compliance Report

**Module:** Continuous Product Improvement — Task 5  
**Date:** 2026-07-18  
**Scope:** Backend API (`foodiq-frontend/foodiq-backend`), Next.js frontend, payments, privacy, ops config  
**Status:** Production-ready controls implemented (not a formal certification)

---

## Executive summary

Foodiq completed a full security maintenance pass covering OWASP Top 10 controls, auth hardening, PCI-aligned payment handling, GDPR erasure/export, dependency remediation, and operational security defaults. Critical and high findings from the audit were fixed in code; residual items are documented with owners and mitigations.

---

## Requirement checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Complete security audit | Done | This report + Vulnerability Report |
| 2 | OWASP Top 10 scan | Done | See § OWASP mapping |
| 3 | SQL injection protection | Done | Parameterized `pg` queries; statement timeout sanitized |
| 4 | XSS protection | Done | Body sanitizer; React escaping; JsonLd `</` escape |
| 5 | CSRF protection | Done | `middleware/csrf.js`; `CSRF_ENABLED=true` default in prod |
| 6 | JWT strengthen | Done | Min 32-char secret, no fallback, HS256 pin, deleted-user reject |
| 7 | RBAC validation | Done | `authorize` + restaurant/menu ownership; v4 fleet/inventory roles |
| 8 | API rate limiting | Done | `middleware/rateLimiters.js` (API/auth/OTP/upload/contact) |
| 9 | Secure CORS | Done | Allowlist + `CORS_STRICT` default true in production |
| 10 | Helmet headers | Done | `middleware/securityHeaders.js` (HSTS, frameguard, noSniff) |
| 11 | Encrypt sensitive data | Done | AES-256-GCM via `DATA_ENCRYPTION_KEY` for addresses + UPI/name |
| 12 | bcrypt password hashing | Done | `BCRYPT_ROUNDS` default 12 (auth, profile, delivery) |
| 13 | Env variable security | Done | Strong examples; startup exit on weak `JWT_SECRET` |
| 14 | Remove hardcoded secrets | Done | No JWT/Razorpay fallback secrets in production paths |
| 15 | HTTPS-only | Done | `FORCE_HTTPS` / prod default redirect via `httpsEnforce` |
| 16 | File upload security | Done | MIME allowlist + magic-byte sniff + size/purpose rules |
| 17 | Payment security | Done | Razorpay-hosted; reject PAN/CVV; webhook signature verify |
| 18 | API input validation | Done | Controllers + `sanitizeBody` + validation helpers |
| 19 | Database permissions | Documented | See § Database permissions |
| 20 | Audit logging | Done | `auditService` on auth, privacy, payments, ownership actions |
| 21 | Dependency vulnerability scan | Done | `npm audit` clean (frontend + backend) after overrides |
| 22 | Update outdated packages safely | Done | `uuid` / `postcss` overrides; no breaking Next/Firebase force |
| 23 | PCI-DSS readiness | Verified (SAQ A path) | See § PCI-DSS |
| 24 | GDPR / privacy | Verified (foundation) | Export + erase anonymization |
| 25–27 | Reports + readiness score | Done | This doc + Vulnerability Report + Score |

---

## OWASP Top 10 mapping

| OWASP | Control in Foodiq |
|-------|-------------------|
| A01 Broken Access Control | JWT `protect`/`authorize`; restaurant/menu ownership; org role middleware |
| A02 Cryptographic Failures | bcrypt; TLS enforce; optional AES-GCM field crypto; no PAN storage |
| A03 Injection | Parameterized SQL; input sanitization; upload content sniff |
| A04 Insecure Design | PCI no-PAN API; CSRF for cookie mutations; rate limits |
| A05 Security Misconfiguration | Helmet; CORS strict; CSRF/HTTPS env defaults; secret strength gates |
| A06 Vulnerable Components | npm audit; dependency overrides |
| A07 Auth Failures | Strong JWT; refresh revoke on password change/reset/erase; OTP limits |
| A08 Software/Data Integrity | Razorpay signature verify; webhook secret |
| A09 Logging/Monitoring | Winston logs; audit_logs; metrics; sensitive key redaction |
| A10 SSRF | No open URL-fetch from user input in core payment/auth paths |

---

## PCI-DSS readiness

| Control | Assessment |
|---------|------------|
| Card data scope | **Out of scope for Foodiq app servers** when using Razorpay Checkout only |
| PAN/CVV on Foodiq APIs | **Rejected** (`PCI_NO_PAN`) on create/update payment methods |
| Storage | Only `card_last4` / brand / expiry metadata allowed |
| Transport | HTTPS required in production (`FORCE_HTTPS`) |
| Logging | Sanitize middleware redacts card/cvv/secret-like keys |
| Recommended SAQ | **SAQ A** (confirm with QSA / Razorpay merchant settings) |

> Not a PCI attestation. Live keys must never be committed; `ALLOW_PAYMENT_MOCK` / `RAZORPAY_MOCK` must be false in production.

---

## GDPR / privacy

| Right | Implementation |
|-------|----------------|
| Access / portability | `POST /api/v4/privacy/export` |
| Erasure | `eraseUserData` anonymizes user, clears PII/payment/addresses/wishlist/cart, revokes refresh tokens, completes privacy request |
| Rectification | Profile / address APIs |
| Accountability | `audit_logs` entries for privacy erase / password events |

Retention guidance remains in `docs/V4_COMPLIANCE.md`.

---

## Database permissions (ops)

Application should use a **least-privilege** DB role (not superuser):

| Privilege | Recommendation |
|-----------|----------------|
| Tables | `SELECT/INSERT/UPDATE/DELETE` on app schema only |
| DDL | Migrations run via CI/admin role, not runtime API role |
| Extensions | Not granted to app role |
| Network | Private network / SSL (`DB_SSL` / `sslmode=require`) |
| Timeouts | `DB_STATEMENT_TIMEOUT_MS` (default 15s in production) |

Documented for operators; not enforceable from application code alone.

---

## Environment & secrets

Required for production:

- `JWT_SECRET` ≥ 32 chars (non-default)
- `FRONTEND_URL` + `CORS_STRICT=true`
- `CSRF_ENABLED=true`, `AUTH_SECURE_COOKIES=true`
- `FORCE_HTTPS=true` (or platform TLS + redirect)
- Razorpay live keys + webhook secret; mocks disabled
- Optional: `DATA_ENCRYPTION_KEY` (64 hex chars) for field encryption

See `docs/SECRETS.md` and backend `.env.example`.

---

## Related artifacts

- [`VULNERABILITY_REPORT.md`](./VULNERABILITY_REPORT.md)
- [`SECURITY_READINESS_SCORE.md`](./SECURITY_READINESS_SCORE.md)
- [`V4_COMPLIANCE.md`](./V4_COMPLIANCE.md)
- Backend: `docs/MONITORING_SECURITY.md`
