/** Cross-platform unit test runner for Node's built-in test runner. */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = process.argv[2] || 'tests/unit';
const abs = path.resolve(process.cwd(), root);

function collect(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) collect(p, out);
    else if (/\.test\.(js|mjs|cjs)$/.test(name)) out.push(p);
  }
  return out;
}

const files = collect(abs);
if (!files.length) {
  console.error('No test files under', abs);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
