/**
 * Validates Core Web Vitals guardrails and performance report generation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function runScript(relativePath) {
  const script = path.join(root, relativePath);
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() ||
        result.stdout?.trim() ||
        `${relativePath} failed`
    );
  }

  return result.stdout.trim();
}

describe("Core Web Vitals guardrails", () => {
  it("validates LCP, CLS, and INP guardrails", () => {
    runScript("scripts/validate-performance.mjs");
  });

  it("generates the performance report", () => {
    runScript("scripts/generate-performance-report.mjs");
    const reportPath = path.join(root, "docs", "PERFORMANCE_REPORT.md");
    assert.ok(fs.existsSync(reportPath));
    const content = fs.readFileSync(reportPath, "utf8");
    assert.match(content, /Core Web Vitals Performance Report/);
    assert.match(content, /LCP/);
    assert.match(content, /CLS/);
    assert.match(content, /INP/);
  });
});
