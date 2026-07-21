import { execSync } from 'child_process';

let token = process.env.CLOUDFLARE_API_TOKEN;
let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!token) {
  try {
    token = execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'CLOUDFLARE_API_TOKEN\', \'User\')"', { encoding: 'utf-8' }).trim();
  } catch (e) {}
}
if (!accountId) {
  try {
    accountId = execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'CLOUDFLARE_ACCOUNT_ID\', \'User\')"', { encoding: 'utf-8' }).trim();
  } catch (e) {}
}

const env = {
  ...process.env,
  CLOUDFLARE_API_TOKEN: token,
  CLOUDFLARE_ACCOUNT_ID: accountId,
};

try {
  console.log('--- Cloudflare Pages Projects ---');
  const resPages = execSync('npx wrangler pages project list', { env, encoding: 'utf-8' });
  console.log(resPages);
} catch (err) {
  console.error('Pages error:', err.stdout || err.message);
}

try {
  console.log('--- Cloudflare Workers Deployments ---');
  const resWorkers = execSync('npx wrangler deployments list', { env, encoding: 'utf-8' });
  console.log(resWorkers);
} catch (err) {
  console.error('Workers error:', err.stdout || err.message);
}
