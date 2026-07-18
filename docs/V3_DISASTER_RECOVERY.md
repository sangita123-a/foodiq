# Foodiq 3.0 — Disaster Recovery & HA

Foundation runbook. Live multi-region active-active is **documented only** (phase 3.3).

## Objectives

| Metric | Target (foundation) | Target (3.3 global) |
|--------|---------------------|---------------------|
| RPO | ≤ 24h (daily backups) | ≤ 5 min (continuous WAL / PITR) |
| RTO | ≤ 4h (restore + DNS) | ≤ 30 min (failover) |

## Primary data stores

1. **PostgreSQL** — source of truth (orders, catalog, tenancy)
2. **Object storage** — media (S3 / Cloudinary); versioning recommended
3. **Redis** — ephemeral cache / Socket.IO; rebuild on miss (no DR required)

## Backup

- Use `backupService` / monitoring backup endpoints to record backup metadata.
- Prefer managed Postgres automated backups (Render / RDS) with point-in-time recovery where available.
- Store logical dumps off-region weekly.

### Restore outline

1. Provision empty Postgres (same major version).
2. Restore latest dump / snapshot.
3. Set API `DATABASE_URL` / `DB_*` to the restored instance.
4. Run `npm run db:migrate` (idempotent `ensureSchema`) then `npm run db:verify`.
5. Warm Redis (optional); traffic can start with memory cache.
6. Verify `GET /api/v1/health` and `GET /api/monitoring/health`.

## High availability (single region)

- K8s: ≥2 API replicas, HPA on CPU/memory, PodDisruptionBudget `minAvailable: 1`.
- Postgres: multi-AZ primary (managed) + optional read replica for reporting/BI later.
- Ingress + readiness on `/api/v1/health`.

## Multi-region (planned 3.3)

- Active-passive: promote replica in secondary region; update DNS / load balancer.
- Active-active: requires conflict strategy for orders/inventory — not enabled in 3.0.

## Chaos / drill checklist

- [ ] Restore backup to staging monthly
- [ ] Kill one API pod; confirm PDB keeps service up
- [ ] Disable Redis; confirm memory fallback + degraded Socket.IO
- [ ] Document time-to-recover after each drill
