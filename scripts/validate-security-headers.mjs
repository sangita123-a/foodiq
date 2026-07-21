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

const headersModule = read("lib/security/headers.ts");
const nextConfig = read("next.config.ts");
const middleware = read("middleware.ts");

assert("Security headers module exists", headersModule.includes("buildProductionSecurityHeaders"));
assert("CSP builder exists", headersModule.includes("buildContentSecurityPolicy"));
assert("HSTS builder exists", headersModule.includes("buildStrictTransportSecurity"));
assert("Referrer-Policy is SEO-safe", headersModule.includes('strict-origin-when-cross-origin'));
assert("Referrer-Policy avoids no-referrer", !headersModule.includes('"no-referrer"'));
assert("X-Frame-Options is DENY", headersModule.includes('X_FRAME_OPTIONS = "DENY"'));
assert("Permissions-Policy builder exists", headersModule.includes("buildPermissionsPolicy"));
assert("CSP allows https images for SEO/catalog", headersModule.includes("img-src 'self' data: blob: https:"));
assert("CSP allows inline scripts for JSON-LD", headersModule.includes("'unsafe-inline'"));
assert("CSP blocks framing via frame-ancestors", headersModule.includes("frame-ancestors 'none'"));
assert("HSTS includes preload in production", headersModule.includes("includeSubDomains; preload"));
assert(
  "next.config uses centralized security headers",
  nextConfig.includes("lib/security/headers")
);
assert(
  "middleware applies production security headers",
  middleware.includes("applySecurityHeaders")
);
assert(
  "Permissions-Policy allows checkout payment",
  headersModule.includes('payment=(self "https://checkout.razorpay.com")')
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

console.log("Production security headers validation passed.");
