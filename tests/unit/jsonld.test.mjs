/**
 * Validates Schema.org JSON-LD builders for Organization, WebSite, LocalBusiness,
 * Restaurant, BreadcrumbList, SearchAction, and Product.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function runJsonLdValidation() {
  const script = path.join(root, "scripts", "validate-jsonld.mjs");
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL:
        process.env.NEXT_PUBLIC_SITE_URL || "https://foodiq-ecru.vercel.app",
    },
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() ||
        result.stdout?.trim() ||
        "JSON-LD validation script failed"
    );
  }

  return result.stdout.trim();
}

describe("JSON-LD structured data", () => {
  it("validates all required Schema.org builders", () => {
    runJsonLdValidation();
  });

  it("injects JSON-LD via the Next.js JsonLd component", async () => {
    const { readFileSync } = await import("node:fs");
    const component = readFileSync(
      path.join(root, "components", "seo", "JsonLd.tsx"),
      "utf8"
    );
    assert.match(component, /application\/ld\+json/);
    assert.match(component, /dangerouslySetInnerHTML/);
  });

  it("declares site-wide schemas in the root layout", async () => {
    const { readFileSync } = await import("node:fs");
    const layout = readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
    assert.match(layout, /organizationJsonLd\(\)/);
    assert.match(layout, /websiteJsonLd\(\)/);
    assert.match(layout, /localBusinessJsonLd\(\)/);
  });

  it("embeds SearchAction inside the WebSite schema", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(path.join(root, "lib", "seo", "jsonld.ts"), "utf8");
    assert.match(source, /potentialAction:\s*searchActionJsonLd\(\)/);
    assert.match(source, /urlTemplate:.*search_term_string/s);
  });

  it("declares Product schema on dish pages", async () => {
    const { readFileSync } = await import("node:fs");
    const page = readFileSync(path.join(root, "app", "food", "[id]", "page.tsx"), "utf8");
    assert.match(page, /productJsonLd\(/);
    assert.match(page, /breadcrumbJsonLd\(/);
  });

  it("declares Restaurant schema on restaurant pages", async () => {
    const { readFileSync } = await import("node:fs");
    const layout = readFileSync(
      path.join(root, "app", "restaurant", "[id]", "layout.tsx"),
      "utf8"
    );
    assert.match(layout, /restaurantJsonLd\(/);
    assert.match(layout, /breadcrumbJsonLd\(/);
  });
});
