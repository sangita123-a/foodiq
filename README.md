# Foodiq

Full-stack food delivery platform — Next.js frontend (Vercel) + Express/PostgreSQL API (Render).

## Getting started

```bash
# Frontend
npm install
npm run dev

# Backend (separate terminal)
cd foodiq-frontend/foodiq-backend
npm install
cp .env.example .env   # configure DB + JWT_SECRET
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API defaults to [http://localhost:4000](http://localhost:4000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run test:unit` | Unit tests |
| `npm run build` | Production Next.js build |
| `npm run ci` | lint + typecheck + unit + build |

Backend: see `foodiq-frontend/foodiq-backend/package.json` (`test:unit`, `db:migrate`, `test:api`).

## CI/CD

Automated GitHub Actions pipeline:

1. **Every PR** — lint, typecheck, unit tests, API smoke (fails on any error)
2. **Push to `develop`** — CI → Development deploy (Vercel + Render)
3. **Push to `main`** — CI → Production deploy (Vercel + Render, Environment approval)
4. **Rollback** — manual workflow with confirmation
5. **Deployment logs** — uploaded as Actions artifacts

| Doc | Contents |
|-----|----------|
| [docs/CICD.md](./docs/CICD.md) | Full pipeline, workflows, troubleshooting |
| [docs/SECRETS.md](./docs/SECRETS.md) | GitHub Secrets & environment variables |
| [docs/ROLLBACK.md](./docs/ROLLBACK.md) | Rollback & database restore |

### Deploy targets

| App | Platform |
|-----|----------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) (`render.yaml`) |

Deployments run **only after CI succeeds**. Production uses GitHub Environment protection + optional auto-rollback on smoke failure.

### Required GitHub secrets (production)

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RENDER_API_KEY`, `RENDER_SERVICE_ID`

See [docs/SECRETS.md](./docs/SECRETS.md) for the complete list.

## License

Private / project use.
