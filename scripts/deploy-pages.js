import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('--- Starting Cloudflare Pages Deployment ---');

// Get env tokens from process or registry/system env
let token = process.env.CLOUDFLARE_API_TOKEN;
let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!token) {
  try {
    const userToken = execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'CLOUDFLARE_API_TOKEN\', \'User\')"', { encoding: 'utf-8' }).trim();
    if (userToken) token = userToken;
  } catch (e) {}
}

if (!accountId) {
  try {
    const userAcc = execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'CLOUDFLARE_ACCOUNT_ID\', \'User\')"', { encoding: 'utf-8' }).trim();
    if (userAcc) accountId = userAcc;
  } catch (e) {}
}

console.log('CLOUDFLARE_API_TOKEN present:', Boolean(token));
console.log('CLOUDFLARE_ACCOUNT_ID present:', Boolean(accountId));

const env = {
  ...process.env,
  CLOUDFLARE_API_TOKEN: token || process.env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID: accountId || process.env.CLOUDFLARE_ACCOUNT_ID,
};

console.log('Executing wrangler pages deploy pages-build...');
try {
  const output = execSync('npx wrangler pages deploy pages-build --project-name=foodiq-ecru --branch=main', {
    env,
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  console.log('Deployment completed successfully!');
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
