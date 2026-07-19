import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

function getAllImageUrlsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(/\/images\/[a-zA-Z0-9_\-/\.]+\.(webp|jpg|jpeg|png|svg)/g) || [];
  return [...new Set(matches)];
}

const filesToAudit = [
  path.join(process.cwd(), 'lib', 'data', '30restaurantsData.ts'),
  path.join(process.cwd(), 'lib', 'data', 'restaurantMenusData.ts'),
  path.join(process.cwd(), 'lib', 'images.ts'),
  path.join(process.cwd(), 'lib', 'cuisines.ts'),
  path.join(process.cwd(), 'lib', 'offers.ts'),
  path.join(process.cwd(), 'components', 'PopularRestaurants.tsx'),
  path.join(process.cwd(), 'components', 'TrendingDishes.tsx'),
  path.join(process.cwd(), 'components', 'TrendingDishesPage.tsx'),
  path.join(process.cwd(), 'app', 'restaurant', '[id]', 'page.tsx'),
];

const allUrls = new Set();
for (const file of filesToAudit) {
  if (fs.existsSync(file)) {
    const urls = getAllImageUrlsFromFile(file);
    urls.forEach(u => allUrls.add(u));
  }
}

console.log(`Total unique local image URLs found in source code: ${allUrls.size}\n`);

const missing = [];
const empty = [];
const valid = [];

for (const url of Array.from(allUrls)) {
  const clean = url.startsWith('/') ? url.slice(1) : url;
  const abs = path.join(publicDir, clean);

  if (!fs.existsSync(abs)) {
    missing.push({ url, abs });
  } else {
    const stat = fs.statSync(abs);
    if (stat.size === 0) {
      empty.push({ url, abs });
    } else {
      valid.push({ url, size: stat.size });
    }
  }
}

console.log(`Valid files: ${valid.length}`);
console.log(`Missing files: ${missing.length}`);
console.log(`Empty files: ${empty.length}`);

if (missing.length > 0) {
  console.log('\n--- MISSING FILES ---');
  missing.forEach(m => console.log(`404 NOT FOUND: ${m.url}`));
}

if (empty.length > 0) {
  console.log('\n--- EMPTY FILES ---');
  empty.forEach(e => console.log(`0 BYTES: ${e.url}`));
}

if (missing.length === 0 && empty.length === 0) {
  console.log('\nVERIFICATION SUCCESS: 100% of all image URLs exist and have non-zero file sizes on disk!');
}
