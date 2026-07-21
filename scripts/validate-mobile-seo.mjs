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

const globals = read("app/globals.css");
const layout = read("app/layout.tsx");
const page = read("app/page.tsx");
const navbar = read("components/Navbar.tsx");
const searchBar = read("components/SearchBar.tsx");
const loved = read("components/LovedByFoodLovers.tsx");
const categoryNav = read("components/home/FoodCategoryNav.tsx");
const trending = read("components/TrendingDishes.tsx");

assert("Viewport allows device-width scaling", layout.includes('width: "device-width"'));
assert("Viewport preserves pinch zoom", layout.includes("maximumScale: 5"));
assert("Safe area utilities exist", globals.includes(".safe-top") && globals.includes(".safe-bottom"));
assert("Touch target utility exists", globals.includes(".touch-target"));
assert("Touch target expand utility exists", globals.includes(".touch-target-expand"));
assert("Carousel control touch utility exists", globals.includes(".carousel-control"));
assert(
  "Mobile inputs use 16px to prevent iOS zoom",
  globals.includes("font-size: 16px") && globals.includes('input[type="search"]')
);
assert(
  "Mobile section spacing uses responsive clamp",
  globals.includes("padding-block: clamp(28px")
);
assert(
  "LCP hero poster preloaded in document head",
  layout.includes('rel="preload"') &&
    layout.includes("as=\"image\"") &&
    layout.includes("HERO_POSTER_WEBP")
);
assert("Homepage does not preload LCP from body", !page.includes("HomeCriticalPreloads"));
assert("Navbar mobile menu uses touch-target", navbar.includes("md:hidden touch-target"));
assert("Navbar mobile actions are 44px", navbar.includes("h-11 w-11"));
assert("SearchBar input uses 16px on mobile", searchBar.includes("text-base sm:text-[16px]"));
assert(
  "LovedByFoodLovers carousel controls use carousel-control",
  loved.includes("carousel-control")
);
assert(
  "FoodCategoryNav avoids competing LCP priority images",
  !categoryNav.includes("priority={")
);
assert(
  "TrendingDishes interactive controls meet touch target",
  trending.includes("touch-target") && trending.includes("touch-target-expand")
);

const failures = checks.filter((check) => !check.pass);
for (const check of checks) {
  const status = check.pass ? "OK" : "FAIL";
  const detail = check.detail ? ` (${check.detail})` : "";
  console.log(`${check.label}: ${status}${detail}`);
}

if (failures.length > 0) {
  process.exit(1);
}

console.log("Mobile SEO guardrails validation passed.");
