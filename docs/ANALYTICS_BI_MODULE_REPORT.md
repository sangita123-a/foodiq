# Foodiq — Analytics & Business Intelligence Report

**Module:** Continuous Product Improvement — Task 4  
**Version:** 4.0.0  
**Date:** 2026-07-18  
**UI redesign:** None — AdminShell / DeliveryShell / partner tokens preserved

---

## 1. Executive summary

Task 4 delivers a production analytics layer: a unified **admin BI dashboard**, role-scoped restaurant / delivery / customer analytics APIs, real-time sales KPIs, funnel / retention / CLV / AOV / cart abandonment, popularity and peak-hour analytics, city and coupon/campaign reports, CSV/Excel/PDF export, scheduled email reports, interactive SVG charts, AI insights, sales forecast hooks, and anomaly detection — with query indexes for performance and JWT role-gated APIs.

---

## 2. Requirement matrix

| # | Requirement | Status | Deliverable |
|---|-------------|--------|-------------|
| 1 | Customer Analytics Dashboard | Done | `/api/analytics/customer` + profile KPIs (CLV/AOV) |
| 2 | Restaurant Analytics Dashboard | Done | `/api/analytics/restaurant` + partner export wiring |
| 3 | Delivery Partner Analytics Dashboard | Done | `/api/analytics/delivery` + `/delivery/analytics` |
| 4 | Admin Business Intelligence Dashboard | Done | `/admin/bi` → `/api/analytics/admin/dashboard` |
| 5 | Real-time Sales Analytics | Done | `/api/analytics/admin/realtime` (1h / 24h) |
| 6 | Revenue Analytics | Done | `getRevenueAnalytics` |
| 7 | Order Analytics | Done | Status breakdown + realtime |
| 8 | Customer Growth Analytics | Done | Weekly + summary |
| 9 | Restaurant Growth Analytics | Done | Weekly + active/new |
| 10 | Delivery Performance Analytics | Done | Avg minutes, top riders |
| 11 | Conversion Funnel Analysis | Done | customers → cart → order → delivered |
| 12 | User Retention Analysis | Done | 7d / 30d repeat rates |
| 13 | Customer Lifetime Value (CLV) | Done | Top customers + averages |
| 14 | Average Order Value (AOV) | Done | In revenue summary + UI |
| 15 | Cart Abandonment Analysis | Done | Rate + counts |
| 16 | Most Popular Restaurants | Done | Ranked by orders/revenue |
| 17 | Most Popular Dishes | Done | Ranked order_items |
| 18 | Peak Ordering Hours | Done | 0–23 hour histogram |
| 19 | City-wise Sales Reports | Done | Markets then addresses |
| 20 | Coupon Performance Analytics | Done | Redemptions + GMV |
| 21 | Marketing Campaign Analytics | Done | Seasonal campaigns × coupon_usage |
| 22 | Export PDF / Excel / CSV | Done | `/api/analytics/admin/export?format=` |
| 23 | Scheduled Email Reports | Done | `POST .../email-report` + existing daily platform email |
| 24 | Interactive Charts & Graphs | Done | `BiBarChart` / `BiLineChart` (hover tooltips) |
| 25 | AI-powered Business Insights | Done | Heuristic insight engine |
| 26 | Forecast Sales Trends | Done | Wraps `aiForecastService` |
| 27 | Detect Business Anomalies | Done | Z-score on daily GMV/orders |
| 28 | Optimize slow database queries | Done | Parallel fan-out + analytics indexes |
| 29 | Secure analytics APIs | Done | `protect` + `authorize` by role |
| 30 | Analytics & BI Report | Done | This document |

---

## 3. Architecture

```
Admin / Partner / Delivery / Customer clients
        │
        ▼
 /api/analytics/*
   ├─ /admin/*     (authorize admin)
   ├─ /restaurant  (restaurant_owner | admin)
   ├─ /delivery    (delivery_partner | admin)
   └─ /customer    (authenticated user)
        │
        ▼
 analyticsBiService  ──► PostgreSQL (indexed orders/users/…)
 analyticsExportService ► CSV / Excel CSV / PDF (pdfkit)
 aiForecastService / reportEmailService
```

---

## 4. Key API routes

| Method | Path | Role |
|--------|------|------|
| GET | `/api/analytics/admin/dashboard?days=` | Admin |
| GET | `/api/analytics/admin/realtime` | Admin |
| GET | `/api/analytics/admin/{revenue,orders,funnel,retention,clv,…}` | Admin |
| GET | `/api/analytics/admin/export?format=csv\|excel\|pdf` | Admin |
| POST | `/api/analytics/admin/email-report` | Admin |
| GET/POST | `/api/analytics/admin/forecast` | Admin |
| GET | `/api/analytics/restaurant` | Restaurant owner |
| GET | `/api/analytics/delivery` | Delivery partner |
| GET | `/api/analytics/customer` | Customer |

Legacy `/api/admin/analytics` and `/api/admin/v3/bi` remain for backward compatibility.

---

## 5. Query optimization

Indexes (idempotent via `ensureSchema`):

- `orders(created_at DESC)`
- `orders(status, created_at DESC)`
- `orders(restaurant_id, created_at DESC)`
- `orders(user_id, created_at DESC)`
- `orders(delivery_partner_id, created_at DESC)` partial
- `order_items(menu_item_id)`
- `users(role, created_at DESC)`

Dashboard uses `Promise.all` fan-out; day windows clamped (max 90–180).

---

## 6. Security

- All analytics routes require JWT (`protect`)
- Admin suite: `authorize('admin')`
- Restaurant / delivery scoped by role + ownership resolution
- Customer endpoint only returns `req.user.id` data
- Export endpoints do not expose other tenants’ rows

---

## 7. UI surfaces (no redesign)

| Surface | Path |
|---------|------|
| Admin BI | `/admin/bi` |
| Admin Analytics (classic) | `/admin/analytics` → links to BI |
| Partner exports | `DownloadReports` wired to restaurant analytics |
| Delivery analytics | `/delivery/analytics` |
| Customer profile | CLV / AOV KPIs on dashboard overview |

Charts: lightweight SVG/CSS components matching Foodiq orange `#FC8019` and card chrome.

---

## 8. Ops

1. Restart API for analytics indexes + `analytics_report_runs` table.  
2. Open `/admin/bi` as admin; export CSV/PDF; send email report.  
3. Cron (external): `POST /api/analytics/admin/email-report` with admin token, or existing messaging `reports/run`.  
4. Forecast: `GET /api/analytics/admin/forecast?horizon=7`.
