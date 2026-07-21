import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "docs", "PERFORMANCE_REPORT.md");

const CWV_TARGETS = {
  LCP: { label: "Largest Contentful Paint", target: 2500, unit: "ms", good: "< 2.5s" },
  CLS: { label: "Cumulative Layout Shift", target: 0.1, unit: "score", good: "< 0.1" },
  INP: { label: "Interaction to Next Paint", target: 200, unit: "ms", good: "< 200ms" },
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fileSizeKb(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) return null;
  return Math.round(fs.statSync(full).size / 1024);
}

function runScript(relativePath) {
  const script = path.join(root, relativePath);
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
  });
  return {
    ok: result.status === 0,
    output: (result.stdout || result.stderr || "").trim(),
  };
}

function parseLighthouseMetrics() {
  const lighthousePath = path.join(root, "lighthouse-report.json");
  if (!fs.existsSync(lighthousePath)) {
    return null;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(lighthousePath, "utf8"));
    const audits = raw.audits || {};
    const pick = (id) => audits[id]?.numericValue ?? audits[id]?.displayValue ?? null;

    return {
      source: "lighthouse-report.json (manual snapshot — re-run on production build for accuracy)",
      generated: raw.fetchTime || raw.generatedTime || "unknown",
      url: raw.finalUrl || raw.requestedUrl || "unknown",
      lcpMs: pick("largest-contentful-paint"),
      cls: pick("cumulative-layout-shift"),
      inpMs: pick("interaction-to-next-paint") ?? pick("max-potential-fid"),
      fcpMs: pick("first-contentful-paint"),
      tbtMs: pick("total-blocking-time"),
    };
  } catch {
    return null;
  }
}

function statusForMetric(name, value) {
  if (value == null) return "—";
  const target = CWV_TARGETS[name].target;
  if (name === "CLS") return value <= target ? "PASS" : "FAIL";
  return value <= target ? "PASS" : "FAIL";
}

function formatMetric(name, value) {
  if (value == null) return "—";
  if (name === "CLS") return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

function collectGuardrails() {
  const perf = runScript("scripts/validate-performance.mjs");
  const mobile = runScript("scripts/validate-mobile-seo.mjs");
  return { perf, mobile };
}

function collectOptimizations() {
  const heroPoster = read("components/hero/HeroPoster.tsx");
  const hero = read("components/Hero.tsx");
  const heroVideo = read("components/hero/HeroVideoOverlay.tsx");
  const layout = read("app/layout.tsx");
  const page = read("app/page.tsx");
  const providers = read("app/providers.tsx");
  const searchBar = read("components/SearchBar.tsx");
  const floatingCart = read("components/FloatingCart.tsx");
  const globals = read("app/globals.css");

  return [
    {
      area: "LCP",
      item: "Server-rendered hero poster in initial HTML",
      status: !heroPoster.includes('"use client"') && hero.includes("HeroPoster") ? "OK" : "FAIL",
    },
    {
      area: "LCP",
      item: "Hero poster preloaded in document head",
      status: layout.includes('rel="preload"') && layout.includes("HERO_POSTER_WEBP") ? "OK" : "FAIL",
    },
    {
      area: "LCP",
      item: "Hero video gated off mobile / save-data",
      status: heroVideo.includes("shouldLoadHeroVideo") ? "OK" : "FAIL",
    },
    {
      area: "LCP",
      item: "Below-fold sections lazy-loaded",
      status: page.includes("next/dynamic") ? "OK" : "FAIL",
    },
    {
      area: "CLS",
      item: "SearchBar skeleton matches rendered height",
      status: read("components/hero/HeroContent.tsx").includes("h-[52px] sm:h-[60px]") ? "OK" : "FAIL",
    },
    {
      area: "CLS",
      item: "Hero word rotation uses fixed height slot",
      status: read("components/hero/HeroContent.tsx").includes("h-[1.25em]") ? "OK" : "FAIL",
    },
    {
      area: "CLS",
      item: "SafeImage reserves space with dimensions / fill containers",
      status: read("components/ui/SafeImage.tsx").includes("DEFAULT_DIMENSIONS") ? "OK" : "FAIL",
    },
    {
      area: "INP",
      item: "Auth refresh deferred until idle",
      status: providers.includes("DeferredAuthBootstrap") ? "OK" : "FAIL",
    },
    {
      area: "INP",
      item: "Push notifications deferred until idle",
      status: providers.includes("DeferredPushNotificationProvider") ? "OK" : "FAIL",
    },
    {
      area: "INP",
      item: "Search suggestions debounced",
      status: searchBar.includes("debounceId") ? "OK" : "FAIL",
    },
    {
      area: "INP",
      item: "Search catalog not preloaded on mount",
      status: !searchBar.includes("requestIdleCallback") && !searchBar.includes("warmCatalog") ? "OK" : "FAIL",
    },
    {
      area: "INP",
      item: "FloatingCart uses CSS entrance (no framer-motion)",
      status: !floatingCart.includes("framer-motion") ? "OK" : "FAIL",
    },
    {
      area: "INP",
      item: "Below-fold content-visibility enabled",
      status: globals.includes(".cvw-defer-section") && page.includes("cvw-defer-section") ? "OK" : "FAIL",
    },
  ];
}

function buildReport() {
  const now = new Date().toISOString().slice(0, 10);
  const pkg = JSON.parse(read("package.json"));
  const guardrails = collectGuardrails();
  const optimizations = collectOptimizations();
  const lighthouse = parseLighthouseMetrics();

  const heroPosterKb = fileSizeKb("public/icons/hero-poster.webp");
  const defaultFoodKb = fileSizeKb("public/default-food.webp");
  const defaultRestaurantKb = fileSizeKb("public/default-restaurant.webp");

  const optPass = optimizations.filter((o) => o.status === "OK").length;
  const optTotal = optimizations.length;

  let lighthouseSection = `No Lighthouse snapshot found. Run a production audit:

\`\`\`bash
npm run build && npm run start
npx lighthouse http://localhost:3000 --preset=perf --form-factor=mobile --output=json --output-path=lighthouse-report.json
npm run perf:report
\`\`\`
`;

  if (lighthouse) {
    lighthouseSection = `| Metric | Measured | Target | Status |
|--------|----------|--------|--------|
| LCP | ${formatMetric("LCP", lighthouse.lcpMs)} | ${CWV_TARGETS.LCP.good} | ${statusForMetric("LCP", lighthouse.lcpMs)} |
| CLS | ${formatMetric("CLS", lighthouse.cls)} | ${CWV_TARGETS.CLS.good} | ${statusForMetric("CLS", lighthouse.cls)} |
| INP (or FID proxy) | ${formatMetric("INP", lighthouse.inpMs)} | ${CWV_TARGETS.INP.good} | ${statusForMetric("INP", lighthouse.inpMs)} |
| FCP | ${formatMetric("LCP", lighthouse.fcpMs)} | — | — |
| TBT | ${formatMetric("INP", lighthouse.tbtMs)} | — | — |

Source: \`${lighthouse.source}\` · URL: ${lighthouse.url} · Captured: ${lighthouse.generated}

> Re-measure on \`next start\` (production build). Dev-mode Lighthouse scores are not representative.
`;
  }

  const report = `# Foodiq Core Web Vitals Performance Report

**Generated:** ${now} · **App version:** ${pkg.version}  
**Scope:** Next.js frontend — no UI redesign

---

## Executive summary

| Core Web Vital | Target | Guardrails |
|----------------|--------|------------|
| **LCP** | ${CWV_TARGETS.LCP.good} | ${optimizations.filter((o) => o.area === "LCP" && o.status === "OK").length}/${optimizations.filter((o) => o.area === "LCP").length} checks OK |
| **CLS** | ${CWV_TARGETS.CLS.good} | ${optimizations.filter((o) => o.area === "CLS" && o.status === "OK").length}/${optimizations.filter((o) => o.area === "CLS").length} checks OK |
| **INP** | ${CWV_TARGETS.INP.good} | ${optimizations.filter((o) => o.area === "INP" && o.status === "OK").length}/${optimizations.filter((o) => o.area === "INP").length} checks OK |

Static guardrails: **${optPass}/${optTotal}** optimization checks passing.  
CI scripts: \`perf:validate\` ${guardrails.perf.ok ? "PASS" : "FAIL"} · \`mobile:validate\` ${guardrails.mobile.ok ? "PASS" : "FAIL"}

---

## Measured Core Web Vitals

${lighthouseSection}

---

## CWV optimization matrix

| Area | Optimization | Status |
|------|--------------|--------|
${optimizations.map((o) => `| ${o.area} | ${o.item} | ${o.status} |`).join("\n")}

---

## Critical asset weights

| Asset | Size |
|-------|------|
| \`public/icons/hero-poster.webp\` | ${heroPosterKb != null ? `${heroPosterKb} KB` : "missing"} |
| \`public/default-food.webp\` | ${defaultFoodKb != null ? `${defaultFoodKb} KB` : "missing"} |
| \`public/default-restaurant.webp\` | ${defaultRestaurantKb != null ? `${defaultRestaurantKb} KB` : "missing"} |

---

## Architecture (this pass)

### LCP (< 2.5s)
- \`HeroPoster\` is a **Server Component** — LCP image is in the first HTML response
- Head \`<link rel="preload">\` for hero poster WebP
- Hero video deferred to idle on desktop only; mobile uses poster only
- Homepage below-fold sections use \`next/dynamic\`

### CLS (< 0.1)
- SearchBar skeleton matches final form height (\`52px / 60px / 66px\`)
- Hero rotating words use fixed \`h-[1.25em]\` slot
- \`SafeImage\` default dimensions + \`#F8F8F8\` placeholder background
- FloatingCart CSS entrance avoids layout-shifting spring animation

### INP (< 200ms)
- Auth refresh + push SDK deferred via \`requestIdleCallback\`
- Search typing debounced (120ms local, 180ms API)
- Search catalog warmed on focus only, not on mount
- \`content-visibility: auto\` on below-fold homepage wrapper
- FloatingCart removed from framer-motion critical path

---

## Validation commands

\`\`\`bash
npm run perf:validate      # LCP / bundle guardrails
npm run mobile:validate    # responsive + touch guardrails
npm run perf:report        # regenerate this report
npm run test:unit          # includes performance + mobile SEO tests
\`\`\`

Production Lighthouse:

\`\`\`bash
npm run build && npm run start
npx lighthouse http://localhost:3000 --preset=perf --form-factor=mobile --output=json --output-path=lighthouse-report.json
npm run perf:report
\`\`\`

---

## Guardrail output

### perf:validate
\`\`\`
${guardrails.perf.output || "(not run)"}
\`\`\`

### mobile:validate
\`\`\`
${guardrails.mobile.output || "(not run)"}
\`\`\`

---

## Related docs

- \`docs/PRODUCTION_PERFORMANCE_REPORT.md\` — release engineering checklist
- \`docs/SEO_REPORT.md\` — technical SEO audit
`;

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");
  console.log(`Performance report written to ${path.relative(root, reportPath)}`);
}

buildReport();
