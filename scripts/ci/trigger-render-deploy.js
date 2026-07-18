/**
 * Trigger a deploy on an existing Render web service (CI-friendly).
 *
 * Required:
 *   RENDER_API_KEY
 *   RENDER_SERVICE_ID  (Dashboard → Service → Settings → Service ID)
 *
 * Optional:
 *   RENDER_CLEAR_CACHE=true
 *   RENDER_WAIT=true (default) — poll until live / failed
 */
const API = 'https://api.render.com/v1';

const token = process.env.RENDER_API_KEY;
const serviceId = process.env.RENDER_SERVICE_ID;

if (!token) {
  console.error('RENDER_API_KEY is required');
  process.exit(1);
}
if (!serviceId) {
  console.error('RENDER_SERVICE_ID is required (or use deploy-render.js for bootstrap)');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return data;
}

async function waitForLive(id, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    const deploys = await api('GET', `/services/${id}/deploys?limit=1`);
    const list = Array.isArray(deploys) ? deploys : [];
    const d = list[0]?.deploy || list[0];
    const status = d?.status || 'unknown';
    console.log(`[render] deploy status: ${status}`);
    if (status === 'live') return d;
    if (['build_failed', 'update_failed', 'canceled', 'deactivated'].includes(status)) {
      throw new Error(`Render deploy failed: ${status}`);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error('Timed out waiting for Render deploy');
}

(async () => {
  const clearCache =
    String(process.env.RENDER_CLEAR_CACHE || '').toLowerCase() === 'true'
      ? 'clear'
      : 'do_not_clear';

  console.log(`[render] triggering deploy service=${serviceId} clearCache=${clearCache}`);
  const deploy = await api('POST', `/services/${serviceId}/deploys`, { clearCache });
  const d = deploy.deploy || deploy;
  console.log(`[render] deploy id=${d.id || d.deployId || 'unknown'}`);

  if (String(process.env.RENDER_WAIT || 'true').toLowerCase() !== 'false') {
    await waitForLive(serviceId);
  }

  const refreshed = await api('GET', `/services/${serviceId}`);
  const svc = refreshed.service || refreshed;
  const url = svc.serviceDetails?.url || svc.url || '';
  console.log(`[render] LIVE url=${url}`);
  console.log(`FINAL_BACKEND_URL=${url}`);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
