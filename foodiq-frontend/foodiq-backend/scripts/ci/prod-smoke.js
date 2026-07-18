/**
 * Production API smoke tests against a live Foodiq backend.
 * Usage: node scripts/ci/prod-smoke.js https://foodiq-backend-api.onrender.com
 */
const base = (process.argv[2] || process.env.API_URL || '').replace(/\/$/, '');

if (!base) {
  console.error('Usage: node scripts/ci/prod-smoke.js <API_BASE_URL>');
  process.exit(1);
}

const results = [];

async function req(method, path, { body, token, expectStatus } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  const ok =
    expectStatus != null ? res.status === expectStatus : res.status >= 200 && res.status < 300;
  results.push({
    method,
    path,
    status: res.status,
    ok,
    note: ok ? 'pass' : `expected ${expectStatus ?? '2xx'}`,
  });
  if (!ok) {
    console.error(`FAIL ${method} ${path} → ${res.status}`, data?.message || data?.error || '');
  } else {
    console.log(`OK   ${method} ${path} → ${res.status}`);
  }
  return { res, data, ok };
}

(async () => {
  console.log(`Foodiq production smoke → ${base}\n`);

  await req('GET', '/api/health');
  const menu = await req('GET', '/api/menu-items');
  const menuCount = Array.isArray(menu.data?.data)
    ? menu.data.data.length
    : Array.isArray(menu.data)
      ? menu.data.length
      : 0;
  if (menu.ok && menuCount === 0) {
    console.error('FAIL GET /api/menu-items returned empty data');
    results[results.length - 1].ok = false;
  } else if (menu.ok) {
    console.log(`     menu-items count: ${menuCount}`);
  }

  await req('GET', '/api/menu-items?trending=true');
  await req('GET', '/api/restaurants');

  const login = await req('POST', '/api/auth/login', {
    body: { email: 'customer@foodiq.com', password: 'Password123' },
  });
  const token = login.data?.data?.token || login.data?.token;

  if (token) {
    await req('GET', '/api/auth/profile', { token });
    await req('GET', '/api/cart', { token });
    await req('GET', '/api/favorites', { token });
    await req('GET', '/api/orders', { token });
  } else {
    console.error('FAIL auth login did not return token — skipping authenticated checks');
  }

  const adminLogin = await req('POST', '/api/auth/login', {
    body: { email: 'admin@foodiq.com', password: 'Password123' },
  });
  const adminToken = adminLogin.data?.data?.token || adminLogin.data?.token;
  if (adminToken) {
    await req('GET', '/api/admin/dashboard', { token: adminToken });
  } else {
    // Some apps use a nested path — try common alternatives
    await req('GET', '/api/admin/analytics', { token: adminToken || 'missing', expectStatus: 401 });
  }

  // Image URL sanity from restaurants
  const restos = await req('GET', '/api/restaurants');
  const list = restos.data?.data || restos.data || [];
  const sample = Array.isArray(list) ? list.slice(0, 3) : [];
  for (const r of sample) {
    const url = r.image_url || r.imageUrl;
    if (!url) {
      console.error(`FAIL restaurant ${r.id || r.name} missing image_url`);
      results.push({ method: 'GET', path: 'image_check', status: 0, ok: false });
      continue;
    }
    try {
      const img = await fetch(url, { method: 'HEAD' });
      const ok = img.ok || img.status === 405;
      console.log(`${ok ? 'OK' : 'FAIL'} image ${url} → ${img.status}`);
      results.push({ method: 'HEAD', path: url, status: img.status, ok });
    } catch (err) {
      console.error(`FAIL image ${url}`, err.message);
      results.push({ method: 'HEAD', path: url, status: 0, ok: false });
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
