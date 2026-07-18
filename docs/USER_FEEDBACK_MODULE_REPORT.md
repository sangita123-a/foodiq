# User Feedback Module Report

**Module:** Continuous Product Improvement — User Feedback System  
**Date:** 2026-07-18  
**UI redesign:** None (existing Foodiq AdminShell / order / delivery chrome)

---

## 1. Summary

Customers can rate restaurant, delivery partner, and overall experience after a **Delivered** order; edit or delete that feedback; see restaurant averages on restaurant pages and delivery averages on the partner ratings profile. Admins manage an expanded Feedback dashboard with filters, pagination, and analytics (average ratings, most reviewed restaurants/dishes, CSAT).

---

## 2. Requirements coverage

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Submit after completed order | Done — Delivered gate + `OrderFeedbackForm` |
| 2 | Restaurant 1–5 stars | Done |
| 3 | Delivery partner 1–5 stars | Done |
| 4 | Written reviews | Done — restaurant / delivery / overall comments |
| 5 | Edit / delete own feedback | Done — `PUT` / `DELETE /api/orders/:id/feedback` + form actions |
| 6 | Avg on restaurant pages | Done — `restaurants.rating` + page display |
| 7 | Avg on delivery partner profiles | Done — `/delivery/reviews` average + total |
| 8 | Admin Feedback Dashboard | Done — Order feedback + Analytics tabs |
| 9 | Admin filters (restaurant, DP, rating, date) | Done |
| 10 | Analytics (avg, restaurants, dishes, CSAT) | Done |
| 11 | PostgreSQL storage | Done — `reviews`, `delivery_reviews`, `order_feedback` |
| 12 | API validation | Done — integer 1–5, comment length, auth, delivered |
| 13 | Pagination | Done — admin lists + delivery reviews |
| 14 | Responsive design | Done — existing `md:` / flex-wrap patterns |
| 15 | Module report | Done — this document |

---

## 3. Data model

| Table | Role |
|-------|------|
| `reviews` | Per-order restaurant rating + comment |
| `delivery_reviews` | Per-order delivery partner rating + comment |
| `order_feedback` | Overall rating + comment + tags |
| `user_feedback` | General product feedback (Help & Support) |

Averages: `restaurants.rating` and `delivery_partners.rating` recalculated on write/delete.

---

## 4. API surface

| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/api/orders/:id/feedback` | Customer submit / read |
| PUT/DELETE | `/api/orders/:id/feedback` | Edit / delete own feedback |
| GET | `/api/admin/order-feedback` | Filtered list + pagination |
| GET | `/api/admin/reviews` | Moderation list + filters + pagination |
| GET | `/api/admin/analytics/feedback` | CSAT, top restaurants/dishes |
| GET | `/api/admin/analytics/reviews` | Same analytics (maintenance) |
| GET | `/api/delivery/me/reviews` | Partner profile averages + paginated reviews |

---

## 5. Frontend

- [`components/feedback/OrderFeedbackForm.tsx`](../components/feedback/OrderFeedbackForm.tsx) — submit / edit / delete
- [`app/admin/feedback/page.tsx`](../app/admin/feedback/page.tsx) — dashboard tabs, filters, analytics, pagination
- [`app/delivery/reviews/page.tsx`](../app/delivery/reviews/page.tsx) — average rating profile
- Restaurant page — existing average star display

---

## 6. Analytics definitions

- **Average rating:** mean of visible restaurant reviews (and delivery separately)
- **Most reviewed restaurants / dishes:** count of reviews in last N days
- **CSAT score:** % of ratings ≥ 4 across restaurant reviews + overall order feedback

---

## 7. Security

- JWT required; only order owner (or admin for delete) may mutate feedback
- Feedback only for Delivered orders on create
- Comments truncated to 2000 chars; ratings validated as integers 1–5
- Admin endpoints require `admin` role

---

## 8. Out of scope / follow-ups

- Public marketing page for delivery partners (customer-facing DP profile URL)
- Dish-level star rating UI (analytics inferred from order items)
- Soft-delete / moderation workflow for overall comments beyond restaurant review hide
