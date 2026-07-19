import fs from 'fs';

const content = fs.readFileSync('lib/data/30restaurantsData.ts', 'utf8');
const urls = [...new Set(content.match(/https:\/\/images\.unsplash\.com\/[^\s"']+/g) || [])];

console.log(`Found ${urls.length} unique Unsplash URLs in 30restaurantsData.ts.`);

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    return { url, status: 0, ok: false, error: err.message };
  }
}

async function run() {
  const results = [];
  for (const url of urls) {
    const r = await checkUrl(url);
    results.push(r);
  }
  const broken = results.filter((r) => !r.ok);
  console.log(`Total URLs: ${results.length}, Working: ${results.length - broken.length}, Broken: ${broken.length}`);
  if (broken.length > 0) {
    console.log('Broken URLs:');
    broken.forEach((b) => console.log(`[${b.status}] ${b.url}`));
  }
}

run();
