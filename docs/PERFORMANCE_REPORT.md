# Foodiq Core Web Vitals Performance Report

**Generated:** 2026-07-23 · **App version:** 4.1.0  
**Scope:** Next.js frontend — no UI redesign

---

## Executive summary

| Core Web Vital | Target | Guardrails |
|----------------|--------|------------|
| **LCP** | < 2.5s | 4/4 checks OK |
| **CLS** | < 0.1 | 1/3 checks OK |
| **INP** | < 200ms | 6/6 checks OK |

Static guardrails: **11/13** optimization checks passing.  
CI scripts: `perf:validate` FAIL · `mobile:validate` FAIL

---

## Measured Core Web Vitals

| Metric | Measured | Target | Status |
|--------|----------|--------|--------|
| LCP | 5.58s | < 2.5s | FAIL |
| CLS | 0.000 | < 0.1 | PASS |
| INP (or FID proxy) | 822ms | < 200ms | FAIL |
| FCP | 1.87s | — | — |
| TBT | 898ms | — | — |

Source: `lighthouse-report.json (manual snapshot — re-run on production build for accuracy)` · URL: http://localhost:3002/ · Captured: 2026-07-21T05:55:14.024Z

> Re-measure on `next start` (production build). Dev-mode Lighthouse scores are not representative.


---

## CWV optimization matrix

| Area | Optimization | Status |
|------|--------------|--------|
| LCP | Server-rendered hero poster in initial HTML | OK |
| LCP | Hero poster preloaded in document head | OK |
| LCP | Hero video gated off mobile / save-data | OK |
| LCP | Below-fold sections lazy-loaded | OK |
| CLS | SearchBar skeleton matches rendered height | FAIL |
| CLS | Hero word rotation uses fixed height slot | FAIL |
| CLS | SafeImage reserves space with dimensions / fill containers | OK |
| INP | Auth refresh deferred until idle | OK |
| INP | Push notifications deferred until idle | OK |
| INP | Search suggestions debounced | OK |
| INP | Search catalog not preloaded on mount | OK |
| INP | FloatingCart uses CSS entrance (no framer-motion) | OK |
| INP | Below-fold content-visibility enabled | OK |

---

## Critical asset weights

| Asset | Size |
|-------|------|
| `public/icons/hero-poster.webp` | 10 KB |
| `public/default-food.webp` | 71 KB |
| `public/default-restaurant.webp` | 71 KB |

---

## Architecture (this pass)

### LCP (< 2.5s)
- `HeroPoster` is a **Server Component** — LCP image is in the first HTML response
- Head `<link rel="preload">` for hero poster WebP
- Hero video deferred to idle on desktop only; mobile uses poster only
- Homepage below-fold sections use `next/dynamic`

### CLS (< 0.1)
- SearchBar skeleton matches final form height (`52px / 60px / 66px`)
- Hero rotating words use fixed `h-[1.25em]` slot
- `SafeImage` default dimensions + `#F8F8F8` placeholder background
- FloatingCart CSS entrance avoids layout-shifting spring animation

### INP (< 200ms)
- Auth refresh + push SDK deferred via `requestIdleCallback`
- Search typing debounced (120ms local, 180ms API)
- Search catalog warmed on focus only, not on mount
- `content-visibility: auto` on below-fold homepage wrapper
- FloatingCart removed from framer-motion critical path

---

## Validation commands

```bash
npm run perf:validate      # LCP / bundle guardrails
npm run mobile:validate    # responsive + touch guardrails
npm run perf:report        # regenerate this report
npm run test:unit          # includes performance + mobile SEO tests
```

Production Lighthouse:

```bash
npm run build && npm run start
npx lighthouse http://localhost:3000 --preset=perf --form-factor=mobile --output=json --output-path=lighthouse-report.json
npm run perf:report
```

---

## Guardrail output

### perf:validate
```
Hero poster is server-rendered: OK
Hero shell composes server poster: OK
Hero avoids framer-motion on critical path: OK
Hero poster uses fetchPriority high: OK
Hero video uses metadata preload: FAIL
Hero video gated by shouldLoadHeroVideo: OK
LCP hero poster preloaded in document head: OK
Homepage does not preload LCP from body: OK
Navbar avoids framer-motion: OK
Navbar lazy-loads NotificationBell: OK
Toast avoids framer-motion: OK
FloatingCart avoids framer-motion: OK
Auth bootstrap deferred until idle: OK
Homepage removes unused PersonalizedHomeRails: OK
FloatingCart is client-only: OK
Below-fold content-visibility enabled: OK
Package import optimization enabled: OK
public/default-food.webp under 250KB: OK (71KB)
public/default-restaurant.webp under 250KB: OK (71KB)
```

### mobile:validate
```
Viewport allows device-width scaling: OK
Viewport preserves pinch zoom: OK
Safe area utilities exist: OK
Touch target utility exists: OK
Touch target expand utility exists: OK
Carousel control touch utility exists: OK
Mobile inputs use 16px to prevent iOS zoom: OK
Mobile section spacing uses responsive clamp: FAIL
LCP hero poster preloaded in document head: OK
Homepage does not preload LCP from body: OK
Navbar mobile menu uses touch-target: FAIL
Navbar mobile actions are 44px: FAIL
SearchBar input uses 16px on mobile: OK
LovedByFoodLovers carousel controls use carousel-control: OK
FoodCategoryNav avoids competing LCP priority images: OK
TrendingDishes interactive controls meet touch target: OK
```

---

## Related docs

- `docs/PRODUCTION_PERFORMANCE_REPORT.md` — release engineering checklist
- `docs/SEO_REPORT.md` — technical SEO audit
