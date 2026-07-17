/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { dishes } = require('../foodiq-frontend/foodiq-backend/database/catalogData');

const sourceDirectory =
  process.env.FOODIQ_IMAGE_SHEETS ||
  path.join(
    process.env.USERPROFILE || '',
    '.cursor',
    'projects',
    'c-Users-sahoo-OneDrive-Desktop-Foodiq',
    'assets'
  );
const outputRoot = path.join(__dirname, '..', 'public', 'images', 'catalog', 'dishes');

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function buildCuisineSheet(cuisineSlug, cuisineDishes) {
  const source = path.join(sourceDirectory, `${cuisineSlug}-dish-sheet.webp`);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing generated contact sheet: ${source}`);
  }
  if (cuisineDishes.length !== 15) {
    throw new Error(`${cuisineSlug} must contain exactly 15 dishes`);
  }

  const metadata = await sharp(source).metadata();
  const panelWidth = Math.floor(metadata.width / 5);
  const panelHeight = Math.floor(metadata.height / 3);
  const cropHeight = Math.floor((panelWidth * 3) / 4);
  const verticalInset = Math.max(0, Math.floor((panelHeight - cropHeight) / 2));
  const cuisineDirectory = path.join(outputRoot, cuisineSlug);
  fs.rmSync(cuisineDirectory, { recursive: true, force: true });
  fs.mkdirSync(cuisineDirectory, { recursive: true });

  const outputs = [];
  for (let index = 0; index < cuisineDishes.length; index += 1) {
    const column = index % 5;
    const row = Math.floor(index / 5);
    const filename = `${slugify(cuisineDishes[index].name)}.webp`;
    const output = path.join(cuisineDirectory, filename);

    await sharp(source)
      .extract({
        left: column * panelWidth,
        top: row * panelHeight + verticalInset,
        width: panelWidth,
        height: Math.min(cropHeight, panelHeight),
      })
      .resize(640, 480, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toFile(output);

    outputs.push(output);
  }
  return outputs;
}

async function main() {
  const outputs = [];
  for (const [cuisineSlug, cuisineDishes] of Object.entries(dishes)) {
    outputs.push(...(await buildCuisineSheet(cuisineSlug, cuisineDishes)));
  }

  const hashes = new Map();
  for (const output of outputs) {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex');
    if (hashes.has(digest)) {
      throw new Error(`Duplicate image content: ${output} and ${hashes.get(digest)}`);
    }
    hashes.set(digest, output);
  }

  console.log(`[IMAGES] Built ${outputs.length} unique optimized dish images`);
}

main().catch((error) => {
  console.error(`[IMAGES] ${error.message}`);
  process.exit(1);
});
