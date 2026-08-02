import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import http from "node:http";
import WebSocket from "ws";
import fs from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const userDataDir = mkdtempSync(join(tmpdir(), "cdp-chrome-"));
const shotsDir = "C:/Users/sahoo/AppData/Local/Temp/claude/c--Users-sahoo-OneDrive-Desktop-Foodiq/5a8f0e75-1923-4c05-b123-74645528c430/scratchpad/screenshots";
mkdirSync(shotsDir, { recursive: true });

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error("Usage: node cdp-check.mjs <url1> <url2> ...");
  process.exit(1);
}

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
const httpGetJson = (url) => httpJson(url, "GET");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForCdp() {
  for (let i = 0; i < 60; i++) {
    try {
      await httpGetJson(`http://127.0.0.1:${PORT}/json/version`);
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

function sendCdp(ws, method, params = {}) {
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
}

async function checkUrl(baseUrl, urlPath) {
  const fullUrl = baseUrl + urlPath;
  const target = await httpJson(
    `http://127.0.0.1:${PORT}/json/new?about:blank`,
    "PUT"
  );
  const ws = await connectTarget(target.webSocketDebuggerUrl);

  const consoleErrors = [];
  const exceptions = [];

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.method === "Runtime.exceptionThrown") {
      const ed = msg.params.exceptionDetails;
      const desc =
        ed.exception?.description || ed.exception?.value || ed.text || "Unknown exception";
      exceptions.push(desc);
    }
    if (msg.method === "Runtime.consoleAPICalled") {
      const args = msg.params.args
        .map((a) => a.value ?? a.description ?? JSON.stringify(a))
        .join(" ");
      consoleErrors.push(`[${msg.params.type}] ${args}`);
    }
    if (msg.method === "Network.responseReceivedExtraInfo") {
      // ignore
    }
  });

  await sendCdp(ws, "Page.enable");
  await sendCdp(ws, "Runtime.enable");
  await sendCdp(ws, "Network.enable");
  await sendCdp(ws, "Page.navigate", { url: fullUrl });

  await sleep(Number(process.env.CDP_WAIT_MS || 6000));

  let screenshotPath = null;
  try {
    const shot = await sendCdp(ws, "Page.captureScreenshot", { format: "png" });
    const safe = urlPath.replace(/[^a-z0-9]/gi, "_") || "root";
    screenshotPath = join(shotsDir, `${safe}.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(shot.data, "base64"));
  } catch (e) {
    /* ignore */
  }

  let title = null;
  try {
    const diagExpr = `
      JSON.stringify((function() {
        const overlays = Array.from(document.querySelectorAll('body *')).filter(el => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return (cs.position === 'fixed' || cs.position === 'absolute') &&
                 r.width >= window.innerWidth * 0.9 &&
                 r.height >= window.innerHeight * 0.9 &&
                 cs.visibility !== 'hidden' && cs.display !== 'none';
        }).map(el => ({
          tag: el.tagName,
          cls: el.className && el.className.toString().slice(0,150),
          bg: getComputedStyle(el).backgroundColor,
          opacity: getComputedStyle(el).opacity,
          zIndex: getComputedStyle(el).zIndex,
        }));
        return {
          url: location.href,
          title: document.title,
          bodyLen: document.body.innerHTML.length,
          bodyBg: getComputedStyle(document.body).backgroundColor,
          text: document.body.innerText.slice(0,400),
          overlays,
        };
      })())
    `;
    const evalRes = await sendCdp(ws, "Runtime.evaluate", { expression: diagExpr });
    title = evalRes.result?.value;
  } catch (e) {
    title = "EVAL FAILED: " + e.message;
  }

  ws.close();
  await httpGetJson(`http://127.0.0.1:${PORT}/json/close/${target.id}`).catch(() => {});

  return { urlPath, exceptions, consoleErrors, screenshotPath, title };
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

const baseUrl = "http://localhost:3000";
const results = [];
for (const urlPath of urls) {
  try {
    const r = await checkUrl(baseUrl, urlPath);
    results.push(r);
  } catch (e) {
    results.push({ urlPath, exceptions: [`DRIVER ERROR: ${e.message}`], consoleErrors: [], screenshotPath: null });
  }
}

console.log(JSON.stringify(results, null, 2));

chromeProc.kill();
process.exit(0);
