# Foodiq CI/CD

Enterprise continuous integration and deployment. **Does not change application UI or business logic.**

## Pipeline overview

```
Pull Request  →  PR Validation (lint · typecheck · unit · API smoke)
      ↓
Push develop  →  Continuous Integration  →  Development Deploy (Vercel preview + Render)
Push staging  →  Continuous Integration  →  Staging Deploy
Push main     →  Continuous Integration  →  Production Deploy (approval) → Vercel prod + Render
                     ↓ on smoke failure
                 Auto-rollback + notify
```

**Deployments never start unless CI succeeds** (`workflow_run` gated on conclusion `success`).

## Workflows

| Workflow | File | Trigger |
|----------|------|---------|
| Continuous Integration | `.github/workflows/ci.yml` | Push to `main` / `develop` / `staging` / `production` |
| PR Validation | `.github/workflows/pr-validation.yml` | Pull requests |
| Development Deploy | `.github/workflows/ci-development.yml` | After CI succeeds on `develop` |
| Staging Deploy | `.github/workflows/ci-staging.yml` | After CI succeeds on `staging` |
| Production Deploy | `.github/workflows/cd-production.yml` | After CI succeeds on `main` / `production` |
| Rollback | `.github/workflows/rollback.yml` | Manual (`confirm=ROLLBACK`) |
| Release | `.github/workflows/release.yml` | Manual / tag `v*` |
| Reusable CI | `.github/workflows/reusable-ci.yml` | Called by CI / PR |

## What CI runs (fails the pipeline on error)

### Frontend (repo root)
- `npm ci` → **ESLint** → **TypeScript** → **unit tests** → **Next.js build**
- Artifacts: `.next` build (pushes only)
- `npm audit` is advisory (non-blocking)

### Backend (`foodiq-frontend/foodiq-backend`)
- Unit tests
- Postgres 16 → `schema.sql` → `db:migrate` → `db:verify`
- Start API → `test:api` + `test:modules`
- Gitleaks secret scan (advisory)

Any lint, typecheck, test, or build failure **fails CI** and blocks deploy.

## Deployment targets

| Layer | Platform | Secrets |
|-------|----------|---------|
| Frontend | **Vercel** | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| Backend | **Render** | `RENDER_API_KEY`, `RENDER_SERVICE_ID` |

Helper: `scripts/ci/deploy.sh` (logs → `deploy.log` artifact).  
Render trigger: `scripts/ci/trigger-render-deploy.js`.  
Blueprint: `render.yaml`.

Production sets `REQUIRE_DEPLOY=true` — missing required credentials fails the deploy job.

## Deployment logs

Each deploy uploads an Actions artifact, e.g.:

- `deploy-logs-production-<sha>`
- Contains `deploy.log`, `render-deploy.log`, `vercel-deploy-url.txt`, optional `post-deploy-smoke.log`

Download from the workflow run → Artifacts.

## Secrets

See [SECRETS.md](./SECRETS.md). Never commit `.env` files.

Minimum for CI (no deploy): none (ephemeral Postgres in Actions).

Minimum for production deploy:

- Vercel trio + `RENDER_API_KEY` + `RENDER_SERVICE_ID`
- Environment vars: `APP_URL`, `PROD_API_URL`, `NEXT_PUBLIC_API_URL`

## Environments checklist

1. GitHub → Settings → Environments: `development`, `staging`, `production`
2. On `production`, enable **Required reviewers**
3. Add secrets from SECRETS.md
4. Protect `main` / `production` with required checks: **Frontend — lint, typecheck, test, build** and **Backend — test, migrate, API smoke**

## Rollback

See [ROLLBACK.md](./ROLLBACK.md).

## Local commands

```bash
# Frontend (same as CI)
npm run lint && npm run typecheck && npm run test:unit && npm run build

# Backend
cd foodiq-frontend/foodiq-backend
npm run test:unit
npm run db:migrate && npm run db:verify
npm run test:api   # API must be running
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CI fails on lint/typecheck | Fix locally with `npm run lint` / `npm run typecheck` |
| Deploy skipped | CI must be green; check `workflow_run` conclusion |
| `REQUIRE_DEPLOY` failure | Add Vercel + Render secrets |
| Render timeout | Free tier cold starts — raise wait or check Render dashboard |
| Production waiting | Approve Environment deployment in Actions |
| Double PR CI | Expected if both PR Validation and branch protection list multiple checks — keep one required |
