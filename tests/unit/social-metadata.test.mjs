/**
 * Validates Open Graph, Twitter, Facebook, and LinkedIn social metadata.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function runSocialMetadataValidation() {
  const script = path.join(root, "scripts", "validate-social-metadata.mjs");
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
        "Social metadata validation script failed"
    );
  }

  return result.stdout.trim();
}

describe("Social SEO metadata", () => {
  it("validates Open Graph, Twitter, Facebook, and LinkedIn metadata", () => {
    runSocialMetadataValidation();
  });

  it("builds dynamic social image URLs for landing pages", async () => {
    const { readFileSync } = await import("node:fs");
    const metadata = readFileSync(path.join(root, "lib", "seo", "metadata.ts"), "utf8");
    assert.match(metadata, /resolveSocialPreviewImageUrl/);
    assert.match(metadata, /summary_large_image/);
    assert.match(metadata, /og:image:width/);
  });

  it("generates route-based Open Graph images for entity pages", async () => {
    const { readFileSync } = await import("node:fs");
    const foodOg = readFileSync(
      path.join(root, "app", "food", "[id]", "opengraph-image.tsx"),
      "utf8"
    );
    assert.match(foodOg, /createSocialImageResponse/);
  });
});
