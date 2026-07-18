# Foodiq 4.0 — Compliance (GDPR & PCI-DSS)

Foundation guidance. Not a certification or auditor attestation.

## GDPR

### Data subject rights (foundation)

| Right | Endpoint / process |
|-------|-------------------|
| Access / portability | `POST /api/v4/privacy/export` (JWT) — profile, orders, addresses metadata; stores `privacy_requests` |
| Erasure | `POST /api/v4/privacy/delete-request` processes via `eraseUserData` (anonymize user, clear payment methods / addresses / wishlist / favorites / cart, revoke refresh tokens, mark request completed). Profile delete uses the same path. |
| Rectification | Existing profile/settings APIs |
| Objection / marketing | Privacy toggles in settings UI |

### Retention (recommended)

- Order records: 7 years (tax/audit)
- Auth logs / audit_logs: 2 years
- IoT telemetry: 90 days rolling
- Privacy request payloads: 1 year after completion

### Encryption at rest (application-level)

- Optional AES-256-GCM field encryption when `DATA_ENCRYPTION_KEY` is set (addresses, UPI / cardholder name)
- Passwords: bcrypt (`BCRYPT_ROUNDS`, default 12)

### DPA / subprocessors (document for customers)

- Hosting: Render / Vercel / cloud Postgres
- Payments: Razorpay (card data not stored on Foodiq servers)
- Optional: S3/Cloudinary media, Redis, email/SMS providers

## PCI-DSS

Foodiq uses **Razorpay-hosted checkout**. Card PAN/CVV must never hit Foodiq APIs.

| Control | Status |
|---------|--------|
| No card storage | Enforced — API rejects `card_number` / `cvv` / `pan`; only `card_last4` metadata |
| TLS in production | `FORCE_HTTPS` + platform TLS |
| SAQ type | Likely SAQ A if all card data on Razorpay — confirm with QSA |
| Logging | Sanitize middleware redacts card/cvv/secret-like fields |

## Enterprise audit

- `audit_logs` with optional `organization_id`, `actor_type`
- Admin export: `GET /api/admin/v4/audit`
- Security reports: `docs/SECURITY_COMPLIANCE_REPORT.md`, `docs/VULNERABILITY_REPORT.md`, `docs/SECURITY_READINESS_SCORE.md`

## Related

- [`V4_MULTI_REGION.md`](V4_MULTI_REGION.md)
- [`VERSION_4_ENTERPRISE_READINESS_REPORT.md`](VERSION_4_ENTERPRISE_READINESS_REPORT.md)
