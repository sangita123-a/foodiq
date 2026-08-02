import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import http from "node:http";
import WebSocket from "ws";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9335;
const userDataDir = mkdtempSync(join(tmpdir(), "cdp-chrome-dbg-"));

function httpJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function waitForCdp() {
  for (let i = 0; i < 60; i++) {
    try { await httpJson(`http://127.0.0.1:${PORT}/json/version`); return; } catch { await sleep(500); }
  }
  throw new Error("no cdp");
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

const chromeProc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDataDir}`, "--window-size=1280,900",
], { stdio: "ignore" });
process.on("exit", () => { try { chromeProc.kill(); } catch {} });

await waitForCdp();
const target = await httpJson(`http://127.0.0.1:${PORT}/json/new?about:blank`, "PUT");
const ws = await connectTarget(target.webSocketDebuggerUrl);
const sendCdp = makeSender(ws);
await sendCdp("Page.enable");
await sendCdp("Runtime.enable");

async function evalJs(expr) {
  const res = await sendCdp("Runtime.evaluate", { expression: expr, returnByValue: true });
  return res.result?.value;
}

await sendCdp("Page.navigate", { url: "http://localhost:3000/delivery/login" });
await sleep(4000);

console.log("activeElement before focus:", await evalJs("document.activeElement && document.activeElement.tagName"));

const focusRes = await evalJs(`(function(){ const el = document.querySelector('#delivery-email'); if (!el) return 'NOT FOUND'; el.focus(); return document.activeElement === el ? 'FOCUSED-OK' : 'FOCUS-MISMATCH:' + (document.activeElement && document.activeElement.id); })()`);
console.log("focus email result:", focusRes);

await sendCdp("Input.insertText", { text: "rider@foodiq.com" });
await sleep(300);

console.log("email value right after insertText:", await evalJs("document.querySelector('#delivery-email').value"));
console.log("activeElement after email insertText:", await evalJs("document.activeElement && document.activeElement.id"));

const focusRes2 = await evalJs(`(function(){ const el = document.querySelector('#delivery-password'); if (!el) return 'NOT FOUND'; el.focus(); return document.activeElement === el ? 'FOCUSED-OK' : 'FOCUS-MISMATCH:' + (document.activeElement && document.activeElement.id); })()`);
console.log("focus password result:", focusRes2);

await sendCdp("Input.insertText", { text: "Password123" });
await sleep(300);

console.log("email value AFTER password typed:", await evalJs("document.querySelector('#delivery-email').value"));
console.log("password value:", await evalJs("document.querySelector('#delivery-password').value"));

ws.close();
chromeProc.kill();
process.exit(0);
