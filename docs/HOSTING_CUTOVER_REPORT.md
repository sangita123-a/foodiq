# Foodiq Hosting Cutover Report — 2026-07-18

**Scope:** Hosting only (no app/UI/schema code changes beyond CD workflow ops)  
**Goal:** Live Render API + public Vercel site

---

## Current live status

| Check | Result |
|-------|--------|
| `https://foodiq-backend-api.onrender.com/api/health` | **404** + `x-render-routing: no-server` |
| Frontend `foodiq-sangita123-as-projects.vercel.app` | **302** Vercel SSO |
| Popular Restaurants / Trending Dishes | Blocked until API is live |

---

## What we verified

### Render
| Setting | Expected | Status |
|---------|----------|--------|
| Service name | `foodiq-backend-api` | Hostname resolves but **no process** |
| Root Directory | `foodiq-frontend/foodiq-backend` | In `render.yaml` |
| Build | `npm ci --omit=dev` | In `render.yaml` |
| Pre-deploy | `npm run db:migrate` | In `render.yaml` (seeds if empty) |
| Start | `npm start` | In `render.yaml` |
| Health | `/api/health` | In `render.yaml` |

### GitHub deploy
| Item | Status |
|------|--------|
| Hosting Deploy workflow | Added & runnable |
| Run [29657389610](https://github.com/sangita123-a/foodiq/actions/runs/29657389610) | **Failed** — credentials empty |
| `RENDER_API_KEY` | **missing** |
| `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | **missing** |
| `vars.APP_URL` / `vars.PROD_API_URL` | **missing** |

Deploy log excerpt:
```
[deploy] Vercel secrets missing — skip frontend
[deploy] RENDER_API_KEY missing — skip backend Render deploy
[deploy] REQUIRE_DEPLOY=true — failing
```

---

## Blocker (cannot proceed without you)

Paste these into the chat (or set them as GitHub **production** environment secrets), and hosting can be completed immediately:

1. **`RENDER_API_KEY`** — Render → Account Settings → API Keys  
2. **`VERCEL_TOKEN`** — Vercel → Settings → Tokens  
3. **`VERCEL_ORG_ID`** + **`VERCEL_PROJECT_ID`** — Vercel project settings  
4. Optional: **`RENDER_SERVICE_ID`** if the service already exists in the dashboard  

Also in Vercel dashboard (manual, one click):
- Project → **Deployment Protection** → **disable for Production**

---

## Once credentials are provided

Automated steps that will run:
1. Create/repair Render Postgres + `foodiq-backend-api`
2. Migrate + auto-seed catalog if empty
3. Wait until `/api/health` = **200**
4. Verify `/api/restaurants` and `/api/menu-items` return data
5. Set `NEXT_PUBLIC_API_URL` and redeploy Vercel
6. Confirm home Popular Restaurants + Trending Dishes + images
7. Publish final green production report

---

## Score

| Area | Score |
|------|-------|
| App code readiness | 95/100 |
| Hosting credentials / live cutover | **0/100** (secrets absent, API no-server, Vercel SSO) |
| **Overall** | **Blocked on credentials** |
