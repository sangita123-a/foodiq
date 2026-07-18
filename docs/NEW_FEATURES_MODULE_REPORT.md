# Foodiq — New Features Module Report

**Module:** Continuous Product Improvement — Task 3  
**Version:** 4.0.0  
**Date:** 2026-07-18  
**UI redesign:** None — additive APIs and rails on existing Foodiq design system

---

## 1. Executive summary

Task 3 ships a **customer growth features foundation**: wishlist, referrals, gift cards, recently viewed, collections, seasonal campaigns, smart search suggestions, advanced filters, personalized home rails, coupon recommendations, reorder API, improved ETA, and **product feature flags** with percent rollout. Existing modules (addresses, scheduled checkout, favorites, rewards, live tracking) remain the source of truth and are extended—not replaced.

---

## 2. Requirement matrix

| # | Feature | Status | Deliverable |
|---|---------|--------|-------------|
| 1 | Wishlist Module | Done | `wishlists` + `/api/features/wishlist` + `/wishlist` page |
| 2 | Saved Addresses | Exists | Unchanged `/api/addresses` + `/saved-addresses` (+ optional lat/lng columns) |
| 3 | Scheduled Orders | Exists | Checkout `delivery_mode=Schedule` + `scheduled_for` |
| 4 | Repeat Previous Order | Done | `POST /api/orders/:id/reorder` + My Orders wiring |
| 5 | Smart Search + Autosuggest | Done | `GET /api/search/suggest` + SearchBar dropdown |
| 6 | Advanced Restaurant Filters | Done | snake/camel params, veg, offers, sort in `restaurantModel` + FilterSidebar |
| 7 | AI Food Recommendations | Done | `/api/features/recommendations` (history + trending dishes) |
| 8 | Personalized Home Page | Done | `/api/features/home` + `PersonalizedHomeRails` |
| 9 | Coupon Recommendation Engine | Done | `/api/features/coupons/recommend` + checkout suggestions |
| 10 | Referral & Invite Friends | Done | `referral_codes` / redemptions, signup hook, live ReferBanner |
| 11 | Loyalty & Rewards | Exists | `/api/rewards` + points ledger (referral credits into it) |
| 12 | Gift Cards | Done | purchase / balance / redeem APIs (`gift_cards`) |
| 13 | Live Order ETA Improvements | Done | peak-hour + prep buffer via `computeImprovedEta` in socket |
| 14 | Favorite Restaurants | Exists | `/api/favorites/restaurants/:id` |
| 15 | Recently Viewed Items | Done | `recently_viewed` + `/api/features/views*` |
| 16 | Trending Near You | Done | `/api/features/trending` (geo / city / global) |
| 17 | Restaurant Collections | Done | DB collections + FeaturedCollections API feed |
| 18 | Seasonal Campaigns | Done | `seasonal_campaigns` + home/campaigns API |
| 19 | Feature Flags | Done | `product_feature_flags` + percent rollout + admin CRUD |
| 20 | New Features Report | Done | This document |

---

## 3. Architecture

```
Clients (Home / Search / Checkout / Profile)
        │
        ▼
 /api/features/*   (optionalProtect | protect)
 /api/search/suggest
 /api/orders/:id/reorder
 /api/admin/feature-flags
        │
        ├─ featureFlagService (cache + % rollout)
        ├─ cpiFeaturesService (home, trending, coupons, ETA)
        ├─ aiRecommendationService
        └─ PostgreSQL (CPI tables + existing catalog/orders)
```

---

## 4. API surface (additive)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/features/flags` | Optional |
| GET | `/api/features/home` | Optional |
| GET | `/api/features/recommendations` | Optional |
| GET | `/api/features/trending` | Optional |
| GET | `/api/features/coupons/recommend` | Optional |
| GET | `/api/features/collections[/:slug]` | Public |
| GET | `/api/features/campaigns` | Public |
| POST/GET | `/api/features/views*` | Optional |
| CRUD | `/api/features/wishlist*` | User |
| GET/POST | `/api/features/referral*` | User |
| POST/GET | `/api/features/gift-cards*` | User (balance public by code) |
| POST | `/api/features/eta/estimate` | Optional |
| GET | `/api/search/suggest?q=` | Public |
| POST | `/api/orders/:id/reorder` | User |
| GET/PUT | `/api/admin/feature-flags[/:key]` | Admin |

Legacy routes (`/api/addresses`, `/api/favorites`, `/api/rewards`, `/api/checkout`, tracking sockets) unchanged.

---

## 5. Feature flags

Seeded keys (default mostly enabled; `gift_cards` at 50% rollout):

`wishlist`, `scheduled_orders`, `smart_search`, `personalized_home`, `ai_recommendations`, `coupon_recommendations`, `referrals`, `gift_cards`, `recently_viewed`, `trending_near_you`, `collections`, `seasonal_campaigns`, `advanced_filters`

Rollout: MD5(`key:userId`) % 100 compared to `rollout_percent`. Frontend: `FeatureFlagProvider` + `useFeatureFlag`.

---

## 6. Database tables (new)

`wishlists`, `recently_viewed`, `referral_codes`, `referral_redemptions`, `gift_cards`, `gift_card_transactions`, `restaurant_collections`, `collection_restaurants`, `seasonal_campaigns`, `product_feature_flags`  
Plus optional `addresses.lat/lng`, `order_tracking.eta_minutes`.

Applied via `ensureSchema` on boot; verified in `scripts/ci/verify-schema.js`.

---

## 7. Backward compatibility

- No breaking changes to existing customer or admin APIs  
- Static collection / referral UI fall back when APIs empty  
- Reorder falls back to legacy cart-add loop if API fails  
- Filter query accepts both `delivery_time` and `deliveryTime`  
- Feature flags default unknown keys to **enabled** so additive UX stays available

---

## 8. Performance notes

- Autosuggest capped (≤15), prefix-biased  
- Feature flag list cached 30s in-process  
- Restaurant list retains Redis wrap  
- Personalized home fans out with `Promise.all`  
- Indexes on wishlist user, recently_viewed, campaign window, collections slug

---

## 9. UI touchpoints (no redesign)

| Surface | Change |
|---------|--------|
| Home | `PersonalizedHomeRails` above existing sections |
| SearchBar | Autosuggest dropdown |
| FilterSidebar | Pure veg, offers, sort |
| FeaturedCollections | API-backed with static fallback |
| ReferBanner | Live referral code |
| My Orders | Server reorder |
| Checkout promo | Recommended coupon chips |
| `/wishlist` | New page using existing tokens |
| Providers | `FeatureFlagProvider` |

---

## 10. Ops

1. Restart API so `ensureSchema` creates CPI tables and seeds flags/collections.  
2. `npm run db:verify` in backend.  
3. Toggle flags: `PUT /api/admin/feature-flags/:key` with `{ enabled, rollout_percent }`.  
4. Register with `referral_code` to credit referrer/referee points.
