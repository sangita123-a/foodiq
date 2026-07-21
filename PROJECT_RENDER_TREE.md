# Foodiq — Project Render Tree

> **Generated:** 2026-07-21 · Read-only architecture audit  
> **Purpose:** Map what localhost actually renders. Edit only files marked **SAFE TO EDIT**.

---

## Global Bootstrap (Every Route)

| Layer | File | Status | Notes |
|-------|------|--------|-------|
| Entry | `next dev` → App Router | ACTIVE | Turbopack dev server |
| Root layout | `app/layout.tsx` | **SAFE TO EDIT** | Font, metadata, JSON-LD, providers |
| Global CSS | `app/globals.css` | **SAFE TO EDIT** | Tailwind v4 `@theme`, design tokens |
| Providers | `app/providers.tsx` | ACTIVE | Toast, SWR, SiteSettings, PWA, auth bootstrap |
| Theme runtime | `contexts/SiteSettingsContext.tsx` | **SAFE TO EDIT** | Overrides `--color-primary` from API when non-default |
| Theme defaults | `lib/siteSettings.ts` | ACTIVE | `theme_color: #E23744` |
| Middleware | `middleware.ts` | ACTIVE | Auth gates; no API proxy |
| API proxy | `next.config.ts` → `/backend-api/*` | ACTIVE | Rewrites to `NEXT_PUBLIC_API_URL` (default `localhost:4000`) |
| API client | `services/api.ts` | ACTIVE | Axios + CSRF + token refresh |

### Dynamic / lazy loading (home page)

| Import in `app/page.tsx` | Resolves to | Status |
|--------------------------|-------------|--------|
| Static | `Navbar`, `Hero`, `ClientFloatingCart` | ACTIVE |
| `dynamic()` | `FoodCategoryNav`, `TrendingDishes`, `BestOffers`, `TopBrands`, `FeaturedRestaurant`, `PopularCuisines`, `FeaturedCollections`, `LovedByFoodLovers`, `Features`, `Reviews`, `AppBanner`, `FAQ`, `Footer` | ACTIVE (lazy) |
| `ClientFloatingCart` | `components/performance/ClientFloatingCart.tsx` → `FloatingCart.tsx` | ACTIVE |

---

## Route: `/` — Home

| Field | Value |
|-------|-------|
| **Page** | `app/page.tsx` |
| **Layout** | `app/layout.tsx` only |
| **Status** | **SAFE TO EDIT** |

### Component tree

```
app/page.tsx
├── InternalSeoLinks          → components/seo/InternalSeoLinks.tsx     [ACTIVE]
├── Navbar                    → components/Navbar.tsx                   [SAFE TO EDIT]
├── Hero                      → components/Hero.tsx                   [SAFE TO EDIT]
│   ├── HeroPoster            → components/hero/HeroPoster.tsx         [SAFE TO EDIT]
│   ├── HeroVideoOverlay      → components/hero/HeroVideoOverlay.tsx   [SAFE TO EDIT]
│   └── HeroContent           → components/hero/HeroContent.tsx        [SAFE TO EDIT]
│       └── SearchBar (dynamic)→ components/SearchBar.tsx              [SAFE TO EDIT]
├── ClientFloatingCart        → components/performance/ClientFloatingCart.tsx → FloatingCart.tsx [ACTIVE]
├── FoodiqLiveHub (dynamic)   → components/FoodiqLiveHub.tsx            [SAFE TO EDIT]
├── FoodCategoryNav (dynamic) → components/home/FoodCategoryNav.tsx       [SAFE TO EDIT]
├── TrendingDishes (dynamic)  → components/TrendingDishes.tsx           [SAFE TO EDIT] ★
├── BestOffers (dynamic)      → components/BestOffers.tsx               [SAFE TO EDIT]
├── TopBrands (dynamic)       → components/TopBrands.tsx                [SAFE TO EDIT]
├── FeaturedRestaurant        → components/FeaturedRestaurant.tsx       [SAFE TO EDIT]
├── PopularCuisines           → components/PopularCuisines.tsx          [SAFE TO EDIT]
├── FeaturedCollections       → components/FeaturedCollections.tsx    [SAFE TO EDIT]
├── LovedByFoodLovers         → components/LovedByFoodLovers.tsx        [SAFE TO EDIT]
├── Features                  → components/Features.tsx                 [SAFE TO EDIT]
├── Reviews                   → components/Reviews.tsx                  [SAFE TO EDIT]
├── AppBanner                 → components/AppBanner.tsx                [SAFE TO EDIT]
├── FAQ                       → components/FAQ.tsx                      [SAFE TO EDIT]
└── Footer (dynamic)          → components/Footer.tsx                 [SAFE TO EDIT]
```

### Duplicates on home (IGNORE)

| File | Why duplicate | Use instead |
|------|---------------|-------------|
| `components/DishCard.tsx` | Never imported | Inline `DishCard` inside `TrendingDishes.tsx` |
| `components/TrendingDishesPage.tsx` | Used on `/trending-dishes`, not home | `TrendingDishes.tsx` for home |
| `components/home/PersonalizedHomeRails.tsx` | Never imported | N/A — not rendered |
| `components/ScrollButton.tsx` | Never imported | N/A — not rendered |

---

## Route: `/collections` — Collections index

| Field | Value |
|-------|-------|
| **Page** | `app/collections/page.tsx` |
| **Layout** | `app/collections/layout.tsx` |
| **Status** | **SAFE TO EDIT** |

### Component tree

```
app/collections/page.tsx
├── Navbar                    → components/Navbar.tsx                   [SAFE TO EDIT]
├── RestaurantCard (×N)       → components/RestaurantCard.tsx         [SAFE TO EDIT] ★
└── Footer                    → components/Footer.tsx                   [SAFE TO EDIT]
```

**API:** `GET /api/restaurants?collection={slug}&limit=12`

### Duplicates (IGNORE)

| File | Why |
|------|-----|
| `components/collections/CollectionFoodCard.tsx` | Never imported |
| `components/FeaturedCollections.tsx` | Home only (static data) |

---

## Route: `/collections/[slug]` — Collection detail

| Field | Value |
|-------|-------|
| **Page** | `app/collections/[slug]/page.tsx` |
| **View** | `components/collections/CollectionDetailView.tsx` |
| **Status** | **SAFE TO EDIT** |

### Component tree

```
app/collections/[slug]/page.tsx
└── CollectionDetailView      → components/collections/CollectionDetailView.tsx [SAFE TO EDIT]
    ├── Navbar                → components/Navbar.tsx
    ├── FloatingCart          → components/FloatingCart.tsx
    ├── CollectionRestaurantCard → components/collections/CollectionRestaurantCard.tsx [SAFE TO EDIT]
    ├── CollectionNotFound    → components/collections/CollectionNotFound.tsx (fallback)
    └── Footer                → components/Footer.tsx
```

**Data:** Static from `lib/data/collectionsData.ts` (not live API)

---

## Route: `/order-online` — Restaurants (CANONICAL)

| Field | Value |
|-------|-------|
| **Page** | `app/order-online/page.tsx` |
| **View** | `components/order-online/OrderOnlineView.tsx` |
| **Layout** | `app/order-online/layout.tsx` |
| **Status** | **SAFE TO EDIT** |

### Component tree

```
app/order-online/page.tsx
└── OrderOnlineView           → components/order-online/OrderOnlineView.tsx [SAFE TO EDIT]
    ├── Navbar
    ├── FloatingCart
    ├── CompactSearchBar      → components/CompactSearchBar.tsx           [SAFE TO EDIT]
    ├── RestaurantCard (×N)   → components/RestaurantCard.tsx             [SAFE TO EDIT] ★
    ├── FilterSidebar         → components/FilterSidebar.tsx              [ACTIVE]
    └── Footer
```

### Redirect-only aliases (NOT rendered — SAFE TO IGNORE)

| URL | File | Redirects to |
|-----|------|--------------|
| `/restaurants` | `app/restaurants/page.tsx` | `/order-online` |
| `/popular-restaurants` | `app/popular-restaurants/page.tsx` | `/order-online` |

---

## Route: `/trending-dishes` — Trending full page

| Field | Value |
|-------|-------|
| **Page** | `app/trending-dishes/page.tsx` |
| **View** | `components/TrendingDishesPage.tsx` |
| **Status** | **SAFE TO EDIT** |

### Component tree

```
app/trending-dishes/page.tsx
├── Navbar
├── FloatingCart
├── TrendingDishesPage        → components/TrendingDishesPage.tsx         [SAFE TO EDIT] ★
└── Footer
```

### Duplicate pair

| Context | Active file | Ignore |
|---------|-------------|--------|
| Home section | `components/TrendingDishes.tsx` | `TrendingDishesPage.tsx` |
| Full page | `components/TrendingDishesPage.tsx` | `TrendingDishes.tsx`, `DishCard.tsx` |

Both are rendered on **different routes** — edit the file matching the route you are viewing.

---

## Route: `/offers`

| Field | Value |
|-------|-------|
| **Page** | `app/offers/page.tsx` (inline UI, no separate view component) |
| **Layout** | `app/offers/layout.tsx` |
| **Status** | **SAFE TO EDIT** |
| **Data** | `lib/data/20offersData.ts` |

### Component tree

```
app/offers/page.tsx
├── Navbar
├── Inline offer cards (no child component file)
└── Footer
```

**Related (home only):** `components/BestOffers.tsx` on `/`

---

## Route: `/contact`

| Field | Value |
|-------|-------|
| **Page** | `app/contact/page.tsx` |
| **Layout** | `app/contact/layout.tsx` |
| **Status** | **SAFE TO EDIT** |

### Component tree

```
app/contact/page.tsx
├── Navbar
├── ContactHero               → components/contact/ContactHero.tsx        [SAFE TO EDIT]
├── ContactForm               → components/contact/ContactForm.tsx        [SAFE TO EDIT]
├── ContactInfo               → components/contact/ContactInfo.tsx      [SAFE TO EDIT] ★
│   └── useContactInfo        → hooks/useContactInfo.ts → GET /api/contact
├── QuickContactCards         → components/contact/QuickContactCards.tsx  [SAFE TO EDIT]
├── MapSection                → components/contact/MapSection.tsx       [SAFE TO EDIT]
├── FaqPreview                → components/contact/FaqPreview.tsx         [SAFE TO EDIT]
├── Newsletter                → components/contact/Newsletter.tsx         [SAFE TO EDIT]
└── Footer
```

### Duplicate ContactInfo (different routes)

| File | Route | Status |
|------|-------|--------|
| `components/contact/ContactInfo.tsx` | `/contact` | **SAFE TO EDIT** |
| `components/support/ContactInfo.tsx` | `/help-support` | ACTIVE (different page) |

---

## Route: `/login`

| Field | Value |
|-------|-------|
| **Page** | `app/login/page.tsx` (self-contained form) |
| **Layout** | `app/login/layout.tsx` |
| **Status** | **SAFE TO EDIT** |
| **No Navbar/Footer** | Standalone auth page |

---

## Route: `/register`

| Field | Value |
|-------|-------|
| **Page** | `app/register/page.tsx` (self-contained form) |
| **Layout** | `app/register/layout.tsx` |
| **Status** | **SAFE TO EDIT** |

---

## Route: `/profile`

| Field | Value |
|-------|-------|
| **Page** | `app/profile/page.tsx` |
| **Layout** | `app/profile/layout.tsx` |
| **Middleware** | Protected (requires session) |
| **Status** | **SAFE TO EDIT** |

### Component tree

```
app/profile/page.tsx
├── Navbar
├── ProfileSidebar            → components/profile/ProfileSidebar.tsx     [SAFE TO EDIT]
├── Tab panels:
│   ├── DashboardOverview     → components/profile/DashboardOverview.tsx [SAFE TO EDIT] ★ dashboard
│   ├── MyOrdersList          → components/profile/MyOrdersList.tsx
│   ├── WishlistPanel         → components/profile/WishlistPanel.tsx
│   ├── SavedAddresses        → components/profile/SavedAddresses.tsx
│   ├── PaymentMethodsPanel   → components/profile/PaymentMethodsPanel.tsx
│   ├── CouponsList           → components/profile/CouponsList.tsx
│   ├── NotificationsPanel    → components/profile/NotificationsPanel.tsx
│   ├── AccountSettingsPanel  → components/profile/AccountSettingsPanel.tsx
│   ├── PrivacyPanel          → components/profile/PrivacyPanel.tsx
│   └── SecurityPanel         → components/profile/SecurityPanel.tsx
└── Footer
```

---

## Route: `/cart`

| Field | Value |
|-------|-------|
| **Page** | `app/cart/page.tsx` |
| **Layout** | `app/cart/layout.tsx` |
| **Middleware** | Protected |
| **Status** | **SAFE TO EDIT** |

### Component tree

```
app/cart/page.tsx
├── Navbar
├── CartItemCard              → components/cart/CartItemCard.tsx          [SAFE TO EDIT]
├── OrderSummary              → components/cart/OrderSummary.tsx          [SAFE TO EDIT]
├── EmptyCart                 → components/cart/EmptyCart.tsx           [ACTIVE]
├── SuggestedItems            → components/cart/SuggestedItems.tsx        [ACTIVE]
└── Footer
```

---

## Route: `/checkout`

| Field | Value |
|-------|-------|
| **Page** | `app/checkout/page.tsx` |
| **Layout** | `app/checkout/layout.tsx` |
| **Middleware** | Protected |
| **Status** | **SAFE TO EDIT** |

### Component tree

```
app/checkout/page.tsx
├── Navbar
├── DeliveryAddressSection    → components/checkout/DeliveryAddressSection.tsx
├── DeliveryTimeSection       → components/checkout/DeliveryTimeSection.tsx
├── PromoCodeSection          → components/checkout/PromoCodeSection.tsx
├── WalletCheckoutSection     → components/checkout/WalletCheckoutSection.tsx
├── DeliveryInstructionsSection
├── PaymentMethodsSection     → components/checkout/PaymentMethodsSection.tsx
├── CheckoutSummary           → components/checkout/CheckoutSummary.tsx   [SAFE TO EDIT]
└── Footer
```

---

## Verified Core Files (Confirmed Active on Localhost)

| File | Confirmed | Rendered on |
|------|-----------|-------------|
| `app/page.tsx` | ✅ | `/` |
| `app/layout.tsx` | ✅ | All routes |
| `app/globals.css` | ✅ | All routes |
| `components/Hero.tsx` | ✅ | `/` |
| `components/TrendingDishes.tsx` | ✅ | `/` (dynamic section) |
| `components/SearchBar.tsx` | ✅ | `/` via HeroContent |
| `components/RestaurantCard.tsx` | ✅ | `/collections`, `/order-online`, `/search` |
| `app/collections/page.tsx` | ✅ | `/collections` |
| `components/contact/*` | ✅ | `/contact` |
| `components/Navbar.tsx` | ✅ | ~51 routes |
| `components/Footer.tsx` | ✅ | ~51 routes |

---

## UNUSED Files (Safe to Ignore — Edits Have No Visible Effect)

| File | Reason |
|------|--------|
| `components/ScrollButton.tsx` | Zero imports |
| `components/DishCard.tsx` | Zero imports; home uses inline card in `TrendingDishes.tsx` |
| `components/CategoryFilter.tsx` | Zero imports |
| `components/FoodRecommendation.tsx` | Zero imports |
| `components/home/PersonalizedHomeRails.tsx` | Not in `app/page.tsx` |
| `components/collections/CollectionFoodCard.tsx` | Zero imports |
| `components/performance/HomeCriticalPreloads.tsx` | Deprecated; preload in `app/layout.tsx` |
| `components/tracking/LiveMapPlaceholder.tsx` | Zero imports |
| `lib/i18n/index.ts` | Zero imports |

---

## DUPLICATE Files (Keep Canonical Only)

| Canonical (edit this) | Duplicate / alias (ignore) | Notes |
|------------------------|------------------------------|-------|
| `app/order-online/page.tsx` | `app/restaurants/page.tsx`, `app/popular-restaurants/page.tsx` | 308 redirects |
| `app/help-support/page.tsx` | `app/help-center/page.tsx`, `app/support/page.tsx` | 308 redirects |
| `components/TrendingDishes.tsx` | `components/DishCard.tsx` | Home trending cards |
| `components/TrendingDishesPage.tsx` | Inline cards in `TrendingDishes.tsx` | Full page only |
| `components/contact/ContactInfo.tsx` | `components/support/ContactInfo.tsx` | Different routes |
| `components/SearchBar.tsx` | `components/CompactSearchBar.tsx` | Hero vs order-online |
| `components/RestaurantCard.tsx` | `CollectionRestaurantCard`, `FavRestaurantCard` | Context-specific variants |
| `components/FloatingCart.tsx` | `ClientFloatingCart.tsx` | Wrapper for home lazy load |

---

## Redirect-Only Pages (Code Exists, Never Seen on Localhost)

| File | Redirect target |
|------|-----------------|
| `app/restaurants/page.tsx` | `/order-online` |
| `app/popular-restaurants/page.tsx` | `/order-online` |
| `app/help-center/page.tsx` | `/help-support` (next.config 308) |
| `app/support/page.tsx` | `/help-support` |
| `app/orders/page.tsx` | `/my-orders` |
| `app/order-tracking/page.tsx` | `/track-order` |
| `app/profile/edit/page.tsx` | `/settings` |

---

## API & Backend Connection

```
Browser (localhost:3000)
  → services/api.ts baseURL: /backend-api
  → next.config.ts rewrite
  → http://localhost:4000 (from .env.local NEXT_PUBLIC_API_URL)
  → foodiq-frontend/foodiq-backend/server.js
```

| Check | Expected |
|-------|----------|
| `.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:4000` |
| Backend running | Port 4000 (EADDRINUSE = already running) |
| Dev frontend | `http://localhost:3000` (preferred single instance) |

---

## Issues That Prevent UI Updates from Reflecting

| Issue | Impact | Mitigation |
|-------|--------|------------|
| **Editing unused files** | No visible change | Use this doc; edit **SAFE TO EDIT** only |
| **Wrong duplicate** | Change on wrong route | Match URL to file in render tree |
| **SiteSettingsContext inline CSS** | Overrides `--color-primary` from API | Fixed: skips override when theme is default |
| **Hardcoded `#E23744` in components** | Ignores `globals.css` tokens | Edit the specific component file |
| **Multiple dev servers** | Viewing stale port (3000 vs 3003) | Use one `npm run dev` on 3000 |
| **Dynamic imports on home** | HMR delay | Hard refresh after CSS changes |
| **Redirect-only routes** | Page never renders | Edit canonical URL |

---

## SAFE TO EDIT — Master List (Customer UI)

```
app/globals.css
app/layout.tsx
app/page.tsx

components/Navbar.tsx
components/Footer.tsx
components/Hero.tsx
components/hero/HeroContent.tsx
components/hero/HeroPoster.tsx
components/hero/HeroVideoOverlay.tsx
components/SearchBar.tsx
components/CompactSearchBar.tsx

components/TrendingDishes.tsx          ← home /
components/TrendingDishesPage.tsx      ← /trending-dishes
components/BestOffers.tsx
components/FeaturedRestaurant.tsx
components/FeaturedCollections.tsx
components/TopBrands.tsx
components/PopularCuisines.tsx
components/LovedByFoodLovers.tsx
components/FoodiqLiveHub.tsx
components/Features.tsx
components/Reviews.tsx
components/AppBanner.tsx
components/FAQ.tsx
components/RestaurantCard.tsx

app/order-online/page.tsx
components/order-online/OrderOnlineView.tsx

app/collections/page.tsx
app/collections/[slug]/page.tsx
components/collections/CollectionDetailView.tsx
components/collections/CollectionRestaurantCard.tsx

app/offers/page.tsx
app/contact/page.tsx
components/contact/*

app/login/page.tsx
app/register/page.tsx

app/profile/page.tsx
components/profile/ProfileSidebar.tsx
components/profile/DashboardOverview.tsx

app/cart/page.tsx
app/checkout/page.tsx
components/cart/*
components/checkout/*

contexts/SiteSettingsContext.tsx
lib/siteSettings.ts
lib/images.ts
components/ui/SafeImage.tsx
```

---

## SAFE TO IGNORE — Never Edit for Visible UI

```
components/ScrollButton.tsx
components/DishCard.tsx
components/CategoryFilter.tsx
components/FoodRecommendation.tsx
components/home/PersonalizedHomeRails.tsx
components/collections/CollectionFoodCard.tsx
components/performance/HomeCriticalPreloads.tsx
components/tracking/LiveMapPlaceholder.tsx
app/restaurants/page.tsx
app/popular-restaurants/page.tsx
app/help-center/page.tsx
components/help-center/*   (redirect-only route)
lib/i18n/index.ts
```

---

*Future edits to files marked **SAFE TO EDIT** will affect the visible website on localhost.*
