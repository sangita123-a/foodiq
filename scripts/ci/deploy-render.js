/**
 * Deploy Foodiq API + Postgres to Render via the public API.
 *
 * Usage (PowerShell):
 *   $env:RENDER_API_KEY = "rnd_..."
 *   node scripts/ci/deploy-render.js
 *
 * Optional:
 *   $env:RENDER_OWNER_ID = "tea_..."   # workspace id (auto-detected if omitted)
 *   $env:FRONTEND_URL = "https://...."
 */
const API = 'https://api.render.com/v1';

const token = process.env.RENDER_API_KEY;
if (!token) {
  console.error('Set RENDER_API_KEY (Dashboard → Account Settings → API Keys).');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'https://foodiq-sangita123-as-projects.vercel.app';
const REPO = process.env.RENDER_REPO || 'https://github.com/sangita123-a/foodiq';
const BRANCH = process.env.RENDER_BRANCH || 'main';
const REGION = process.env.RENDER_REGION || 'singapore';
const SERVICE_NAME = process.env.RENDER_SERVICE_NAME || 'foodiq-backend-api';
const DB_NAME = process.env.RENDER_DB_NAME || 'foodiq-db';

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
    const err = new Error(`${method} ${path} → ${res.status}: ${text}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function getOwnerId() {
  if (process.env.RENDER_OWNER_ID) return process.env.RENDER_OWNER_ID;
  const owners = await api('GET', '/owners?limit=20');
  const list = Array.isArray(owners) ? owners : owners?.data || [];
  const first = list[0]?.owner || list[0];
  const id = first?.id || first?.owner?.id;
  if (!id) throw new Error('Could not resolve Render workspace (owner) id');
  console.log('Using owner:', id, first?.name || first?.email || '');
  return id;
}

async function findPostgres(ownerId) {
  const rows = await api('GET', `/postgres?limit=50&ownerId=${ownerId}`);
  const list = Array.isArray(rows) ? rows : [];
  return list.map((r) => r.postgres || r).find((p) => p.name === DB_NAME);
}

async function findService(ownerId) {
  const rows = await api('GET', `/services?limit=50&ownerId=${ownerId}`);
  const list = Array.isArray(rows) ? rows : [];
  return list.map((r) => r.service || r).find((s) => s.name === SERVICE_NAME);
}

async function ensurePostgres(ownerId) {
  const existing = await findPostgres(ownerId);
  if (existing) {
    console.log('Postgres exists:', existing.id, existing.name);
    return existing;
  }
  console.log('Creating Postgres', DB_NAME, '...');
  try {
    const created = await api('POST', '/postgres', {
      name: DB_NAME,
      ownerId,
      region: REGION,
      plan: 'basic_256mb',
      version: '16',
      databaseName: 'foodiq',
      databaseUser: 'foodiq',
    });
    const pg = created.postgres || created;
    console.log('Postgres created:', pg.id);
    return pg;
  } catch (err) {
    // Fallback plan name variants
    if (err.status === 400 || err.status === 422) {
      console.warn('Retrying Postgres create with plan basic-256mb...');
      const created = await api('POST', '/postgres', {
        name: DB_NAME,
        ownerId,
        region: REGION,
        plan: 'basic-256mb',
        version: '16',
        databaseName: 'foodiq',
        databaseUser: 'foodiq',
      });
      return created.postgres || created;
    }
    throw err;
  }
}

function envVars(databaseId) {
  return [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'TRUST_PROXY', value: 'true' },
    { key: 'CORS_STRICT', value: 'true' },
    { key: 'CORS_ALLOW_VERCEL', value: 'true' },
    { key: 'FRONTEND_URL', value: FRONTEND_URL },
    {
      key: 'CORS_ORIGINS',
      value: `${FRONTEND_URL},https://foodiq.vercel.app`,
    },
    { key: 'JWT_SECRET', generateValue: true },
    { key: 'JWT_REFRESH_SECRET', generateValue: true },
    { key: 'DATABASE_URL', fromDatabase: { name: DB_NAME, property: 'connectionString' } },
    { key: 'DB_SSL', value: 'true' },
    { key: 'AUTO_SEED_CATALOG', value: 'true' },
    { key: 'ALLOW_PAYMENT_MOCK', value: 'true' },
    { key: 'RAZORPAY_MOCK', value: 'true' },
    { key: 'FCM_MOCK', value: 'true' },
    { key: 'EMAIL_PROVIDER', value: 'mock' },
    { key: 'SMS_PROVIDER', value: 'mock' },
    { key: 'STORAGE_PROVIDER', value: 'auto' },
    { key: 'REDIS_ENABLED', value: 'false' },
    { key: 'LOG_LEVEL', value: 'info' },
  ].map((e) => {
    // Render service create API uses slightly different shapes for fromDatabase
    if (e.fromDatabase) {
      return {
        key: e.key,
        fromDatabase: { ...e.fromDatabase, postgresId: databaseId },
      };
    }
    return e;
  });
}

async function ensureWebService(ownerId, postgres) {
  const existing = await findService(ownerId);
  if (existing) {
    console.log('Web service exists:', existing.id, existing.serviceDetails?.url || existing.url);
    return existing;
  }

  console.log('Creating web service', SERVICE_NAME, '...');
  const body = {
    type: 'web_service',
    name: SERVICE_NAME,
    ownerId,
    repo: REPO,
    branch: BRANCH,
    rootDir: 'foodiq-frontend/foodiq-backend',
    autoDeploy: 'yes',
    serviceDetails: {
      runtime: 'node',
      plan: 'free',
      region: REGION,
      buildCommand: 'npm ci --omit=dev',
      startCommand: 'npm start',
      preDeployCommand: 'npm run db:migrate',
      healthCheckPath: '/api/health',
      envVars: envVars(postgres.id).map((e) => {
        if (e.fromDatabase) {
          return {
            key: e.key,
            fromDatabase: {
              name: e.fromDatabase.name,
              property: 'connectionString',
            },
          };
        }
        return e;
      }),
    },
  };

  const created = await api('POST', '/services', body);
  const svc = created.service || created;
  console.log('Web service created:', svc.id);
  return svc;
}

async function triggerDeploy(serviceId) {
  console.log('Triggering deploy...');
  const deploy = await api('POST', `/services/${serviceId}/deploys`, {
    clearCache: 'do_not_clear',
  });
  return deploy.deploy || deploy;
}

async function waitForLive(serviceId, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    const deploys = await api('GET', `/services/${serviceId}/deploys?limit=1`);
    const list = Array.isArray(deploys) ? deploys : [];
    const d = list[0]?.deploy || list[0];
    const status = d?.status || 'unknown';
    console.log(`Deploy status: ${status}`);
    if (status === 'live') return d;
    if (['build_failed', 'update_failed', 'canceled', 'deactivated'].includes(status)) {
      throw new Error(`Deploy failed: ${status}`);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error('Timed out waiting for deploy');
}

async function seedHint(url) {
  console.log(`\nBackend URL: ${url}`);
  console.log('If menu is empty, run seed once with DATABASE_URL from Render dashboard:');
  console.log('  cd foodiq-frontend/foodiq-backend && npm run seed');
  console.log(`Then: node scripts/ci/prod-smoke.js ${url}`);
}

(async () => {
  const ownerId = await getOwnerId();
  const postgres = await ensurePostgres(ownerId);
  const service = await ensureWebService(ownerId, postgres);
  const serviceId = service.id;
  await triggerDeploy(serviceId);
  try {
    await waitForLive(serviceId);
  } catch (err) {
    console.warn(err.message);
  }
  const refreshed = await api('GET', `/services/${serviceId}`);
  const svc = refreshed.service || refreshed;
  const url = svc.serviceDetails?.url || svc.url || `https://${SERVICE_NAME}.onrender.com`;
  await seedHint(url);
  console.log('\nFINAL_BACKEND_URL=' + url);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
