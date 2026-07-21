#!/usr/bin/env node
/** Start backend API on port 4000 (frees port first). */
import { spawn, execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND = join(__dirname, "..", "foodiq-frontend", "foodiq-backend");
const PORT = 4000;

function log(msg) {
  console.log(`[foodiq:backend] ${msg}`);
}

function killPort(port) {
  if (process.platform !== "win32") return;
  try {
    const out = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    for (const line of out.split(/\r?\n/)) {
      const pid = line.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          log(`Freed port ${port} (PID ${pid})`);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* nothing listening */
  }
}

killPort(PORT);
log(`Starting backend on http://localhost:${PORT}`);

const child = spawn("npm", ["run", "dev"], {
  cwd: BACKEND,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PORT: String(PORT) },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
