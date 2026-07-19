import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

function ensureCopy(srcRel, destRel) {
  const srcAbs = path.join(publicDir, srcRel.startsWith('/') ? srcRel.slice(1) : srcRel);
  const destAbs = path.join(publicDir, destRel.startsWith('/') ? destRel.slice(1) : destRel);

  if (!fs.existsSync(srcAbs)) {
    console.error(`Source missing: ${srcAbs}`);
    return;
  }

  const destDir = path.dirname(destAbs);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (!fs.existsSync(destAbs) || fs.statSync(destAbs).size === 0) {
    fs.copyFileSync(srcAbs, destAbs);
    console.log(`Copied: ${srcRel} -> ${destRel}`);
  }
}

// 1. Beverages
ensureCopy('images/catalog/dishes/dish-cd-1.jpg', 'images/catalog/dishes/beverages/mountain-dew.webp');
ensureCopy('images/catalog/dishes/dish-cd-2.jpg', 'images/catalog/dishes/beverages/red-bull.webp');
ensureCopy('images/catalog/dishes/dish-cd-1.jpg', 'images/catalog/dishes/beverages/lemonade.webp');
ensureCopy('images/catalog/dishes/dish-cd-2.jpg', 'images/catalog/dishes/beverages/iced-tea.webp');

// 2. Burger
ensureCopy('images/catalog/dishes/dish-bg-1.jpg', 'images/catalog/dishes/burger/veggie-burger.webp');
ensureCopy('images/catalog/dishes/dish-bg-2.jpg', 'images/catalog/dishes/burger/french-fries.webp');

// 3. Biryani
ensureCopy('images/catalog/dishes/dish-by-1.jpg', 'images/catalog/dishes/biryani/hyderabadi-chicken-biryani.webp');
ensureCopy('images/catalog/dishes/dish-by-2.jpg', 'images/catalog/dishes/biryani/raita.webp');

// 4. Chinese
ensureCopy('images/catalog/dishes/dish-ch-1.jpg', 'images/catalog/dishes/chinese/fried-rice.webp');

// 5. Bakery
ensureCopy('images/catalog/dishes/dish-ck-1.jpg', 'images/catalog/dishes/bakery/chocolate-cake.webp');
ensureCopy('images/catalog/dishes/dish-ck-2.jpg', 'images/catalog/dishes/bakery/black-forest-cake.webp');
ensureCopy('images/catalog/dishes/dish-ck-1.jpg', 'images/catalog/dishes/bakery/red-velvet-cake.webp');
ensureCopy('images/catalog/dishes/dish-ck-2.jpg', 'images/catalog/dishes/bakery/pineapple-cake.webp');
ensureCopy('images/catalog/dishes/dish-ck-1.jpg', 'images/catalog/dishes/bakery/cupcake.webp');

// 6. Desserts / Ice Cream
ensureCopy('images/catalog/dishes/dish-ic-1.jpg', 'images/catalog/dishes/desserts/chocolate-ice-cream.webp');
ensureCopy('images/catalog/dishes/dish-ic-2.jpg', 'images/catalog/dishes/desserts/strawberry-ice-cream.webp');
ensureCopy('images/catalog/dishes/dish-ic-1.jpg', 'images/catalog/dishes/desserts/butterscotch-ice-cream.webp');
ensureCopy('images/catalog/dishes/dish-ic-2.jpg', 'images/catalog/dishes/desserts/brownie-sundae.webp');

// 7. Fast Food
ensureCopy('images/catalog/dishes/dish-ff-1.jpg', 'images/catalog/dishes/fast-food/loaded-nachos.webp');

// 8. Logos
ensureCopy('images/catalog/restaurants/logo-rest-fast-food.jpg', 'images/catalog/logos/subway.webp');

console.log('Finished copying missing images!');
