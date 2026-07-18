# Foodiq Security Readiness Score

**Date:** 2026-07-18  
**Version:** 4.0.0  
**Related:** [SECURITY_COMPLIANCE_REPORT.md](./SECURITY_COMPLIANCE_REPORT.md), [VULNERABILITY_REPORT.md](./VULNERABILITY_REPORT.md)

---

## Overall score: **88 / 100** — **Production Ready (Hardened)**

| Band | Range | Meaning |
|------|-------|---------|
| Critical gaps | 0–49 | Do not ship |
| Needs work | 50–69 | Fix high findings first |
| Ready with follow-ups | 70–84 | Ship with documented residuals |
| **Hardened** | **85–94** | **Current band** |
| Certified / attested | 95–100 | Requires external audit + pen test |

---

## Category scores

| Category | Weight | Score | Notes |
|----------|--------|-------|-------|
| Access control / RBAC / IDOR | 15% | 14/15 | Ownership + role gates; org roles present |
| Auth / JWT / sessions | 15% | 14/15 | Strong secrets, HS256, revoke on password/erase |
| Injection / XSS / CSRF | 12% | 11/12 | Parameterized SQL, sanitize, CSRF on |
| Crypto / passwords / PII | 10% | 9/10 | bcrypt 12; optional AES-GCM fields |
| Network / headers / CORS / HTTPS | 10% | 9/10 | Helmet, strict CORS, HTTPS enforce |
| Payments / PCI alignment | 12% | 11/12 | No PAN; Razorpay; mock guards |
| Privacy / GDPR | 8% | 7/8 | Export + erase implemented |
| Uploads | 5% | 5/5 | MIME + magic bytes + size |
| Logging / audit | 5% | 4/5 | audit_logs; expand coverage continuously |
| Dependencies | 5% | 5/5 | npm audit clean with safe overrides |
| Secrets / env hygiene | 3% | 3/3 | Examples + boot-time secret gate |

**Weighted total ≈ 88.**

---

## What would raise the score toward 95+

1. External penetration test + remediations  
2. Formal QSA PCI SAQ A attestation  
3. Enforce `DATA_ENCRYPTION_KEY` in production (fail-closed)  
4. Frontend Content-Security-Policy report-only → enforce  
5. Dedicated least-privilege DB role verified in each environment  

---

## Go / No-go

| Decision | Recommendation |
|----------|----------------|
| **Go** for production deploy | Yes, with env checklist below |
| Blockers remaining in code | None identified in this pass |

### Pre-deploy checklist

- [ ] `JWT_SECRET` / refresh secrets rotated (≥32 chars)  
- [ ] `CORS_STRICT=true`, production `FRONTEND_URL`  
- [ ] `CSRF_ENABLED=true`, `AUTH_SECURE_COOKIES=true`  
- [ ] `FORCE_HTTPS=true` (or platform equivalent)  
- [ ] Razorpay live mode; mocks off  
- [ ] `ALLOW_BOOTSTRAP_USERS=false`  
- [ ] Optional: set `DATA_ENCRYPTION_KEY` before storing new PII  
- [ ] DB role is non-superuser with SSL  
