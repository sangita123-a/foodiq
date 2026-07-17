# Foodiq Catalog & UI Audit — QA Report

**Date:** July 17, 2026  
**Scope:** Catalog data, image system, discovery routes, commerce flows, checkout alignment

## Verification Summary

| Check | Result |
|-------|--------|
| Catalog validation (`npm run catalog:validate`) | ✅ Passed — 49 restaurants, 306 dishes, 80 trending, 16 cuisines |
| ESLint (`npm run lint`) | ✅ Passed |
| Production build (`npm run build`) | ✅ Passed — 70 routes |
| Local image library (`public/images/catalog/`) | ✅ 64 curated `.webp` assets |
| Missing DB image URLs | ✅ 0 |

## Completed Work

### 1. Catalog (PostgreSQL, idempotent)
- Non-destructive migration + upsert loader under `foodiq-frontend/foodiq-backend/database/`
- 25 catalog restaurants, 240 cuisine dishes, 16 cuisines, 3 offers
- Scripts: `catalog:migrate`, `catalog:sync`, `catalog:validate`

### 2. Image system
- Centralized fallbacks in `lib/images.ts` (`getFoodImage`, `getRestaurantImage`, `getOfferImage`, `AVATAR_FALLBACK`)
- `SafeImage` used across customer discovery surfaces
- Replaced Unsplash URLs on cart, favorites, offers, trending, search, orders, and review avatars
- Local assets at `/images/catalog/{cuisines,food,restaurants,logos}/`

### 3. Discovery routes
- **Trending:** `/api/menu-items?trending=true&limit=80`, ranked cards, links to `/food/[id]`
- **Cuisines:** 16 cuisine pages with 15+ dishes each, search, banner, checkout CTA
- **Food detail:** `/food/[id]` with gallery, ingredients, reviews, related dishes, Add to Cart, Buy Now, share, favorite
- **Restaurant:** Guest-safe cart/favorites, logo/banner URLs, favorite/share header, Order Now bar → checkout
- **Offers:** Detail pages with eligible items, participating restaurants, cart + checkout
- **Filters:** Category slugs (not display names) to prevent UUID/API errors; multi-cuisine filter supported in backend

### 4. Commerce actions
- Shared hooks: `useCartActions`, `useFavoriteActions`
- Wired on cuisine cards, trending, search, restaurant menu, food detail, offer cards
- Buy Now path: add to cart → `/checkout` → address → payment

### 5. Flow correctness
- Removed hardcoded ₹15 platform fee from cart/checkout summaries (matches backend)
- Checkout passes `delivery_mode` and `scheduled_for` to order placement
- Empty-cart guard on checkout
- Address EDIT → `/saved-addresses?edit=`, DELETE → API + refresh
- Single-restaurant cart enforcement retained on backend

## Known Limitations

1. **Supabase Storage:** Not implemented — project uses local `/public/images` only (no Supabase SDK/credentials in repo).
2. **Partner dashboard pages:** Some partner mock screens still reference Unsplash for demo analytics/menu tables; customer-facing paths use local catalog images.
3. **About/Contact hero backgrounds:** Static marketing pages may still use external hero URLs; core ordering flows use local assets.
4. **Item reviews on food detail:** Pulled from restaurant reviews (not item-specific) — acceptable for MVP.
5. **Browser extension hydration:** `fdprocessedid` attribute warnings in dev from password-manager extensions are environmental, not app bugs.

## How to Run Locally

```bash
# Backend (port 4000)
cd foodiq-frontend/foodiq-backend
npm run catalog:sync   # if data needs refresh
npm start

# Frontend (port 3000)
cd ../..
npm run dev
```

## Recommended Manual QA

1. Browse `/trending-dishes` → open dish → Add to Cart → checkout → payment
2. Open `/cuisine/burger` → Buy Now on a dish
3. Filter restaurants by Pizza/Biryani slug on `/restaurants`
4. Apply WELCOME50 / FREEDEL on checkout
5. Favorite a restaurant and dish while logged in
6. Search "biryani" — verify restaurants, dishes, and cuisine results
