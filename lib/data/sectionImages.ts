/** Section-scoped image paths — each section uses its own pool to avoid cross-section repeats. */

export const HERO_POSTER_IMAGE = "/images/catalog/restaurants/rest-pasta.jpg";

export const LIVE_HUB_IMAGES = {
  cricket: "/images/catalog/cricket-stadium.png",
  liveCooking: "/images/catalog/restaurants/rest-tandoori.jpg",
  liveCookingDish: "/images/catalog/dishes/indian/butter-chicken.webp",
  chefKitchen: "/images/catalog/restaurants/rest-bbq.jpg",
  chefDish: "/images/catalog/dishes/north-indian/tandoori-chicken.webp",
  freshDelivery: "/images/catalog/restaurants/rest-healthy.jpg",
  freshDish: "/images/catalog/dishes/beverages/fresh-orange-juice.webp",
} as const;

export const CATEGORY_NAV_IMAGES = {
  pizza: "/images/catalog/dishes/pizza/classic-margherita.webp",
  burger: "/images/catalog/dishes/burger/cheese-burger.webp",
  chicken: "/images/catalog/dishes/fast-food/fried-chicken-bucket.webp",
  biryani: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp",
  momos: "/images/catalog/dishes/chinese/veg-momos.webp",
  drinks: "/images/catalog/dishes/beverages/fresh-orange-juice.webp",
  dessert: "/images/catalog/dishes/desserts/butterscotch-ice-cream.webp",
  coffee: "/images/catalog/dishes/beverages/classic-cappuccino.webp",
  fries: "/images/catalog/dishes/burger/french-fries.webp",
  wraps: "/images/catalog/dishes/fast-food/chicken-wrap.webp",
  noodles: "/images/catalog/dishes/chinese/hakka-noodles.webp",
  sandwich: "/images/catalog/dishes/fast-food/club-sandwich.webp",
  donuts: "/images/catalog/dishes/desserts/glazed-donuts.webp",
  cakes: "/images/catalog/dishes/desserts/chocolate-cake.webp",
} as const;

export const OFFER_BANNER_IMAGES = {
  pizza: "/images/catalog/dishes/pizza/pepperoni-pizza.webp",
  burger: "/images/catalog/dishes/burger/crispy-chicken-burger.webp",
  biryani: "/images/catalog/dishes/biryani/kolkata-biryani.webp",
  drinks: "/images/catalog/dishes/beverages/iced-tea.webp",
  desserts: "/images/catalog/dishes/desserts/tiramisu-cup.webp",
} as const;

export const TESTIMONIAL_AVATARS = [
  "/images/catalog/dishes/pizza/classic-margherita.webp",
  "/images/catalog/dishes/biryani/hyderabadi-biryani.webp",
  "/images/catalog/dishes/chinese/hakka-noodles.webp",
  "/images/catalog/dishes/burger/cheese-burger.webp",
  "/images/catalog/dishes/desserts/chocolate-cake.webp",
  "/images/catalog/dishes/beverages/classic-cappuccino.webp",
  "/images/catalog/dishes/chinese/chicken-momos.webp",
  "/images/catalog/dishes/fast-food/fried-chicken-bucket.webp",
] as const;

export const BLOG_THUMBNAILS = [
  "/images/catalog/restaurants/rest-north-indian.jpg",
  "/images/catalog/dishes/dish-by-1.jpg",
  "/images/catalog/restaurants/rest-fast-food.jpg",
] as const;

export const CONTACT_HERO_IMAGE = "/images/catalog/restaurants/rest-coffee.jpg";

export const BRAND_FOOD_IMAGES_UNIQUE: Record<string, string> = {
  Subway: "/images/catalog/dishes/fast-food/veggie-sub.webp",
  "Behrouz Biryani": "/images/catalog/dishes/biryani/kolkata-biryani.webp",
  "Biryani By Kilo": "/images/catalog/dishes/biryani/mutton-biryani.webp",
  "Wow! Momo": "/images/catalog/dishes/chinese/chicken-momos.webp",
  "Haldiram's": "/images/catalog/dishes/desserts/gulab-jamun.webp",
  "Barbeque Nation": "/images/catalog/dishes/indian/butter-chicken.webp",
  Faasos: "/images/catalog/dishes/fast-food/chicken-wrap.webp",
  "Domino's Pizza": "/images/catalog/dishes/pizza/pepperoni-pizza.webp",
  KFC: "/images/catalog/dishes/fast-food/fried-chicken-bucket.webp",
  "Burger King": "/images/catalog/dishes/burger/crispy-chicken-burger.webp",
  "McDonald's": "/images/catalog/dishes/burger/cheese-burger.webp",
  "Pizza Hut": "/images/catalog/dishes/pizza/farmhouse-pizza.webp",
  "Taco Bell": "/images/catalog/dishes/mexican/loaded-nachos.webp",
  Starbucks: "/images/catalog/dishes/beverages/classic-cappuccino.webp",
  "Baskin Robbins": "/images/catalog/dishes/desserts/butterscotch-ice-cream.webp",
};

export const RESTAURANT_COVER_BY_ID: Record<string, string> = {
  "rest-cold-drinks": "/images/catalog/restaurants/rest-cold-drinks.jpg",
  "rest-pizza": "/images/catalog/restaurants/rest-pizza.jpg",
  "rest-burger": "/images/catalog/restaurants/rest-burger.jpg",
  "rest-biryani": "/images/catalog/restaurants/rest-biryani.jpg",
  "rest-south-indian": "/images/catalog/restaurants/rest-south-indian.jpg",
  "rest-chinese": "/images/catalog/restaurants/rest-chinese.jpg",
  "rest-momos": "/images/catalog/restaurants/rest-momos.jpg",
  "rest-rolls": "/images/catalog/restaurants/rest-rolls.jpg",
  "rest-sandwich": "/images/catalog/restaurants/rest-sandwich.jpg",
  "rest-icecream": "/images/catalog/restaurants/rest-icecream.jpg",
  "rest-cakes": "/images/catalog/restaurants/rest-cakes.jpg",
  "rest-coffee": "/images/catalog/restaurants/rest-coffee.jpg",
  "rest-tea": "/images/catalog/restaurants/rest-tea.jpg",
  "rest-juice": "/images/catalog/restaurants/rest-juice.jpg",
  "rest-healthy": "/images/catalog/restaurants/rest-healthy.jpg",
  "rest-thali": "/images/catalog/restaurants/rest-thali.jpg",
  "rest-seafood": "/images/catalog/restaurants/rest-seafood.jpg",
  "rest-bbq": "/images/catalog/restaurants/rest-bbq.jpg",
  "rest-pasta": "/images/catalog/restaurants/rest-pasta.jpg",
  "rest-shawarma": "/images/catalog/restaurants/rest-shawarma.jpg",
  "rest-tandoori": "/images/catalog/restaurants/rest-tandoori.jpg",
  "rest-north-indian": "/images/catalog/restaurants/rest-north-indian.jpg",
  "rest-street-food": "/images/catalog/restaurants/rest-street-food.jpg",
  "rest-bakery": "/images/catalog/restaurants/rest-bakery.jpg",
  "rest-fast-food": "/images/catalog/restaurants/rest-fast-food.jpg",
  "rest-desserts": "/images/catalog/restaurants/rest-desserts.jpg",
  "rest-salads": "/images/catalog/restaurants/rest-salads.jpg",
  "rest-smoothies": "/images/catalog/restaurants/rest-smoothies.jpg",
  "rest-milkshakes": "/images/catalog/restaurants/rest-milkshakes.jpg",
  "rest-snacks": "/images/catalog/restaurants/rest-snacks.jpg",
};
