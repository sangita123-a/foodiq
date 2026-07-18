# CDN, Redis, and search for Foodiq 3.0

## CDN / object storage

- Uploads use `services/storage/` (local, S3, or Cloudinary).
- Set `S3_CDN_URL` or Cloudinary delivery URL so browsers hit the CDN edge.
- Next.js: optional `CDN_ASSET_PREFIX` (maps to `assetPrefix`) for static assets behind a CDN.
- Image remote patterns already allow Cloudinary, S3, and CloudFront hostnames.

## Redis

| Env | Purpose |
|-----|---------|
| `REDIS_ENABLED` | `true` in K8s / Compose; memory fallback when unset/false |
| `REDIS_URL` | e.g. `redis://foodiq-redis:6379` |
| Socket adapter | Uses Redis when available for multi-pod pub/sub |

Local: `docker-compose.yml` includes Redis and sets `REDIS_ENABLED=true` for the API.

K8s: see `deploy/k8s/foodiq.yaml` (`foodiq-redis` Deployment + Service).

## Search

| Env | Value |
|-----|-------|
| `SEARCH_PROVIDER` | `pg` (default) or `elasticsearch` |
| `ELASTICSEARCH_NODE` | Required when provider is elasticsearch |

Adapter: `services/searchAdapter.js`. Postgres ILIKE / `pg_trgm` remains production default until an ES cluster is provisioned.

## Monitoring scrape

- Public: `GET /api/monitoring/health` (includes `region`, `market_default`)
- Admin metrics: `GET /api/metrics` / monitoring dashboard routes
- Prometheus/Datadog: scrape health + metrics; label by `FOOIQ_REGION`

## Render notes

`render.yaml` already documents `REDIS_ENABLED`. Enable a Redis add-on and set `REDIS_URL` for multi-instance Socket.IO and catalog cache.
