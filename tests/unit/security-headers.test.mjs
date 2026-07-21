/**
 * Validates production security header guardrails.
 */
import { describe, it } from "node:test";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function runSecurityHeadersValidation() {
  const script = path.join(root, "scripts", "validate-security-headers.mjs");
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() ||
        result.stdout?.trim() ||
        "Security headers validation script failed"
    );
  }

  return result.stdout.trim();
}

describe("Production security headers", () => {
  it("validates CSP, HSTS, X-Frame-Options, Referrer-Policy, and Permissions-Policy", () => {
    runSecurityHeadersValidation();
  });
});
