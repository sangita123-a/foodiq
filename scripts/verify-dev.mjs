#!/usr/bin/env node
/** Verify local dev stack: frontend :3000, backend :4000, API proxy. */
const FRONTEND = "http://localhost:3000";
const BACKEND = "http://localhost:4000";

const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    checks.push({ name, ok: false, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

await check("Frontend responds on :3000", async () => {
  const res = await fetch(FRONTEND, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (html.includes("Something went wrong")) throw new Error("Error boundary visible on home");
});

await check("Backend responds on :4000", async () => {
  const res = await fetch(`${BACKEND}/api/site-settings`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});

await check("Frontend /backend-api proxy works", async () => {
  const res = await fetch(`${FRONTEND}/backend-api/api/site-settings`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body || (body.success !== true && !body.data)) {
    throw new Error("Unexpected proxy response shape");
  }
});

await check("Collections API via proxy", async () => {
  const res = await fetch(
    `${FRONTEND}/backend-api/api/restaurants?collection=top-rated&limit=3`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  const list = body?.data ?? body;
  if (!Array.isArray(list) || list.length === 0) throw new Error("No restaurants returned");
});

const failed = checks.filter((c) => !c.ok);
console.log("\n--- Summary ---");
console.log(`Frontend URL: ${FRONTEND}`);
console.log(`Backend URL:  ${BACKEND}`);
console.log(`API Base URL: ${FRONTEND}/backend-api (browser) | ${process.env.NEXT_PUBLIC_API_URL || BACKEND} (env)`);
console.log(failed.length === 0 ? "\nAll checks passed." : `\n${failed.length} check(s) failed.`);

process.exit(failed.length === 0 ? 0 : 1);
