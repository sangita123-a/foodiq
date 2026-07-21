#!/usr/bin/env node
/**
 * Stable local dev: free port 3000, then start Next.js on http://localhost:3000 only.
 * Never falls back to 3001/3002/3003.
 */
import { spawn, execSync } from "node:child_process";
import { existsSync, rmSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PORT = 3000;

function log(msg) {
  console.log(`[foodiq:dev] ${msg}`);
}

function killPort(port) {
  if (process.platform === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const pid = trimmed.split(/\s+/).pop();
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          log(`Freed port ${port} (PID ${pid})`);
        } catch {
          /* already gone */
        }
      }
    } catch {
      /* nothing listening */
    }
    return;
  }

  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
      shell: true,
      stdio: "ignore",
    });
  } catch {
    /* ignore */
  }
}

function ensureEnv() {
  const envLocal = join(ROOT, ".env.local");
  const envExample = join(ROOT, ".env.example");
  const required = {
    NEXT_PUBLIC_API_URL: "http://localhost:4000",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  };

  let content = "";
  if (existsSync(envLocal)) {
    content = readFileSync(envLocal, "utf8");
  } else if (existsSync(envExample)) {
    content = readFileSync(envExample, "utf8");
    writeFileSync(envLocal, content, "utf8");
    log("Created .env.local from .env.example");
  }

  const keys = new Set(
    content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => l.split("=")[0].trim())
  );

  const missing = Object.entries(required).filter(([k]) => !keys.has(k));
  if (missing.length > 0 && existsSync(envLocal)) {
    appendFileSync(
      envLocal,
      `\n# Added by scripts/dev.mjs\n${missing.map(([k, v]) => `${k}=${v}`).join("\n")}\n`,
      "utf8"
    );
    log(`Appended missing env keys: ${missing.map(([k]) => k).join(", ")}`);
  }
}

function clearNextCache() {
  const nextDir = join(ROOT, ".next");
  if (!existsSync(nextDir)) return;
  try {
    rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
    log("Cleared .next cache");
  } catch (err) {
    log(`Could not fully clear .next: ${err.message}`);
  }
}

// Kill stray frontend dev ports only (never kill backend :4000)
for (const p of [3000, 3001, 3002, 3003]) {
  killPort(p);
}

ensureEnv();

if (process.argv.includes("--clean")) {
  clearNextCache();
}

killPort(PORT);

log(`Starting Next.js on http://localhost:${PORT}`);

const child = spawn("npx", ["next", "dev", "--port", String(PORT)], {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PORT: String(PORT),
  },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
