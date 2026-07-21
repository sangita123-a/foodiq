/**
 * Validates robots.txt crawl rules and sitemap.xml public route coverage.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function runTechnicalSeoValidation() {
  const script = path.join(root, "scripts", "validate-technical-seo.mjs");
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
        "Technical SEO validation script failed"
    );
  }

  return result.stdout.trim();
}

describe("Technical SEO", () => {
  it("validates robots.txt crawl rules and sitemap route coverage", () => {
    runTechnicalSeoValidation();
  });

  it("generates robots.txt via the App Router metadata route", async () => {
    const { readFileSync } = await import("node:fs");
    const robots = readFileSync(path.join(root, "app", "robots.ts"), "utf8");
    assert.match(robots, /buildRobotsConfig/);
  });

  it("generates sitemap.xml via the App Router metadata route", async () => {
    const { readFileSync } = await import("node:fs");
    const sitemap = readFileSync(path.join(root, "app", "sitemap.ts"), "utf8");
    assert.match(sitemap, /buildFullSitemapEntries/);
  });
});
