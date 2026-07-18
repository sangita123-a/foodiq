/** Cross-platform unit test runner (backend). */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../tests/unit');

function collect(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) collect(p, out);
    else if (/\.test\.js$/.test(name)) out.push(p);
  }
  return out;
}

const files = collect(root);
const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, REDIS_ENABLED: 'false' },
});
process.exit(result.status ?? 1);
