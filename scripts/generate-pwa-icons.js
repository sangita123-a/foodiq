const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "public", "icons");
const splashDir = path.join(root, "public", "splash");
const brandRed = "#E23744";
const brandRedDark = "#C81E34";

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(splashDir, { recursive: true });

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

function iconSvg(size, maskable = false) {
  const radius = maskable ? Math.round(size * 0.5) : Math.round(size * 0.22);
  const fontSize = Math.round(size * (maskable ? 0.34 : 0.42));
  const padding = maskable ? Math.round(size * 0.18) : 0;
  const inner = size - padding * 2;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${brandRed}"/>
  ${maskable ? `<rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${Math.round(inner * 0.22)}" fill="${brandRedDark}"/>` : ""}
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}" fill="#FFFFFF">F</text>
</svg>`);
}

function splashSvg(width, height) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#FFF5F6"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="${Math.round(width * 0.34)}" y="${Math.round(height * 0.28)}" width="${Math.round(width * 0.32)}" height="${Math.round(width * 0.32)}" rx="${Math.round(width * 0.07)}" fill="${brandRed}"/>
  <text x="50%" y="${Math.round(height * 0.47)}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${Math.round(width * 0.14)}" fill="#FFFFFF">F</text>
  <text x="50%" y="${Math.round(height * 0.62)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${Math.round(width * 0.09)}" fill="#1C1C1C">Foodiq</text>
  <text x="50%" y="${Math.round(height * 0.68)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="${Math.round(width * 0.035)}" fill="#686B78">Premium Online Food Ordering</text>
</svg>`);
}

async function run() {
  for (const size of iconSizes) {
    await sharp(iconSvg(size))
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
  }

  await sharp(iconSvg(180))
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  await sharp(iconSvg(512, true))
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));

  await sharp(iconSvg(192, true))
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-192.png"));

  await sharp(iconSvg(32)).png().toFile(path.join(iconsDir, "favicon-32.png"));
  await sharp(iconSvg(16)).png().toFile(path.join(iconsDir, "favicon-16.png"));

  const splashes = [
    { file: "iphone-se.png", w: 750, h: 1334 },
    { file: "iphone-14.png", w: 1170, h: 2532 },
    { file: "iphone-14-pro-max.png", w: 1284, h: 2778 },
    { file: "ipad.png", w: 1536, h: 2048 },
  ];

  for (const splash of splashes) {
    await sharp(splashSvg(splash.w, splash.h))
      .png()
      .toFile(path.join(splashDir, splash.file));
  }

  console.log("PWA icons and splash screens generated.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
