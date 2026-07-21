import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(label, pass, detail) {
  checks.push({ label, pass, detail });
}

const heroPoster = read("components/hero/HeroPoster.tsx");
const heroVideo = read("components/hero/HeroVideoOverlay.tsx");
const hero = read("components/Hero.tsx");
const layout = read("app/layout.tsx");
const page = read("app/page.tsx");
const navbar = read("components/Navbar.tsx");
const toast = read("contexts/ToastContext.tsx");
const floatingCart = read("components/FloatingCart.tsx");
const providers = read("app/providers.tsx");
const nextConfig = read("next.config.ts");

assert("Hero poster is server-rendered", !heroPoster.includes('"use client"'));
assert("Hero shell composes server poster", hero.includes("HeroPoster"));
assert("Hero avoids framer-motion on critical path", !hero.includes("framer-motion"));
assert("Hero poster uses fetchPriority high", heroPoster.includes('fetchPriority="high"'));
assert("Hero video uses metadata preload", heroVideo.includes('preload="metadata"'));
assert("Hero video gated by shouldLoadHeroVideo", heroVideo.includes("shouldLoadHeroVideo"));
assert(
  "LCP hero poster preloaded in document head",
  layout.includes('rel="preload"') && layout.includes("HERO_POSTER_WEBP")
);
assert("Homepage does not preload LCP from body", !page.includes("HomeCriticalPreloads"));
assert("Navbar avoids framer-motion", !navbar.includes("framer-motion"));
assert(
  "Navbar lazy-loads NotificationBell",
  navbar.includes("dynamic(") && navbar.includes("NotificationBell")
);
assert("Toast avoids framer-motion", !toast.includes("framer-motion"));
assert("FloatingCart avoids framer-motion", !floatingCart.includes("framer-motion"));
assert("Auth bootstrap deferred until idle", providers.includes("DeferredAuthBootstrap"));
assert("Homepage removes unused PersonalizedHomeRails", !page.includes("PersonalizedHomeRails"));
assert(
  "FloatingCart is client-only",
  page.includes("ssr: false") || page.includes("ClientFloatingCart")
);
assert("Below-fold content-visibility enabled", page.includes("cvw-defer-section"));
assert("Package import optimization enabled", nextConfig.includes("optimizePackageImports"));

const placeholderMaxBytes = 250 * 1024;
for (const file of ["public/default-food.webp", "public/default-restaurant.webp"]) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) {
    const size = fs.statSync(full).size;
    assert(`${file} under 250KB`, size <= placeholderMaxBytes, `${Math.round(size / 1024)}KB`);
  }
}

const failures = checks.filter((check) => !check.pass);
for (const check of checks) {
  const status = check.pass ? "OK" : "FAIL";
  const detail = check.detail ? ` (${check.detail})` : "";
  console.log(`${check.label}: ${status}${detail}`);
}

if (failures.length > 0) {
  process.exit(1);
}

console.log("Performance guardrails validation passed.");
