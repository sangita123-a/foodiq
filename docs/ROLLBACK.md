# Foodiq Rollback Guide

## Quick rollback (recommended)

1. Open **GitHub → Actions → Rollback**
2. Choose environment: `production` | `staging` | `development`
3. Set **ref** to a previous release tag (e.g. `v2026.07.18-abc1234`) or commit SHA
4. Choose component: `all` | `frontend` | `backend`
5. Type `ROLLBACK` in the confirm field
6. Run workflow (production Environment may require approval)

This redeploys that git ref to:
- **Frontend:** Vercel
- **Backend:** Render (via `RENDER_API_KEY` + `RENDER_SERVICE_ID`)

Deployment logs are uploaded as workflow artifacts.

## Auto-rollback

Production Deploy runs post-deploy API smoke when `PROD_API_URL` is set.  
If smoke fails, Actions checks out the previous SHA and redeploys automatically.

## Manual Vercel rollback

1. Vercel Dashboard → Project → Deployments
2. Open a previous successful production deployment → **Promote to Production**

## Manual Render rollback

1. Render Dashboard → `foodiq-backend-api` → Events / Deploys
2. Redeploy a previous successful deploy, **or**
3. Actions → Rollback with the matching git tag (triggers a new deploy from that commit)

## Database rollback

Schema changes via `ensureSchema` are **additive/idempotent**.  
Destructive DB undo is **not** automatic:

1. Restore Postgres from the latest Render/Neon backup
2. Redeploy the matching app version (git tag)
3. Record the backup id in the rollback Actions run notes

Never drop columns or tables in production from CI.

## Finding a good rollback target

```bash
git tag -l 'v*' --sort=-creatordate | head
gh release list --limit 10
```

Prefer tagged production releases created by the Production Deploy workflow.
