# Foodiq 4.0 — Multi-Region HA & DR

Extends [`V3_DISASTER_RECOVERY.md`](V3_DISASTER_RECOVERY.md). Live active-active remains **phase 4.3**.

## Targets

| Mode | RPO | RTO |
|------|-----|-----|
| Single-region HA (4.0) | ≤ 24h backups | ≤ 4h |
| Active-passive multi-region (4.3) | ≤ 5 min (PITR) | ≤ 30 min |
| Active-active (future) | Near-zero | Seconds — requires conflict strategy |

## Architecture (active-passive)

1. Primary region: API (K8s HPA ≥2), Postgres primary, Redis, CDN origin
2. Secondary region: Postgres replica (async), warm API deployment scaled to 0 or 1
3. DNS / traffic manager failover on health (`/api/v4/health`, `/api/monitoring/health`)

## K8s

See [`deploy/k8s/foodiq.yaml`](../deploy/k8s/foodiq.yaml) and [`deploy/k8s/README.md`](../deploy/k8s/README.md).

Multi-region notes:

- Duplicate Deployment with region label `FOOIQ_REGION`
- Separate Redis per region (no cross-region session sticky required if JWT stateless)
- Object storage: multi-region or CDN-backed bucket

## Drill checklist

- [ ] Promote replica in staging quarterly
- [ ] Fail over DNS to secondary API
- [ ] Run `db:migrate` / `db:verify` on promoted DB
- [ ] Confirm `/api/v4/health` and checkout smoke

## CDN

- `CDN_ASSET_PREFIX` on Next.js (`next.config.ts`)
- `S3_CDN_URL` / Cloudinary for media
- Catalog GETs: `Cache-Control` on `/api/v1` restaurants/markets
