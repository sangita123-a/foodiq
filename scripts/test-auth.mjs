/**
 * Auth flow smoke tests — run against local backend on port 4000.
 * Usage: node scripts/test-auth.mjs [baseUrl]
 */
const BASE = (process.argv[2] || "http://localhost:4000").replace(/\/$/, "");

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(label, condition, detail = "") {
  const ok = Boolean(condition);
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
  return ok;
}

const email = `authtest_${Date.now()}@example.com`;
const phone = `+919${String(Date.now()).slice(-9)}`;
const password = "TestPass1";
let token = "";

console.log(`\nAuth tests → ${BASE}\n`);

// Invalid email
{
  const r = await req("POST", "/api/auth/register", {
    full_name: "Bad Email",
    email: "not-an-email",
    phone,
    password,
  });
  assert("Invalid email rejected", r.status === 400 && r.data.message?.includes("Invalid email"), r.data.message);
}

// Weak password
{
  const r = await req("POST", "/api/auth/register", {
    full_name: "Weak Pass",
    email: `weak_${Date.now()}@example.com`,
    phone,
    password: "short",
  });
  assert("Weak password rejected", r.status === 400 && /password/i.test(r.data.message || ""), r.data.message);
}

// Register
{
  const r = await req("POST", "/api/auth/register", {
    full_name: "Auth Test User",
    email,
    phone,
    password,
  });
  token = r.data?.data?.token || "";
  assert("New user can register", r.status === 201 && r.data.success && token.length > 20, r.data.message);
}

// Duplicate email
{
  const r = await req("POST", "/api/auth/register", {
    full_name: "Duplicate",
    email,
    phone,
    password,
  });
  assert("Duplicate email rejected", r.status === 400 && /already exists/i.test(r.data.message || ""), r.data.message);
}

// User not found
{
  const r = await req("POST", "/api/auth/login", {
    email: "missing_user@example.com",
    password,
  });
  assert(
    "User not found rejected",
    r.status === 401 && /not found|invalid email or password/i.test(r.data.message || ""),
    r.data.message
  );
}

// Wrong password
{
  const r = await req("POST", "/api/auth/login", { email, password: "WrongPass9" });
  assert(
    "Wrong password rejected",
    r.status === 401 && /wrong password|invalid email or password/i.test(r.data.message || ""),
    r.data.message
  );
}

// Login
{
  const r = await req("POST", "/api/auth/login", { email, password });
  token = r.data?.data?.token || token;
  assert("Existing user can login", r.status === 200 && r.data.success && token.length > 20, r.data.message);
}

// Protected route without token
{
  const r = await req("GET", "/api/auth/profile");
  assert("Protected route blocked without token", r.status === 401, String(r.status));
}

// Protected route with Bearer token
{
  const r = await req("GET", "/api/auth/profile", null, token);
  assert("Protected route works with Bearer token", r.status === 200 && r.data.success, r.data.message);
}

// Logout
{
  const r = await req("POST", "/api/auth/logout", {}, token);
  assert("Logout succeeds", r.status === 200 && r.data.success, r.data.message);
}

console.log(process.exitCode ? "\nSome tests failed.\n" : "\nAll auth tests passed.\n");
