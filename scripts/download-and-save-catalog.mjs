import fs from 'fs';
import path from 'path';

const REST_DIR = path.join(process.cwd(), 'public', 'images', 'catalog', 'restaurants');
const DISH_DIR = path.join(process.cwd(), 'public', 'images', 'catalog', 'dishes');

fs.mkdirSync(REST_DIR, { recursive: true });
fs.mkdirSync(DISH_DIR, { recursive: true });

// Verified working Unsplash image URLs per category
const CATEGORY_MAP = {
  "Cold Drinks": {
    cover: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
  },
  Pizza: {
    cover: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
  },
  Burger: {
    cover: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
  },
  Biryani: {
    cover: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
  },
  "South Indian": {
    cover: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
  },
  Chinese: {
    cover: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&auto=format&fit=crop&q=80",
  },
  Momos: {
    cover: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80",
  },
  Rolls: {
    cover: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
  },
  Sandwich: {
    cover: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80",
  },
  "Ice Cream": {
    cover: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80",
  },
  Cakes: {
    cover: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
  },
  Coffee: {
    cover: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
  },
  Tea: {
    cover: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
  },
  Juice: {
    cover: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
  },
  "Healthy Food": {
    cover: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80",
  },
  Thali: {
    cover: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
  },
  Seafood: {
    cover: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80",
  },
  BBQ: {
    cover: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
  },
  Pasta: {
    cover: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
  },
  Shawarma: {
    cover: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80",
  },
  Tandoori: {
    cover: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80",
  },
  "North Indian": {
    cover: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
  },
  "Street Food": {
    cover: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
  },
  Bakery: {
    cover: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
  },
  "Fast Food": {
    cover: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80",
  },
  Desserts: {
    cover: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80",
  },
  Salads: {
    cover: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80",
  },
  Smoothies: {
    cover: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80",
  },
  Milkshakes: {
    cover: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
  },
  Snacks: {
    cover: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=150&auto=format&fit=crop&q=80",
    dish1: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80",
    dish2: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80",
  },
};

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      console.warn(`[WARN] HTTP ${res.status} for ${url}`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 500) {
      console.warn(`[WARN] Too small buffer (${buffer.length} bytes) for ${url}`);
      return false;
    }
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.error(`[ERR] Failed to download ${url}: ${err.message}`);
    return false;
  }
}

// Minimal fallback SVG generator in case download fails
function createFallbackJpg(destPath, label, color = '#FC8019') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#F8FAFC"/>
    <rect width="560" height="360" x="20" y="20" rx="20" fill="${color}" opacity="0.1"/>
    <circle cx="300" cy="180" r="60" fill="${color}" opacity="0.8"/>
    <text x="300" y="290" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#0F172A" text-anchor="middle">${label}</text>
    <text x="300" y="325" font-family="Arial, sans-serif" font-size="16" fill="#64748B" text-anchor="middle">Foodiq Quality Choice</text>
  </svg>`;
  fs.writeFileSync(destPath.replace(/\.jpg$/, '.svg'), svg);
}

async function run() {
  console.log("Starting catalog image download...");
  const dataFile = path.join(process.cwd(), 'lib', 'data', '30restaurantsData.ts');
  let dataContent = fs.readFileSync(dataFile, 'utf8');

  // Regex to extract restaurants array
  const restMatches = dataContent.match(/export const POPULAR_RESTAURANTS_30: Restaurant30\[\] = (\[[\s\S]*?\]);/);
  const dishMatches = dataContent.match(/export const TRENDING_DISHES_60: Dish60\[\] = (\[[\s\S]*?\]);/);

  if (!restMatches || !dishMatches) {
    console.error("Could not parse 30restaurantsData.ts arrays");
    return;
  }

  // Parse arrays safely
  const restaurants = eval(restMatches[1]);
  const dishes = eval(dishMatches[1]);

  console.log(`Processing ${restaurants.length} restaurants and ${dishes.length} dishes...`);

  // Process restaurants
  for (const r of restaurants) {
    const category = r.category;
    const catImages = CATEGORY_MAP[category] || CATEGORY_MAP["Pizza"];

    const coverFileName = `${r.id}.jpg`;
    const logoFileName = `logo-${r.id}.jpg`;

    const coverPath = path.join(REST_DIR, coverFileName);
    const logoPath = path.join(REST_DIR, logoFileName);

    let okCover = await downloadFile(r.image, coverPath);
    if (!okCover) {
      console.log(`Falling back for ${r.id} cover`);
      okCover = await downloadFile(catImages.cover, coverPath);
    }
    if (!okCover) {
      createFallbackJpg(coverPath, r.name, '#FC8019');
    }

    let okLogo = await downloadFile(r.logo, logoPath);
    if (!okLogo) {
      console.log(`Falling back for ${r.id} logo`);
      okLogo = await downloadFile(catImages.logo, logoPath);
    }
    if (!okLogo) {
      createFallbackJpg(logoPath, r.name, '#0F172A');
    }

    r.image = `/images/catalog/restaurants/${fs.existsSync(coverPath) ? coverFileName : coverFileName.replace(/\.jpg$/, '.svg')}`;
    r.logo = `/images/catalog/restaurants/${fs.existsSync(logoPath) ? logoFileName : logoFileName.replace(/\.jpg$/, '.svg')}`;
  }

  // Process dishes
  for (let idx = 0; idx < dishes.length; idx++) {
    const d = dishes[idx];
    const category = d.category;
    const catImages = CATEGORY_MAP[category] || CATEGORY_MAP["Pizza"];
    const dishFileName = `${d.id}.jpg`;
    const dishPath = path.join(DISH_DIR, dishFileName);

    const fallbackUrl = idx % 2 === 0 ? catImages.dish1 : catImages.dish2;
    let okDish = await downloadFile(d.image, dishPath);
    if (!okDish) {
      console.log(`Falling back for dish ${d.id}`);
      okDish = await downloadFile(fallbackUrl, dishPath);
    }
    if (!okDish) {
      createFallbackJpg(dishPath, d.name, '#10B981');
    }

    d.image = `/images/catalog/dishes/${fs.existsSync(dishPath) ? dishFileName : dishFileName.replace(/\.jpg$/, '.svg')}`;
  }

  // Write updated data back to 30restaurantsData.ts
  const updatedContent = `export interface Restaurant30 {
  id: string;
  name: string;
  category: string;
  image: string;
  logo: string;
  rating: string;
  reviewsCount: number;
  time: string;
  deliveryFee: string;
  priceForTwo: string;
  cuisine: string;
  isVeg: boolean;
  isOpen: boolean;
  offer?: string;
  location: string;
}

export interface Dish60 {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  rating: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  isVeg: boolean;
  isBestseller: boolean;
  category: string;
}

export const POPULAR_RESTAURANTS_30: Restaurant30[] = ${JSON.stringify(restaurants, null, 2)};

export const TRENDING_DISHES_60: Dish60[] = ${JSON.stringify(dishes, null, 2)};
`;

  fs.writeFileSync(dataFile, updatedContent, 'utf8');
  console.log("Successfully downloaded catalog images and updated 30restaurantsData.ts!");
}

run();
