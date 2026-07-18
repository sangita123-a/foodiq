# Foodiq Version 3.0 — Architecture Report

**Version:** 3.0.0 (Foundation)  
**Date:** 2026-07-18  
**Theme:** Business Scaling — nationwide multi-tenant SaaS ecosystem  
**UI redesign:** None (additive APIs, schema, infra only)

---

## 1. Executive summary

Foodiq 3.0 evolves the single-market delivery platform into a **multi-organization, multi-market SaaS foundation**. This release ships:

- Tenancy: organizations, markets (country/state/city), franchises, restaurant chains, white-label config
- Multi-currency registry + FX rates (INR default preserved)
- Public Developer API + Partner API keys (`/api/v1`)
- Pricing engine + surge events (feature-flagged off by default)
- Inventory + warehouse + integration connector stubs (POS/ERP/CRM/warehouse)
- BI KPIs + heuristic AI sales/demand forecasts
- Redis/CDN documentation, Elasticsearch-ready search adapter, Kubernetes + HPA manifests
- Disaster recovery / HA runbooks

**Backward compatible:** existing V1/V2 routes unchanged; default org + India/INR market seeded; pricing engine disabled unless `PRICING_ENGINE_ENABLED=true`.

---

## 2. Target architecture

```
Clients (Web / Mobile / Partners / Franchise)
        │
        ▼
   CDN + /api/v1 Gateway (API keys) ──► Express API
        │                                  │
        │                     ┌────────────┼────────────┐
        │                     ▼            ▼            ▼
        │                  Redis        Search       Workers
        │                (cache)     (PG|ES)      (forecast)
        │                     │            │            │
        └─────────────────────┴──── PostgreSQL ◄────────┘
                                   (+ replicas)
                              Object storage / CDN
                              Kubernetes HPA + monitoring + DR
```

---

## 3. Requirement matrix (all 30)

| # | Requirement | Status | Foundation deliverable |
|---|-------------|--------|------------------------|
| 1 | Multi-City Management | Foundation | `markets` hierarchy (`city` level) + admin APIs |
| 2 | Multi-State Operations | Foundation | `markets.state_code` + org-market links |
| 3 | Multi-Country Support | Foundation | `markets.country_code` + currencies |
| 4 | Multi-Currency Support | Foundation | `currencies`, `fx_rates`, `getCheckoutCurrency()` |
| 5 | Franchise Management | Foundation | `franchises` + admin CRUD |
| 6 | Restaurant Chain Management | Foundation | `restaurant_chains` + `restaurants.chain_id` |
| 7 | White-label Platform | Foundation | `white_label_configs` + `/api/v1/branding` |
| 8 | Enterprise Restaurant Portal | Foundation | Org-scoped analytics via `/api/v1/partner` + existing partner JWT |
| 9 | Advanced BI Dashboard | Foundation | `biService` + `/admin/bi` |
| 10 | AI Sales Forecasting | Foundation | Heuristic `aiForecastService` (moving average) |
| 11 | AI Demand Prediction | Foundation | Same service, `type=demand` runs |
| 12 | Dynamic Pricing Engine | Foundation | `pricingEngine` + `pricing_rules` (flagged) |
| 13 | Surge Pricing | Foundation | `surge_events` evaluated by pricing engine |
| 14 | Inventory Management | Foundation | `inventory_items` qty model |
| 15 | Warehouse Integration | Foundation | `warehouses` + connector type `warehouse` |
| 16 | POS Integration | Foundation | Connector stub `pos` |
| 17 | ERP Integration | Foundation | Connector stub `erp` |
| 18 | CRM Integration | Foundation | Connector stub `crm` |
| 19 | Public Developer API | Foundation | `/api/v1/*` + API keys + OpenAPI |
| 20 | Partner API | Foundation | `/api/v1/partner` key scopes + JWT `/api/partner` |
| 21 | Mobile App Backend Optimization | Foundation | Market-scoped Redis catalog cache + cache headers |
| 22 | CDN Integration | Exists + docs | Cloudinary / S3 CDN (`docs/V3_CDN_REDIS.md`) |
| 23 | Redis Caching | Exists + docs | `cacheService` + K8s Redis |
| 24 | Elasticsearch Integration | Foundation | `searchAdapter` (`pg` default \| `elasticsearch`) |
| 25 | Kubernetes-ready Deployment | Foundation | `deploy/k8s/*` |
| 26 | Auto Scaling Infrastructure | Foundation | HPA manifests |
| 27 | Global Monitoring | Foundation | Market labels on health + Prometheus notes |
| 28 | Disaster Recovery | Foundation | `docs/V3_DISASTER_RECOVERY.md` |
| 29 | High Availability Architecture | Foundation | PDB + multi-replica Deployment + Redis |
| 30 | Architecture Report | Done | This document + canvas |

---

## 4. Tenancy model

| Entity | Role |
|--------|------|
| `organizations` | SaaS customer / brand owner |
| `markets` | Country → state → city operating unit + `currency_code` |
| `organization_markets` | Which orgs operate in which markets |
| `franchises` | Franchise units under an organization |
| `restaurant_chains` | Brand chains; restaurants link via `chain_id` |
| `white_label_configs` | Domain, logo, accent tokens, feature flags |

**Seed:** Organization `Foodiq Default`, market `IN-KA-BLR` (Bengaluru, INR). Existing restaurants backfilled with default org/market when null.

---

## 5. API surface (additive)

| Surface | Auth | Purpose |
|---------|------|---------|
| `/api/v1/health` | Public | Versioned health |
| `/api/v1/branding` | Public | White-label by host |
| `/api/v1/markets` | Public / key | List markets |
| `/api/v1/restaurants` | Optional key | Market-scoped catalog |
| `/api/v1/partner/*` | API key `partner` | Partner read APIs |
| `/api/v1/integrations/:type/sync` | API key `enterprise` | Connector stubs |
| `/api/admin/v3/*` | Admin JWT | Markets, orgs, franchises, chains, BI, forecasts, pricing |

Legacy `/api/*` unchanged.

---

## 6. Phased roadmap

| Phase | Focus |
|-------|--------|
| **3.0 Foundation (this)** | Schema, APIs, stubs, K8s, docs |
| **3.1 Integrations** | Real POS/ERP/CRM/warehouse connectors |
| **3.2 AI/ML** | Trained forecasting models, online learning |
| **3.3 Global HA** | Multi-region active-active, global traffic manager |

---

## 7. Security & compatibility

- API keys stored hashed (`sha256`); raw key shown once at creation
- Pricing engine **off** by default → identical V2 checkout math
- Search stays Postgres unless `SEARCH_PROVIDER=elasticsearch`
- Migrations are `CREATE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` only

---

## 8. Related docs

- [V3 Disaster Recovery](V3_DISASTER_RECOVERY.md)
- [V3 CDN & Redis](V3_CDN_REDIS.md)
- [OpenAPI v1](api/openapi-v1.yaml)
- [Maintenance (V2)](MAINTENANCE.md)

---

## 9. Success criteria checklist

- [x] Architecture report covers all 30 themes
- [x] Schema migrates idempotently (`db:migrate` / `db:verify`)
- [x] V1/V2 regression + `/api/v1/health` pass
- [x] K8s manifests in `deploy/k8s/` (`kubectl` dry-run when CLI available)
- [x] No customer-facing UI redesign
- [x] Idempotent schema with default org/market seed
- [x] `/api/v1` additive; V1/V2 preserved
- [x] K8s manifests under `deploy/k8s/`
- [x] No customer UI redesign
