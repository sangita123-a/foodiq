# Foodiq CI/CD Secrets & Variables

Store in **GitHub → Settings → Secrets and variables → Actions**.  
Prefer **Environments** (`development` / `staging` / `production`) for per-env values.

**Never commit real values. `.env*` is gitignored.**

## Deploy secrets (required for automatic deploy)

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Frontend deploy (Vercel) |
| `VERCEL_ORG_ID` | Vercel org / team id |
| `VERCEL_PROJECT_ID` | Vercel project id |
| `RENDER_API_KEY` | Backend deploy (Render API) |
| `RENDER_SERVICE_ID` | Production Render web service id |
| `RENDER_SERVICE_ID_DEV` | Optional development Render service |
| `RENDER_SERVICE_ID_STAGING` | Optional staging Render service |
| `RENDER_OWNER_ID` | Optional workspace id (auto-detected if omitted) |

## Optional / legacy

| Secret | Purpose |
|--------|---------|
| `SLACK_WEBHOOK_URL` | Slack notifications |
| `TEAMS_WEBHOOK_URL` | Teams notifications |
| `NOTIFY_EMAIL_WEBHOOK` | Email bridge |
| `DEPLOY_SSH_*` | Legacy SSH backend deploy (fallback) |
| `MIGRATE_WEBHOOK_DEV` | Optional migrate hook |

## Runtime secrets (Vercel / Render dashboards — not in git)

Mirror `.env.example` and `foodiq-frontend/foodiq-backend/.env.example`:

| Category | Keys |
|----------|------|
| Database | `DATABASE_URL` (Render injects from Postgres) |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| CORS | `FRONTEND_URL`, `CORS_STRICT`, `CORS_ORIGINS` |
| Frontend build | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` |
| Payments | `RAZORPAY_*` |
| Email / SMS / FCM / Storage | provider keys |
| Security | `AUTH_SECURE_COOKIES`, `CSRF_ENABLED`, `ALLOW_BOOTSTRAP_USERS=false` |

## Repository / Environment variables (non-secret)

| Variable | Example |
|----------|---------|
| `APP_URL` | `https://foodiq-….vercel.app` |
| `PROD_API_URL` | `https://foodiq-backend-api.onrender.com` |
| `STAGING_API_URL` | Staging API base URL |
| `NEXT_PUBLIC_API_URL` | Public API URL baked into Next build |

## Rotation

1. Rotate in provider (Vercel / Render / Razorpay / etc.)
2. Update GitHub Environment secret or host env
3. Redeploy via Actions
4. Revoke old credentials
