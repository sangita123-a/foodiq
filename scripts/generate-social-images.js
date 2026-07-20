const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const width = 1200;
const height = 630;
const brandRed = "#E23744";
const brandDark = "#1C1C1C";
const brandMuted = "#686B78";

const foodPaths = [
  "images/catalog/dishes/biryani/hyderabadi-biryani.webp",
  "images/catalog/dishes/pizza/classic-margherita.webp",
  "images/catalog/dishes/burger/chicken-burger.webp",
  "images/catalog/dishes/desserts/chocolate-cake.webp",
  "images/catalog/dishes/chinese/chicken-momos.webp",
  "images/catalog/dishes/beverages/mango-shake.webp",
].map((p) => path.join(publicDir, p));

function bannerSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="55%" stop-color="#FFF5F6"/>
      <stop offset="100%" stop-color="#FFECEE"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${brandRed}"/>
      <stop offset="100%" stop-color="#C81E34"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="0" y="0" width="520" height="${height}" fill="url(#accent)"/>
  <rect x="500" y="0" width="40" height="${height}" fill="url(#accent)" opacity="0.12"/>
  <circle cx="120" cy="110" r="90" fill="#FFFFFF" opacity="0.12"/>
  <circle cx="420" cy="560" r="120" fill="#FFFFFF" opacity="0.08"/>
  <rect x="72" y="430" width="220" height="6" rx="3" fill="#FFFFFF" opacity="0.35"/>
  <text x="72" y="170" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="800" fill="#FFFFFF">Foodiq</text>
  <text x="72" y="240" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#FFFFFF">Order Delicious Food</text>
  <text x="72" y="286" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#FFFFFF">Anytime</text>
  <text x="72" y="360" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="500" fill="#FFE4E7">Fast delivery • Top restaurants • Best offers</text>
  <rect x="560" y="48" width="600" height="534" rx="28" fill="#FFFFFF" stroke="#F3D4D8" stroke-width="2"/>
  <text x="860" y="598" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600" fill="${brandMuted}">foodiq-ecru.vercel.app</text>
</svg>`);
}

async function loadFoodTile(filePath, w, h) {
  if (!fs.existsSync(filePath)) {
    return sharp({
      create: {
        width: w,
        height: h,
        channels: 3,
        background: brandRed,
      },
    })
      .png()
      .toBuffer();
  }

  return sharp(filePath)
    .resize(w, h, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

async function buildCollage() {
  const tileW = 188;
  const tileH = 160;
  const gap = 14;
  const startX = 572;
  const startY = 66;
  const positions = [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ];

  const composites = [];
  for (let i = 0; i < positions.length; i += 1) {
    const [col, row] = positions[i];
    const tile = await loadFoodTile(foodPaths[i], tileW, tileH);
    composites.push({
      input: tile,
      left: startX + col * (tileW + gap),
      top: startY + row * (tileH + gap),
    });
  }

  const logoPath = path.join(publicDir, "icons", "icon-512.png");
  if (fs.existsSync(logoPath)) {
    const logo = await sharp(logoPath).resize(96, 96).png().toBuffer();
    composites.unshift({ input: logo, left: 72, top: 56 });
  }

  return sharp(bannerSvg()).composite(composites).png().toBuffer();
}

async function run() {
  const banner = await buildCollage();
  const ogPath = path.join(publicDir, "opengraph-image.png");
  const twitterPath = path.join(publicDir, "twitter-image.png");

  await sharp(banner).png({ quality: 92 }).toFile(ogPath);
  await sharp(banner).png({ quality: 92 }).toFile(twitterPath);

  console.log("Created", ogPath);
  console.log("Created", twitterPath);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
