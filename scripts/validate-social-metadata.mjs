#!/usr/bin/env node
/**
 * Validates Open Graph, Twitter Card, Facebook, and LinkedIn social metadata.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "validate-social-metadata.ts");
const tsxBin = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx"
);

const result = spawnSync(tsxBin, [script], {
  cwd: root,
  env: {
    ...process.env,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "https://foodiq-ecru.vercel.app",
  },
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
