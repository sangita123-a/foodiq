import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import http from "node:http";
import WebSocket from "ws";
import fs from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9334;
const userDataDir = mkdtempSync(join(tmpdir(), "cdp-chrome-auth-"));
const shotsDir =
  "C:/Users/sahoo/AppData/Local/Temp/claude/c--Users-sahoo-OneDrive-Desktop-Foodiq/5a8f0e75-1923-4c05-b123-74645528c430/scratchpad/screenshots";
mkdirSync(shotsDir, { recursive: true });

function httpJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Non-JSON response from ${url}: ${body.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
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
ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
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
await sendCdp("Page.addScriptToEvaluateOnNewDocument", {
  source: `
    window.__fetchLog = [];
    const origFetch = window.fetch;
    window.fetch = function(...args) {
      window.__fetchLog.push({ url: String(args[0]), t: Date.now() });
      return origFetch.apply(this, args);
    };
    const OrigXHR = window.XMLHttpRequest;
    const origOpen = OrigXHR.prototype.open;
    OrigXHR.prototype.open = function(method, url, ...rest) {
      window.__fetchLog.push({ url, method, t: Date.now(), via: 'xhr' });
      return origOpen.call(this, method, url, ...rest);
    };
  `,
});

async function evalJs(expr) {
  const res = await sendCdp("Runtime.evaluate", { expression: expr, returnByValue: true });
  if (res.exceptionDetails) {
    throw new Error("evalJs threw: " + JSON.stringify(res.exceptionDetails));
  }
  return res.result?.value;
}

/** Poll `exprBoolean` (a JS expression returning truthy/falsy) until true or timeout. */
async function waitForCondition(exprBoolean, timeoutMs = 20000, intervalMs = 400) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await evalJs(`Boolean(${exprBoolean})`).catch(() => false);
    if (ok) return true;
    await sleep(intervalMs);
  }
  return false;
}

async function typeInto(selector, text) {
  const found = await waitForCondition(`document.querySelector(${JSON.stringify(selector)})`, 20000);
  if (!found) throw new Error(`Element ${selector} never appeared`);
  await evalJs(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  await sendCdp("Input.insertText", { text });
}

console.log("=== Navigating to /delivery/login ===");
allEvents.length = 0;
await sendCdp("Page.navigate", { url: "http://localhost:3000/delivery/login" });
const loginFormReady = await waitForCondition(`document.querySelector('#delivery-email')`, 25000);
console.log("Login form ready:", loginFormReady);

await typeInto("#delivery-email", "rider@foodiq.com");
await typeInto("#delivery-password", "Password123");

const fieldValues = await evalJs(`
  JSON.stringify({
    email: document.querySelector('#delivery-email')?.value,
    password: document.querySelector('#delivery-password')?.value,
  })
`);
console.log("Field values before submit:", fieldValues);

const preClickButtonState = await evalJs(`
  JSON.stringify({
    text: document.querySelector('button[type=submit]')?.innerText,
    disabled: document.querySelector('button[type=submit]')?.disabled,
  })
`);
console.log("Submit button state before click:", preClickButtonState);

const rect = await evalJs(`
  JSON.stringify(document.querySelector('button[type=submit]').getBoundingClientRect())
`);
const r = JSON.parse(rect);
const cx = r.x + r.width / 2;
const cy = r.y + r.height / 2;
await sendCdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: cx, y: cy });
await sendCdp("Input.dispatchMouseEvent", { type: "mousePressed", x: cx, y: cy, button: "left", clickCount: 1 });
await sendCdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: cx, y: cy, button: "left", clickCount: 1 });
await sleep(200);

const postClickButtonState = await evalJs(`
  JSON.stringify({
    text: document.querySelector('button[type=submit]')?.innerText,
    disabled: document.querySelector('button[type=submit]')?.disabled,
    fetchLog: window.__fetchLog,
  })
`);
console.log("Submit button state + fetch log 200ms after click:", postClickButtonState);

const loggedIn = await waitForCondition(
  `location.pathname !== '/delivery/login'`,
  20000
);
console.log("Redirected away from login within timeout:", loggedIn);

const fetchLogFinal = await evalJs(`JSON.stringify(window.__fetchLog)`).catch(() => "N/A (page navigated)");
console.log("Full fetch/XHR log:", fetchLogFinal);

const afterLoginUrl = await evalJs("location.href");
console.log("After login URL:", afterLoginUrl);
console.log("Console/exception events during login attempt:", JSON.stringify(allEvents, null, 2));

const errorBanner = await evalJs(`
  (function() {
    const el = document.querySelector('.text-red-700, .text-red-600');
    return el ? el.innerText : null;
  })()
`);
console.log("Visible error banner (if any):", errorBanner);

const cookiesAfterLogin = await sendCdp("Network.getCookies", { urls: ["http://localhost:3000"] }).catch(() => null);
console.log("Cookies after login:", JSON.stringify(cookiesAfterLogin));

const targets = process.argv.slice(2);
const results = [];
for (const urlPath of targets) {
  allEvents.length = 0;
  await sendCdp("Page.navigate", { url: "http://localhost:3000" + urlPath });
  // Wait for the page to settle: either the DeliveryShell sidebar mounts, or we
  // get bounced back to login (both are terminal, stable states worth inspecting).
  await waitForCondition(
    `document.querySelector('aside') || location.pathname === '/delivery/login'`,
    25000
  );
  // Give client-side data fetches / map tiles a moment to finish painting.
  await sleep(3000);

  let screenshotPath = null;
  try {
    const shot = await sendCdp("Page.captureScreenshot", { format: "png" });
    const safe = urlPath.replace(/[^a-z0-9]/gi, "_") || "root";
    screenshotPath = join(shotsDir, `auth_${safe}.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(shot.data, "base64"));
  } catch {}

  const diag = await evalJs(`
    JSON.stringify({
      url: location.href,
      title: document.title,
      bodyLen: document.body.innerHTML.length,
      text: document.body.innerText.slice(0, 300),
    })
  `).catch((e) => "EVAL FAILED: " + e.message);

  results.push({ urlPath, events: [...allEvents], diag, screenshotPath });
}

console.log(JSON.stringify(results, null, 2));

ws.close();
chromeProc.kill();
process.exit(0);
