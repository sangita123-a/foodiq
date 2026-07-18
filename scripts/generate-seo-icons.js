const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "public", "icons");
const appDir = path.join(__dirname, "..", "app");
fs.mkdirSync(dir, { recursive: true });

function svg(size) {
  const r = Math.round(size * 0.22);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#FC8019"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${Math.round(size * 0.42)}" fill="#FFFFFF">F</text>
</svg>`
  );
}

async function run() {
  await sharp(svg(512)).png().toFile(path.join(dir, "icon-512.png"));
  await sharp(svg(192)).png().toFile(path.join(dir, "icon-192.png"));
  await sharp(svg(180)).png().toFile(path.join(dir, "apple-touch-icon.png"));
  await sharp(svg(32)).png().toFile(path.join(dir, "favicon-32.png"));
  await sharp(svg(16)).png().toFile(path.join(dir, "favicon-16.png"));

  const og = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFF7F0"/><stop offset="100%" stop-color="#FFE8D6"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect x="80" y="180" width="200" height="200" rx="44" fill="#FC8019"/>
    <text x="180" y="310" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-weight="800" font-size="110" fill="#FFFFFF">F</text>
    <text x="320" y="270" font-family="Arial" font-weight="800" font-size="96" fill="#1C1C1C">Foodiq</text>
    <text x="320" y="360" font-family="Arial" font-weight="500" font-size="36" fill="#686B78">Order food from top restaurants</text>
  </svg>`);
  await sharp(og).png().toFile(path.join(dir, "og-default.png"));
  await sharp(svg(48)).png().toFile(path.join(appDir, "icon.png"));
  await sharp(svg(180)).png().toFile(path.join(appDir, "apple-icon.png"));
  console.log("icons ok");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
