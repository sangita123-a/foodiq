import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import http from "node:http";
import WebSocket from "ws";
import fs from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9337;
const userDataDir = mkdtempSync(join(tmpdir(), "cdp-chrome-tok-"));
const shotsDir =
  "C:/Users/sahoo/AppData/Local/Temp/claude/c--Users-sahoo-OneDrive-Desktop-Foodiq/5a8f0e75-1923-4c05-b123-74645528c430/scratchpad/screenshots";
mkdirSync(shotsDir, { recursive: true });

function httpJson(url, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      { method, headers: body ? { "Content-Type": "application/json" } : {} },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Non-JSON from ${url}: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function waitForCdp() {
  for (let i = 0; i < 60; i++) {
    try {
      await httpJson(`http://127.0.0.1:${PORT}/json/version`);
      return;
    } catch {
      await sleep(500);
    }
  }
  throw new Error("Chrome CDP endpoint never came up");
}
function connectTarget(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, { maxPayload: 100 * 1024 * 1024 });
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
}
function makeSender(ws) {
  return function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = Math.floor(Math.random() * 1e9);
      const onMessage = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off("message", onMessage);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      };
      ws.on("message", onMessage);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };
}

// 1. Get a real JWT via the backend login API directly (bypasses the UI entirely).
const loginRes = await httpJson("http://localhost:4000/api/delivery/login", "POST", {
  email: "rider@foodiq.com",
  password: "Password123",
});
if (!loginRes.success) {
  console.error("Backend login failed:", loginRes);
  process.exit(1);
}
const TOKEN = loginRes.data.token;
console.log("Got JWT from backend login API (bypassing UI):", TOKEN.slice(0, 20) + "...");

const chromeProc = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    "--window-size=1280,900",
  ],
  { stdio: "ignore" }
);
process.on("exit", () => {
  try {
    chromeProc.kill();
  } catch {}
});

await waitForCdp();
const target = await httpJson(`http://127.0.0.1:${PORT}/json/new?about:blank`, "PUT");
const ws = await connectTarget(target.webSocketDebuggerUrl);
const sendCdp = makeSender(ws);

const allEvents = [];
let capturedCookieHeader = null;
ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.method === "Network.requestWillBeSentExtraInfo" && capturedCookieHeader === null) {
    const headers = msg.params.headers || {};
    const cookieHeader = headers.Cookie || headers.cookie;
    if (cookieHeader !== undefined) {
      capturedCookieHeader = cookieHeader;
    }
  }
  if (msg.method === "Network.responseReceivedExtraInfo") {
    const loc = (msg.params.headers || {})["location"] || (msg.params.headers || {})["Location"];
    if (loc) allEvents.push({ kind: "redirect-location", text: loc });
  }
  if (msg.method === "Network.responseReceived" && msg.params.type === "Document") {
    allEvents.push({
      kind: "document-response",
      text: `${msg.params.response.status} ${msg.params.response.url}`,
    });
  }
  if (
    msg.method === "Network.responseReceived" &&
    msg.params.response.url.includes("/api/")
  ) {
    allEvents.push({
      kind: "api-response",
      text: `${msg.params.response.status} ${msg.params.response.url}`,
    });
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const ed = msg.params.exceptionDetails;
    allEvents.push({
      kind: "exception",
      text: ed.exception?.description || ed.exception?.value || ed.text || "Unknown exception",
    });
  }
  if (msg.method === "Runtime.consoleAPICalled" && (msg.params.type === "error" || msg.params.type === "warning")) {
    const args = msg.params.args.map((a) => a.value ?? a.description ?? JSON.stringify(a)).join(" ");
    allEvents.push({ kind: `console.${msg.params.type}`, text: args });
  }
});

await sendCdp("Page.enable");
await sendCdp("Runtime.enable");
await sendCdp("Network.enable");

// 2. Inject the session BEFORE any app script runs on every future navigation in this tab.
await sendCdp("Page.addScriptToEvaluateOnNewDocument", {
  source: `localStorage.setItem('foodiq_token', ${JSON.stringify(TOKEN)});`,
});

// 3. Set the middleware-visible session marker cookie.
const setCookieRes = await sendCdp("Network.setCookie", {
  name: "foodiq_session",
  value: "1",
  url: "http://localhost:3000",
  path: "/",
  sameSite: "Lax",
});
console.log("setCookie result:", JSON.stringify(setCookieRes));
const cookieCheck = await sendCdp("Network.getCookies", { urls: ["http://localhost:3000"] });
console.log("cookies right after set:", JSON.stringify(cookieCheck));

async function evalJs(expr) {
  const res = await sendCdp("Runtime.evaluate", { expression: expr, returnByValue: true });
  if (res.exceptionDetails) throw new Error("evalJs threw: " + JSON.stringify(res.exceptionDetails));
  return res.result?.value;
}
async function waitForCondition(exprBoolean, timeoutMs = 20000, intervalMs = 400) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await evalJs(`Boolean(${exprBoolean})`).catch(() => false);
    if (ok) return true;
    await sleep(intervalMs);
  }
  return false;
}

const targets = process.argv.slice(2);
const results = [];
for (const urlPath of targets) {
  allEvents.length = 0;
  capturedCookieHeader = null;
  await sendCdp("Page.navigate", { url: "http://localhost:3000" + urlPath });

  const timeline = [300, 700, 1200, 1800, 2500, 3500];
  let prevT = 0;
  for (const t of timeline) {
    await sleep(t - prevT);
    prevT = t;
    const snap = await evalJs(`
      JSON.stringify({
        path: location.pathname,
        cookie: document.cookie,
        lsToken: Boolean(localStorage.getItem('foodiq_token')),
      })
    `).catch((e) => "EVAL FAILED: " + e.message);
    console.log(`  t=${t}ms:`, snap);
  }
  console.log(`Cookie header sent for ${urlPath}:`, capturedCookieHeader);
  console.log("  events so far:", JSON.stringify(allEvents, null, 2));
  await waitForCondition(
    `document.querySelector('aside') || location.pathname === '/delivery/login'`,
    25000
  );
  await sleep(3500);

  let screenshotPath = null;
  try {
    const shot = await sendCdp("Page.captureScreenshot", { format: "png" });
    const safe = urlPath.replace(/[^a-z0-9]/gi, "_") || "root";
    screenshotPath = join(shotsDir, `tok_${safe}.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(shot.data, "base64"));
  } catch {}

  const diag = await evalJs(`
    JSON.stringify({
      url: location.href,
      title: document.title,
      hasSidebar: Boolean(document.querySelector('aside')),
      text: document.body.innerText.slice(0, 250),
    })
  `).catch((e) => "EVAL FAILED: " + e.message);

  results.push({ urlPath, events: [...allEvents], diag, screenshotPath });
}

console.log(JSON.stringify(results, null, 2));

ws.close();
chromeProc.kill();
process.exit(0);
