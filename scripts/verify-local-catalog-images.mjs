import fs from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'lib', 'data', '30restaurantsData.ts');
const content = fs.readFileSync(dataFile, 'utf8');

const restMatches = content.match(/export const POPULAR_RESTAURANTS_30: Restaurant30\[\] = (\[[\s\S]*?\]);/);
const dishMatches = content.match(/export const TRENDING_DISHES_60: Dish60\[\] = (\[[\s\S]*?\]);/);

const restaurants = eval(restMatches[1]);
const dishes = eval(dishMatches[1]);

let total = 0;
let missing = 0;
let empty = 0;

function verify(relPath) {
  total++;
  const full = path.join(process.cwd(), 'public', relPath);
  if (!fs.existsSync(full)) {
    console.error(`[MISSING] ${relPath}`);
    missing++;
  } else {
    const stat = fs.statSync(full);
    if (stat.size < 100) {
      console.error(`[EMPTY] ${relPath} (${stat.size} bytes)`);
      empty++;
    }
  }
}

restaurants.forEach((r) => {
  verify(r.image);
  verify(r.logo);
});

dishes.forEach((d) => {
  verify(d.image);
});

console.log(`Verification Complete: Checked ${total} local image files. Missing: ${missing}, Empty: ${empty}`);
if (missing === 0 && empty === 0) {
  console.log("SUCCESS: 100% of catalog images exist locally as valid non-empty files!");
} else {
  process.exit(1);
}
