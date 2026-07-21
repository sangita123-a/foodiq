/**
 * Validates mobile SEO guardrails: responsive layout, touch targets, navigation, typography.
 */
import { describe, it } from "node:test";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function runMobileSeoValidation() {
  const script = path.join(root, "scripts", "validate-mobile-seo.mjs");
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() ||
        result.stdout?.trim() ||
        "Mobile SEO validation script failed"
    );
  }

  return result.stdout.trim();
}

describe("Mobile SEO guardrails", () => {
  it("validates responsive layout, touch targets, navigation, and typography", () => {
    runMobileSeoValidation();
  });
});
