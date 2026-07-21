import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const pagesBuildDir = path.join(rootDir, 'pages-build');

console.log('Preparing Cloudflare Pages build directory:', pagesBuildDir);

// Reset pages-build directory
if (fs.existsSync(pagesBuildDir)) {
  fs.rmSync(pagesBuildDir, { recursive: true, force: true });
}
fs.mkdirSync(pagesBuildDir, { recursive: true });

// Copy public assets if exists
const publicDir = path.join(rootDir, 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, pagesBuildDir, { recursive: true });
  console.log('Copied public assets');
}

// Copy .next/static to pages-build/_next/static
const nextStaticDir = path.join(rootDir, '.next', 'static');
const pagesNextStaticDir = path.join(pagesBuildDir, '_next', 'static');
if (fs.existsSync(nextStaticDir)) {
  fs.cpSync(nextStaticDir, pagesNextStaticDir, { recursive: true });
  console.log('Copied .next/static assets');
}

// Copy .open-next/worker.js to pages-build/_worker.js
const openNextWorkerPath = path.join(rootDir, '.open-next', 'worker.js');
const pagesWorkerPath = path.join(pagesBuildDir, '_worker.js');
if (fs.existsSync(openNextWorkerPath)) {
  fs.copyFileSync(openNextWorkerPath, pagesWorkerPath);
  console.log('Copied worker.js to _worker.js');
} else {
  console.error('Error: .open-next/worker.js not found!');
  process.exit(1);
}

console.log('Cloudflare Pages build directory ready!');
