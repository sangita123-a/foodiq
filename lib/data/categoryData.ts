export interface CategoryOption {
  id: string;
  name: string;
  emoji: string;
  image: string;
  description: string;
}

export interface CategoryDishItem {
  id: string;
  name: string;
  category: string;
  restaurantName: string;
  restaurantId: string;
  price: number;
  originalPrice: number;
  rating: string;
  deliveryTime: string;
  isVeg: boolean;
  image: string;
  description: string;
}

type DishSeed = {
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating?: string;
  isVeg?: boolean;
  restaurantName?: string;
  restaurantId?: string;
  description?: string;
  deliveryTime?: string;
};

export const CATEGORY_SLUGS = [
  "pizza",
  "burger",
  "chicken",
  "biryani",
  "momos",
  "drinks",
  "dessert",
  "coffee",
  "fries",
  "wraps",
  "noodles",
  "sandwich",
  "donuts",
  "icecream",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORIES: CategoryOption[] = [
  {
    id: "pizza",
    name: "Pizza",
    emoji: "🍕",
    image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
    description: "Hand-crafted sourdough pizzas with rich mozzarella, fresh basil, and oven-baked toppings.",
  },
  {
    id: "burger",
    name: "Burger",
    emoji: "🍔",
    image: "/images/catalog/dishes/burger/cheese-burger.webp",
    description: "Juicy flame-grilled burgers with crispy patties, melted cheddar, and secret signature sauces.",
  },
  {
    id: "chicken",
    name: "Chicken",
    emoji: "🍗",
    image: "/images/catalog/dishes/north-indian/chicken-seekh-kebab.webp",
    description: "Crispy fried, tandoori roasted, and rich gravy chicken delicacies crafted by top chefs.",
  },
  {
    id: "biryani",
    name: "Biryani",
    emoji: "🍛",
    image: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp",
    description: "Aromatic dum biryanis cooked with long-grain basmati, saffron, whole spices, and tender meat.",
  },
  {
    id: "momos",
    name: "Momos",
    emoji: "🥟",
    image: "/images/catalog/dishes/chinese/veg-momos.webp",
    description: "Steamed, fried, and tandoori momos served with fiery chili-garlic chutney and spicy dip.",
  },
  {
    id: "drinks",
    name: "Drinks",
    emoji: "🥤",
    image: "/images/catalog/dishes/beverages/coca-cola.webp",
    description: "Refreshing cold drinks, sodas, chilled mocktails, and fresh fruit juices delivered icy cold.",
  },
  {
    id: "dessert",
    name: "Dessert",
    emoji: "🍰",
    image: "/images/catalog/dishes/desserts/brownie-sundae.webp",
    description: "Indulgent brownies, cakes, ice cream sundaes, waffles, and traditional Indian sweets.",
  },
  {
    id: "coffee",
    name: "Coffee",
    emoji: "☕",
    image: "/images/catalog/dishes/beverages/classic-cappuccino.webp",
    description: "Artisanal espresso brews, creamy lattes, caramel frappes, and refreshing cold brews.",
  },
  {
    id: "fries",
    name: "Fries",
    emoji: "🍟",
    image: "/images/catalog/dishes/burger/french-fries.webp",
    description: "Golden crispy fries, peri peri seasoning, loaded cheese fries, and crunchy sides.",
  },
  {
    id: "wraps",
    name: "Wraps",
    emoji: "🌮",
    image: "/images/catalog/dishes/fast-food/chicken-wrap.webp",
    description: "Flavour-packed wraps and kathi rolls stuffed with grilled chicken, paneer, and fresh veggies.",
  },
  {
    id: "noodles",
    name: "Noodles",
    emoji: "🍜",
    image: "/images/catalog/dishes/chinese/hakka-noodles.webp",
    description: "Wok-tossed hakka noodles, schezwan spice, and saucy chow mein bowls.",
  },
  {
    id: "sandwich",
    name: "Sandwich",
    emoji: "🥪",
    image: "/images/catalog/dishes/fast-food/club-sandwich.webp",
    description: "Toasted sandwiches, club stacks, and grilled subs loaded with cheese and fresh fillings.",
  },
  {
    id: "donuts",
    name: "Donuts",
    emoji: "🍩",
    image: "/images/catalog/dishes/desserts/glazed-donuts.webp",
    description: "Freshly glazed donuts, chocolate frosted rings, and sweet bakery treats.",
  },
  {
    id: "icecream",
    name: "Ice Cream",
    emoji: "🍨",
    image: "/images/catalog/dishes/desserts/butterscotch-ice-cream.webp",
    description: "Creamy scoops, kulfi sticks, and indulgent ice cream desserts.",
  },
];

function buildDishes(
  category: string,
  seeds: DishSeed[],
  defaults: { restaurantName: string; restaurantId: string; isVeg?: boolean }
): CategoryDishItem[] {
  return seeds.map((seed, index) => ({
    id: `dish_${category}_${index + 1}`,
    name: seed.name,
    category,
    restaurantName: seed.restaurantName ?? defaults.restaurantName,
    restaurantId: seed.restaurantId ?? defaults.restaurantId,
    price: seed.price,
    originalPrice: seed.originalPrice ?? Math.round(seed.price * 1.3),
    rating: seed.rating ?? (4.5 + (index % 5) * 0.1).toFixed(1),
    deliveryTime: seed.deliveryTime ?? `${20 + (index % 4) * 5} min`,
    isVeg: seed.isVeg ?? defaults.isVeg ?? true,
    image: seed.image,
    description:
      seed.description ??
      `Freshly prepared ${seed.name.toLowerCase()} made with premium ingredients and delivered hot.`,
  }));
}

const PIZZA_DISHES = buildDishes(
  "pizza",
  [
    { name: "Margherita Pizza", image: "/images/catalog/dishes/pizza/classic-margherita.webp", price: 249, isVeg: true },
    { name: "Cheese Burst Pizza", image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp", price: 349, isVeg: true },
    { name: "Farmhouse Pizza", image: "/images/catalog/dishes/pizza/farmhouse-pizza.webp", price: 329, isVeg: true },
    { name: "Veg Loaded Pizza", image: "/images/catalog/dishes/pizza/veggie-supreme-pizza.webp", price: 299, isVeg: true },
    { name: "Pepperoni Pizza", image: "/images/catalog/dishes/pizza/pepperoni-pizza.webp", price: 449, isVeg: false },
    { name: "BBQ Chicken Pizza", image: "/images/catalog/dishes/pizza/bbq-chicken-pizza.webp", price: 399, isVeg: false },
    { name: "Mexican Pizza", image: "/images/catalog/dishes/pizza/mexican-green-wave-pizza.webp", price: 319, isVeg: true },
    { name: "Paneer Tikka Pizza", image: "/images/catalog/dishes/pizza/paneer-tikka-pizza.webp", price: 339, isVeg: true },
    { name: "Spicy Peri Peri Pizza", image: "/images/catalog/dishes/pizza/spicy-peri-peri-pizza.webp", price: 359, isVeg: false },
    { name: "Chicken Sausage Pizza", image: "/images/catalog/dishes/pizza/chicken-sausage-pizza.webp", price: 389, isVeg: false },
    { name: "Four Cheese Pizza", image: "/images/catalog/dishes/pizza/four-cheese-pizza.webp", price: 429, isVeg: true },
    { name: "Mushroom Truffle Pizza", image: "/images/catalog/dishes/pizza/mushroom-truffle-pizza.webp", price: 459, isVeg: true },
    { name: "Hawaiian Pizza", image: "/images/catalog/dishes/pizza/hawaiian-pizza.webp", price: 379, isVeg: true },
    { name: "Corn & Cheese Pizza", image: "/images/catalog/dishes/pizza/corn-and-cheese-pizza.webp", price: 279, isVeg: true },
    { name: "Tandoori Paneer Pizza", image: "/images/catalog/dishes/pizza/tandoori-pizza.webp", price: 349, isVeg: true },
    { name: "Wood Fired Margherita", image: "/images/catalog/dishes/dish-pz-1.jpg", price: 269, isVeg: true, restaurantName: "Pizza Italia Oven" },
    { name: "Smoky BBQ Overload", image: "/images/catalog/dishes/dish-pz-2.jpg", price: 469, isVeg: false, restaurantName: "Pizza Hut" },
    { name: "Personal Pan Pizza", image: "/images/catalog/dishes/fast-food/personal-pizza.webp", price: 199, isVeg: true, restaurantName: "Domino's Pizza" },
    { name: "Classic Thin Crust", image: "/images/catalog/food/pizza.webp", price: 229, isVeg: true, restaurantName: "Pizza Italia Oven" },
    { name: "Supreme Feast Pizza", image: "/images/catalog/cuisines/pizza.webp", price: 499, isVeg: false, restaurantName: "Pizza Hut" },
  ],
  { restaurantName: "Domino's Pizza", restaurantId: "rest-pizza" }
);

const BURGER_DISHES = buildDishes(
  "burger",
  [
    { name: "Veg Burger", image: "/images/catalog/dishes/burger/veg-burger.webp", price: 139, isVeg: true },
    { name: "Chicken Burger", image: "/images/catalog/dishes/burger/chicken-burger.webp", price: 199, isVeg: false },
    { name: "Double Patty Burger", image: "/images/catalog/dishes/burger/double-patty-burger.webp", price: 269, isVeg: false },
    { name: "Cheese Burger", image: "/images/catalog/dishes/burger/cheese-burger.webp", price: 169, isVeg: true },
    { name: "BBQ Chicken Burger", image: "/images/catalog/dishes/burger/bbq-chicken-burger.webp", price: 219, isVeg: false },
    { name: "Peri Peri Burger", image: "/images/catalog/dishes/burger/peri-peri-burger.webp", price: 209, isVeg: false },
    { name: "Smash Burger", image: "/images/catalog/dishes/burger/smash-burger.webp", price: 249, isVeg: false },
    { name: "Bacon Cheese Burger", image: "/images/catalog/dishes/burger/bacon-cheese-burger.webp", price: 279, isVeg: false },
    { name: "Grilled Chicken Burger", image: "/images/catalog/dishes/burger/grilled-chicken-burger.webp", price: 229, isVeg: false },
    { name: "Crispy Chicken Burger", image: "/images/catalog/dishes/burger/crispy-chicken-burger.webp", price: 199, isVeg: false },
    { name: "Mushroom Swiss Burger", image: "/images/catalog/dishes/burger/mushroom-swiss-burger.webp", price: 229, isVeg: true },
    { name: "Paneer Burger", image: "/images/catalog/dishes/burger/paneer-burger.webp", price: 179, isVeg: true },
    { name: "Aloo Tikki Burger", image: "/images/catalog/dishes/burger/aloo-tikki-burger.webp", price: 129, isVeg: true },
    { name: "Spicy Bean Burger", image: "/images/catalog/dishes/burger/spicy-bean-burger.webp", price: 149, isVeg: true },
    { name: "Veggie Supreme Burger", image: "/images/catalog/dishes/burger/veggie-burger.webp", price: 159, isVeg: true },
    { name: "Mini Slider Trio", image: "/images/catalog/dishes/burger/mini-slider-trio.webp", price: 299, isVeg: false },
    { name: "Classic Flame Burger", image: "/images/catalog/dishes/dish-bg-1.jpg", price: 189, isVeg: false, restaurantName: "McDonald's" },
    { name: "Tower Zinger Burger", image: "/images/catalog/dishes/dish-bg-2.jpg", price: 279, isVeg: false, restaurantName: "KFC" },
    { name: "Classic Fast Food Burger", image: "/images/catalog/dishes/fast-food/classic-burger.webp", price: 179, isVeg: false, restaurantName: "Burger King" },
    { name: "Loaded Hot Dog", image: "/images/catalog/dishes/fast-food/loaded-hot-dog.webp", price: 159, isVeg: false, restaurantName: "Burger Craft House" },
  ],
  { restaurantName: "Burger King", restaurantId: "rest-burger" }
);

const CHICKEN_DISHES = buildDishes(
  "chicken",
  [
    { name: "Chicken Wings", image: "/images/catalog/dishes/fast-food/chicken-nuggets.webp", price: 279, isVeg: false },
    { name: "Chicken Popcorn", image: "/images/catalog/dishes/fast-food/fried-chicken-bucket.webp", price: 219, isVeg: false },
    { name: "Grilled Chicken", image: "/images/catalog/dishes/indian/tandoori-chicken.webp", price: 349, isVeg: false },
    { name: "Chicken Tikka", image: "/images/catalog/dishes/north-indian/paneer-tikka.webp", price: 299, isVeg: false, restaurantName: "Haldiram's" },
    { name: "Chicken Bucket", image: "/images/catalog/dishes/dish-ck-1.jpg", price: 499, isVeg: false },
    { name: "Fried Chicken", image: "/images/catalog/dishes/dish-ck-2.jpg", price: 249, isVeg: false },
    { name: "Butter Chicken", image: "/images/catalog/dishes/indian/butter-chicken.webp", price: 329, isVeg: false, restaurantName: "Barbeque Nation" },
    { name: "Chicken Tikka Masala", image: "/images/catalog/dishes/indian/chicken-tikka-masala.webp", price: 319, isVeg: false },
    { name: "Chicken Korma", image: "/images/catalog/dishes/indian/chicken-korma.webp", price: 299, isVeg: false },
    { name: "Chilli Chicken", image: "/images/catalog/dishes/chinese/chilli-chicken.webp", price: 269, isVeg: false, restaurantName: "Wow! Momo" },
    { name: "Kung Pao Chicken", image: "/images/catalog/dishes/chinese/kung-pao-chicken.webp", price: 289, isVeg: false },
    { name: "Chicken Seekh Kebab", image: "/images/catalog/dishes/north-indian/chicken-seekh-kebab.webp", price: 279, isVeg: false },
    { name: "North Indian Butter Chicken", image: "/images/catalog/dishes/north-indian/north-indian-butter-chicken.webp", price: 339, isVeg: false },
    { name: "Tandoori Chicken Half", image: "/images/catalog/dishes/dish-ta-1.jpg", price: 379, isVeg: false },
    { name: "Crispy Fried Drumsticks", image: "/images/catalog/dishes/dish-ta-2.jpg", price: 259, isVeg: false },
    { name: "BBQ Chicken Platter", image: "/images/catalog/dishes/dish-bb-1.jpg", price: 449, isVeg: false, restaurantName: "Barbeque Nation" },
    { name: "Spicy Chicken Curry", image: "/images/catalog/dishes/dish-bb-2.jpg", price: 289, isVeg: false },
    { name: "Roasted Chicken Breast", image: "/images/catalog/dishes/dish-by-1.jpg", price: 319, isVeg: false },
    { name: "Herb Grilled Chicken", image: "/images/catalog/dishes/dish-by-2.jpg", price: 349, isVeg: false },
    { name: "Chicken Shawarma Plate", image: "/images/catalog/dishes/dish-sh-1.jpg", price: 229, isVeg: false, restaurantName: "Faasos" },
  ],
  { restaurantName: "KFC", restaurantId: "rest-fast-food" }
);

const BIRYANI_DISHES = buildDishes(
  "biryani",
  [
    { name: "Hyderabadi Chicken Biryani", image: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp", price: 299, isVeg: false },
    { name: "Hyderabadi Dum Biryani", image: "/images/catalog/dishes/biryani/hyderabadi-chicken-biryani.webp", price: 319, isVeg: false },
    { name: "Mutton Dum Biryani", image: "/images/catalog/dishes/biryani/mutton-biryani.webp", price: 399, isVeg: false },
    { name: "Egg Biryani", image: "/images/catalog/dishes/biryani/egg-biryani.webp", price: 219, isVeg: false },
    { name: "Veg Biryani", image: "/images/catalog/dishes/biryani/veg-biryani.webp", price: 199, isVeg: true },
    { name: "Paneer Biryani", image: "/images/catalog/dishes/biryani/paneer-biryani.webp", price: 249, isVeg: true },
    { name: "Kolkata Chicken Biryani", image: "/images/catalog/dishes/biryani/kolkata-biryani.webp", price: 319, isVeg: false },
    { name: "Lucknowi Awadhi Biryani", image: "/images/catalog/dishes/biryani/lucknowi-biryani.webp", price: 329, isVeg: false },
    { name: "Boneless Chicken Biryani", image: "/images/catalog/dishes/biryani/boneless-chicken-biryani.webp", price: 339, isVeg: false },
    { name: "Chicken Dum Biryani", image: "/images/catalog/dishes/biryani/chicken-dum-biryani.webp", price: 289, isVeg: false },
    { name: "Chicken Biryani", image: "/images/catalog/dishes/biryani/chicken-biryani.webp", price: 279, isVeg: false },
    { name: "Keema Biryani", image: "/images/catalog/dishes/biryani/keema-biryani.webp", price: 379, isVeg: false },
    { name: "Prawn Biryani", image: "/images/catalog/dishes/biryani/prawn-biryani.webp", price: 449, isVeg: false },
    { name: "Fish Biryani Pot", image: "/images/catalog/dishes/biryani/fish-biryani-pot.webp", price: 389, isVeg: false },
    { name: "Mushroom Biryani", image: "/images/catalog/dishes/biryani/mushroom-biryani.webp", price: 229, isVeg: true },
    { name: "Family Biryani Feast", image: "/images/catalog/dishes/biryani/family-biryani-feast.webp", price: 699, isVeg: false },
    { name: "Matka Handi Biryani", image: "/images/catalog/dishes/dish-by-1.jpg", price: 359, isVeg: false, restaurantName: "Behrouz Biryani" },
    { name: "Special Dum Biryani", image: "/images/catalog/dishes/dish-by-2.jpg", price: 349, isVeg: false },
    { name: "Royal Biryani Platter", image: "/images/catalog/cuisines/biryani.webp", price: 799, isVeg: false, restaurantName: "Biryani By Kilo" },
    { name: "Biryani with Raita", image: "/images/catalog/dishes/biryani/raita.webp", price: 249, isVeg: true },
  ],
  { restaurantName: "Behrouz Biryani", restaurantId: "rest-biryani" }
);

const MOMOS_DISHES = buildDishes(
  "momos",
  [
    { name: "Veg Momos", image: "/images/catalog/dishes/chinese/veg-momos.webp", price: 119, isVeg: true },
    { name: "Chicken Momos", image: "/images/catalog/dishes/chinese/chicken-momos.webp", price: 139, isVeg: false },
    { name: "Steamed Dim Sum", image: "/images/catalog/dishes/chinese/dim-sum.webp", price: 149, isVeg: true },
    { name: "Classic Veg Momos", image: "/images/catalog/dishes/dish-mo-1.jpg", price: 119, isVeg: true },
    { name: "Fried Chicken Momos", image: "/images/catalog/dishes/dish-mo-2.jpg", price: 149, isVeg: false },
    { name: "Paneer Momos", image: "/images/catalog/dishes/dish-st-1.jpg", price: 139, isVeg: true, restaurantName: "Momo House" },
    { name: "Tandoori Momos", image: "/images/catalog/dishes/dish-st-2.jpg", price: 169, isVeg: true },
    { name: "Schezwan Momos", image: "/images/catalog/dishes/chinese/spring-rolls.webp", price: 159, isVeg: true },
    { name: "Cheese Corn Momos", image: "/images/catalog/dishes/chinese/honey-chilli-potato.webp", price: 179, isVeg: true },
    { name: "Afghan Cream Momos", image: "/images/catalog/dishes/chinese/chilli-paneer.webp", price: 199, isVeg: true },
    { name: "Pan Fried Momos", image: "/images/catalog/dishes/chinese/veg-manchurian.webp", price: 159, isVeg: true },
    { name: "Jhol Momos Bowl", image: "/images/catalog/dishes/chinese/hot-and-sour-soup.webp", price: 169, isVeg: false },
    { name: "Mushroom Momos", image: "/images/catalog/dishes/chinese/fried-rice.webp", price: 139, isVeg: true },
    { name: "Wheat Veg Momos", image: "/images/catalog/dishes/chinese/veg-fried-rice.webp", price: 129, isVeg: true },
    { name: "Dragon Chicken Momos", image: "/images/catalog/dishes/chinese/chicken-fried-rice.webp", price: 179, isVeg: false },
    { name: "BBQ Grilled Momos", image: "/images/catalog/dishes/chinese/chow-mein.webp", price: 189, isVeg: false },
    { name: "Soya Crunch Momos", image: "/images/catalog/dishes/chinese/schezwan-noodles.webp", price: 139, isVeg: true },
    { name: "Cheese Blast Momos", image: "/images/catalog/dishes/dish-sn-1.jpg", price: 189, isVeg: true },
    { name: "Spicy Garlic Momos", image: "/images/catalog/dishes/dish-sn-2.jpg", price: 169, isVeg: false },
    { name: "Assorted Momos Platter", image: "/images/catalog/dishes/dish-sf-1.jpg", price: 249, isVeg: false },
  ],
  { restaurantName: "Wow! Momo", restaurantId: "rest-chinese" }
);

const DRINKS_DISHES = buildDishes(
  "drinks",
  [
    { name: "Coca Cola", image: "/images/catalog/dishes/beverages/coca-cola.webp", price: 45, isVeg: true },
    { name: "Pepsi", image: "/images/catalog/dishes/beverages/pepsi.webp", price: 40, isVeg: true },
    { name: "Sprite", image: "/images/catalog/dishes/beverages/sprite.webp", price: 40, isVeg: true },
    { name: "Fanta Orange", image: "/images/catalog/dishes/beverages/fanta.webp", price: 40, isVeg: true },
    { name: "Mountain Dew", image: "/images/catalog/dishes/beverages/mountain-dew.webp", price: 40, isVeg: true },
    { name: "Virgin Mojito", image: "/images/catalog/dishes/beverages/virgin-mojito.webp", price: 129, isVeg: true },
    { name: "Fresh Lemonade", image: "/images/catalog/dishes/beverages/lemonade.webp", price: 89, isVeg: true },
    { name: "Fresh Orange Juice", image: "/images/catalog/dishes/beverages/fresh-orange-juice.webp", price: 119, isVeg: true },
    { name: "Mango Milkshake", image: "/images/catalog/dishes/beverages/mango-shake.webp", price: 139, isVeg: true },
    { name: "Chocolate Milkshake", image: "/images/catalog/dishes/beverages/chocolate-milkshake.webp", price: 149, isVeg: true },
    { name: "Oreo Shake", image: "/images/catalog/dishes/beverages/oreo-shake.webp", price: 149, isVeg: true },
    { name: "Iced Peach Tea", image: "/images/catalog/dishes/beverages/iced-tea.webp", price: 99, isVeg: true },
    { name: "Red Bull Energy", image: "/images/catalog/dishes/beverages/red-bull.webp", price: 125, isVeg: true },
    { name: "Masala Chai Flask", image: "/images/catalog/dishes/beverages/masala-tea.webp", price: 99, isVeg: true, restaurantName: "Tea Point" },
    { name: "Cold Coffee", image: "/images/catalog/dishes/beverages/cold-coffee.webp", price: 149, isVeg: true, restaurantName: "Cafe Latte" },
    { name: "Chilled Soft Drink", image: "/images/catalog/dishes/dish-cd-1.jpg", price: 45, isVeg: true },
    { name: "Fresh Fruit Punch", image: "/images/catalog/dishes/dish-cd-2.jpg", price: 129, isVeg: true },
    { name: "Classic Mocktail", image: "/images/catalog/dishes/dish-jc-1.jpg", price: 139, isVeg: true, restaurantName: "Mocktail Bar" },
    { name: "Tropical Cooler", image: "/images/catalog/dishes/dish-jc-2.jpg", price: 119, isVeg: true },
    { name: "Sparkling Lemon Soda", image: "/images/catalog/dishes/dish-ms-1.jpg", price: 79, isVeg: true },
  ],
  { restaurantName: "Beverage Hub", restaurantId: "rest-cold-drinks" }
);

const DESSERT_DISHES = buildDishes(
  "dessert",
  [
    { name: "Chocolate Brownie Sundae", image: "/images/catalog/dishes/desserts/brownie-sundae.webp", price: 189, isVeg: true },
    { name: "Hot Chocolate Sundae", image: "/images/catalog/dishes/desserts/hot-chocolate-sundae.webp", price: 149, isVeg: true },
    { name: "Belgian Waffle", image: "/images/catalog/dishes/desserts/belgian-waffle.webp", price: 169, isVeg: true },
    { name: "New York Cheesecake", image: "/images/catalog/dishes/desserts/new-york-cheesecake.webp", price: 199, isVeg: true },
    { name: "Chocolate Cake", image: "/images/catalog/dishes/desserts/chocolate-cake.webp", price: 149, isVeg: true },
    { name: "Red Velvet Cake", image: "/images/catalog/dishes/desserts/red-velvet-cake.webp", price: 139, isVeg: true },
    { name: "Gulab Jamun", image: "/images/catalog/dishes/desserts/gulab-jamun.webp", price: 89, isVeg: true, restaurantName: "Haldiram's" },
    { name: "Rasmalai", image: "/images/catalog/dishes/desserts/rasmalai.webp", price: 119, isVeg: true, restaurantName: "Haldiram's" },
    { name: "Tiramisu Cup", image: "/images/catalog/dishes/desserts/tiramisu-cup.webp", price: 179, isVeg: true },
    { name: "Mango Pudding", image: "/images/catalog/dishes/desserts/mango-pudding.webp", price: 99, isVeg: true },
    { name: "Chocolate Mousse", image: "/images/catalog/dishes/desserts/chocolate-mousse.webp", price: 129, isVeg: true },
    { name: "Caramel Custard", image: "/images/catalog/dishes/desserts/caramel-custard.webp", price: 109, isVeg: true },
    { name: "Fudge Brownie", image: "/images/catalog/dishes/desserts/fudge-brownie.webp", price: 119, isVeg: true },
    { name: "Assorted Pastries", image: "/images/catalog/dishes/desserts/assorted-pastries.webp", price: 249, isVeg: true },
    { name: "Classic Dessert Platter", image: "/images/catalog/dishes/dish-ds-1.jpg", price: 299, isVeg: true },
    { name: "Premium Sweet Box", image: "/images/catalog/dishes/dish-ds-2.jpg", price: 349, isVeg: true },
    { name: "Black Forest Slice", image: "/images/catalog/dishes/bakery/black-forest-cake.webp", price: 159, isVeg: true },
    { name: "Pineapple Pastry", image: "/images/catalog/dishes/bakery/pineapple-cake.webp", price: 129, isVeg: true },
    { name: "Chocolate Cupcake", image: "/images/catalog/dishes/bakery/chocolate-cupcake.webp", price: 89, isVeg: true },
    { name: "Red Velvet Cupcake", image: "/images/catalog/dishes/bakery/red-velvet-cupcake.webp", price: 99, isVeg: true },
  ],
  { restaurantName: "Sweet Tooth Bakery", restaurantId: "rest-icecream" }
);

const COFFEE_DISHES = buildDishes(
  "coffee",
  [
    { name: "Cappuccino", image: "/images/catalog/dishes/beverages/classic-cappuccino.webp", price: 139, isVeg: true },
    { name: "Cafe Latte", image: "/images/catalog/dishes/beverages/cafe-latte.webp", price: 149, isVeg: true },
    { name: "Espresso", image: "/images/catalog/dishes/beverages/espresso-coffee.webp", price: 99, isVeg: true },
    { name: "Cold Coffee", image: "/images/catalog/dishes/beverages/cold-coffee.webp", price: 159, isVeg: true },
    { name: "Salted Caramel Frappe", image: "/images/catalog/dishes/beverages/salted-caramel-frappe.webp", price: 169, isVeg: true },
    { name: "Americano", image: "/images/catalog/dishes/dish-cf-1.jpg", price: 119, isVeg: true },
    { name: "Mocha Frappe", image: "/images/catalog/dishes/dish-cf-2.jpg", price: 179, isVeg: true },
    { name: "Iced Latte", image: "/images/catalog/dishes/beverages/iced-tea.webp", price: 149, isVeg: true },
    { name: "Hazelnut Latte", image: "/images/catalog/dishes/beverages/chocolate-milkshake.webp", price: 159, isVeg: true },
    { name: "Flat White", image: "/images/catalog/dishes/beverages/oreo-shake.webp", price: 149, isVeg: true },
    { name: "Cortado", image: "/images/catalog/dishes/beverages/mango-shake.webp", price: 129, isVeg: true },
    { name: "Irish Coffee", image: "/images/catalog/dishes/dish-ms-1.jpg", price: 189, isVeg: true },
    { name: "Vanilla Latte", image: "/images/catalog/dishes/dish-ms-2.jpg", price: 149, isVeg: true },
    { name: "Caramel Macchiato", image: "/images/catalog/dishes/beverages/lemonade.webp", price: 169, isVeg: true },
    { name: "Double Espresso", image: "/images/catalog/dishes/beverages/fresh-orange-juice.webp", price: 109, isVeg: true },
    { name: "Affogato", image: "/images/catalog/dishes/desserts/tiramisu-cup.webp", price: 199, isVeg: true },
    { name: "Cold Brew", image: "/images/catalog/dishes/beverages/virgin-mojito.webp", price: 139, isVeg: true },
    { name: "Turkish Coffee", image: "/images/catalog/dishes/beverages/masala-tea.webp", price: 129, isVeg: true },
    { name: "Filter Kaapi", image: "/images/catalog/dishes/dish-jc-1.jpg", price: 89, isVeg: true },
    { name: "Premium Roast Coffee", image: "/images/catalog/dishes/dish-jc-2.jpg", price: 119, isVeg: true },
  ],
  { restaurantName: "Cafe Latte", restaurantId: "rest-coffee" }
);

const FRIES_DISHES = buildDishes(
  "fries",
  [
    { name: "French Fries", image: "/images/catalog/dishes/burger/french-fries.webp", price: 99, isVeg: true },
    { name: "Peri Peri Fries", image: "/images/catalog/dishes/fast-food/peri-peri-fries.webp", price: 129, isVeg: true },
    { name: "Cheese Fries", image: "/images/catalog/dishes/fast-food/cheese-fries.webp", price: 149, isVeg: true },
    { name: "Loaded Fries", image: "/images/catalog/dishes/fast-food/loaded-nachos.webp", price: 179, isVeg: true },
    { name: "Onion Rings", image: "/images/catalog/dishes/fast-food/onion-rings.webp", price: 119, isVeg: true },
    { name: "Mozzarella Sticks", image: "/images/catalog/dishes/fast-food/mozzarella-sticks.webp", price: 159, isVeg: true },
    { name: "Nacho Cheese Bites", image: "/images/catalog/dishes/fast-food/nacho-cheese-bites.webp", price: 139, isVeg: true },
    { name: "Classic Fries Box", image: "/images/catalog/dishes/dish-ff-1.jpg", price: 109, isVeg: true },
    { name: "Spicy Fries Bucket", image: "/images/catalog/dishes/dish-ff-2.jpg", price: 149, isVeg: true },
    { name: "Masala Fries", image: "/images/catalog/dishes/fast-food/chicken-nuggets.webp", price: 119, isVeg: true },
    { name: "Garlic Aioli Fries", image: "/images/catalog/dishes/fast-food/fried-chicken-bucket.webp", price: 139, isVeg: true },
    { name: "Truffle Fries", image: "/images/catalog/dishes/fast-food/classic-burger.webp", price: 169, isVeg: true },
    { name: "BBQ Fries", image: "/images/catalog/dishes/fast-food/personal-pizza.webp", price: 149, isVeg: true },
    { name: "Sour Cream Fries", image: "/images/catalog/dishes/fast-food/veggie-sub.webp", price: 129, isVeg: true },
    { name: "Chili Cheese Fries", image: "/images/catalog/dishes/fast-food/grilled-sandwich.webp", price: 159, isVeg: true },
    { name: "Curly Fries", image: "/images/catalog/dishes/fast-food/club-sandwich.webp", price: 139, isVeg: true },
    { name: "Sweet Potato Fries", image: "/images/catalog/dishes/fast-food/paneer-wrap.webp", price: 149, isVeg: true },
    { name: "Waffle Fries", image: "/images/catalog/dishes/fast-food/chicken-wrap.webp", price: 129, isVeg: true },
    { name: "Crinkle Cut Fries", image: "/images/catalog/dishes/fast-food/loaded-hot-dog.webp", price: 109, isVeg: true },
    { name: "Family Fries Pack", image: "/images/catalog/dishes/dish-hf-1.jpg", price: 199, isVeg: true },
  ],
  { restaurantName: "McDonald's", restaurantId: "rest-fast-food" }
);

const WRAPS_DISHES = buildDishes(
  "wraps",
  [
    { name: "Chicken Wrap", image: "/images/catalog/dishes/fast-food/chicken-wrap.webp", price: 179, isVeg: false },
    { name: "Paneer Wrap", image: "/images/catalog/dishes/fast-food/paneer-wrap.webp", price: 159, isVeg: true },
    { name: "Chicken Kathi Roll", image: "/images/catalog/dishes/street-food/chicken-kathi-roll.webp", price: 189, isVeg: false },
    { name: "Paneer Kathi Roll", image: "/images/catalog/dishes/street-food/paneer-kathi-roll.webp", price: 169, isVeg: true },
    { name: "Veg Wrap", image: "/images/catalog/dishes/fast-food/veggie-sub.webp", price: 139, isVeg: true, restaurantName: "Subway" },
    { name: "Mexican Wrap", image: "/images/catalog/dishes/street-food/dabeli.webp", price: 189, isVeg: true, restaurantName: "Taco Bell" },
    { name: "Shawarma Wrap", image: "/images/catalog/dishes/dish-rl-1.jpg", price: 199, isVeg: false },
    { name: "Tandoori Wrap", image: "/images/catalog/dishes/dish-rl-2.jpg", price: 179, isVeg: false },
    { name: "Falafel Wrap", image: "/images/catalog/dishes/street-food/vada-pav.webp", price: 149, isVeg: true },
    { name: "Kebab Wrap", image: "/images/catalog/dishes/street-food/pav-bhaji.webp", price: 209, isVeg: false },
    { name: "Egg Roll Wrap", image: "/images/catalog/dishes/street-food/chole-kulche.webp", price: 129, isVeg: false },
    { name: "Cheese Burst Wrap", image: "/images/catalog/dishes/street-food/aloo-tikki-chaat.webp", price: 159, isVeg: true },
    { name: "BBQ Chicken Wrap", image: "/images/catalog/dishes/street-food/bhel-puri.webp", price: 199, isVeg: false },
    { name: "Peri Peri Wrap", image: "/images/catalog/dishes/street-food/papdi-chaat.webp", price: 189, isVeg: false },
    { name: "Hummus Veg Wrap", image: "/images/catalog/dishes/street-food/pani-puri.webp", price: 149, isVeg: true },
    { name: "Grilled Paneer Wrap", image: "/images/catalog/dishes/street-food/dahi-puri.webp", price: 169, isVeg: true },
    { name: "Spicy Bean Wrap", image: "/images/catalog/dishes/street-food/masala-corn.webp", price: 139, isVeg: true },
    { name: "Classic Roll Wrap", image: "/images/catalog/dishes/street-food/punjabi-samosa.webp", price: 119, isVeg: true },
    { name: "Double Chicken Wrap", image: "/images/catalog/dishes/street-food/kachori.webp", price: 219, isVeg: false },
    { name: "Supreme Loaded Wrap", image: "/images/catalog/dishes/street-food/bombay-sandwich.webp", price: 199, isVeg: false },
  ],
  { restaurantName: "Faasos", restaurantId: "rest-street-food" }
);

const NOODLES_DISHES = buildDishes(
  "noodles",
  [
    { name: "Hakka Noodles", image: "/images/catalog/dishes/chinese/hakka-noodles.webp", price: 179, isVeg: true },
    { name: "Schezwan Noodles", image: "/images/catalog/dishes/chinese/schezwan-noodles.webp", price: 189, isVeg: true },
    { name: "Chicken Noodles", image: "/images/catalog/dishes/chinese/chow-mein.webp", price: 219, isVeg: false },
    { name: "Veg Noodles", image: "/images/catalog/dishes/chinese/fried-rice.webp", price: 159, isVeg: true },
    { name: "Chow Mein", image: "/images/catalog/dishes/chinese/veg-fried-rice.webp", price: 169, isVeg: true },
    { name: "Chicken Fried Noodles", image: "/images/catalog/dishes/chinese/chicken-fried-rice.webp", price: 229, isVeg: false },
    { name: "Garlic Noodles", image: "/images/catalog/dishes/chinese/chilli-paneer.webp", price: 179, isVeg: true },
    { name: "Singapore Noodles", image: "/images/catalog/dishes/chinese/veg-manchurian.webp", price: 199, isVeg: true },
    { name: "Thai Basil Noodles", image: "/images/catalog/dishes/chinese/honey-chilli-potato.webp", price: 209, isVeg: true },
    { name: "Manchurian Noodles", image: "/images/catalog/dishes/chinese/hot-and-sour-soup.webp", price: 189, isVeg: true },
    { name: "Egg Noodles", image: "/images/catalog/dishes/chinese/spring-rolls.webp", price: 169, isVeg: false },
    { name: "Paneer Noodles", image: "/images/catalog/dishes/chinese/dim-sum.webp", price: 199, isVeg: true },
    { name: "Spicy Ramen Bowl", image: "/images/catalog/dishes/dish-ch-1.jpg", price: 249, isVeg: false },
    { name: "Udon Noodles", image: "/images/catalog/dishes/dish-ch-2.jpg", price: 239, isVeg: true },
    { name: "Szechuan Chicken Noodles", image: "/images/catalog/dishes/chinese/chilli-chicken.webp", price: 249, isVeg: false },
    { name: "Kung Pao Noodles", image: "/images/catalog/dishes/chinese/kung-pao-chicken.webp", price: 229, isVeg: false },
    { name: "Veg Schezwan Noodles", image: "/images/catalog/dishes/dish-si-1.jpg", price: 179, isVeg: true },
    { name: "Smoky BBQ Noodles", image: "/images/catalog/dishes/dish-si-2.jpg", price: 219, isVeg: false },
    { name: "Classic Wok Noodles", image: "/images/catalog/cuisines/chinese.webp", price: 169, isVeg: true },
    { name: "Family Noodles Pack", image: "/images/catalog/dishes/dish-ni-1.jpg", price: 399, isVeg: false },
  ],
  { restaurantName: "Wow! Momo", restaurantId: "rest-chinese" }
);

const SANDWICH_DISHES = buildDishes(
  "sandwich",
  [
    { name: "Veg Sandwich", image: "/images/catalog/dishes/fast-food/veggie-sub.webp", price: 119, isVeg: true },
    { name: "Grilled Sandwich", image: "/images/catalog/dishes/fast-food/grilled-sandwich.webp", price: 149, isVeg: true },
    { name: "Cheese Sandwich", image: "/images/catalog/dishes/street-food/bombay-sandwich.webp", price: 139, isVeg: true },
    { name: "Club Sandwich", image: "/images/catalog/dishes/fast-food/club-sandwich.webp", price: 189, isVeg: false },
    { name: "Bombay Sandwich", image: "/images/catalog/dishes/street-food/vada-pav.webp", price: 129, isVeg: true },
    { name: "Chicken Sandwich", image: "/images/catalog/dishes/bakery/chicken-puff.webp", price: 169, isVeg: false },
    { name: "Paneer Sandwich", image: "/images/catalog/dishes/bakery/veg-puff.webp", price: 149, isVeg: true },
    { name: "Egg Sandwich", image: "/images/catalog/dishes/bakery/butter-croissant.webp", price: 139, isVeg: false },
    { name: "Tuna Sandwich", image: "/images/catalog/dishes/bakery/almond-croissant.webp", price: 199, isVeg: false },
    { name: "Avocado Toast Sandwich", image: "/images/catalog/dishes/bakery/focaccia.webp", price: 179, isVeg: true },
    { name: "Caprese Sandwich", image: "/images/catalog/dishes/bakery/garlic-loaf.webp", price: 159, isVeg: true },
    { name: "BLT Sandwich", image: "/images/catalog/dishes/bakery/sourdough-bread.webp", price: 189, isVeg: false },
    { name: "Grilled Cheese", image: "/images/catalog/dishes/bakery/cheese-straw.webp", price: 129, isVeg: true },
    { name: "Subway Veg Delite", image: "/images/catalog/dishes/dish-sw-1.jpg", price: 139, isVeg: true },
    { name: "Chicken Sub", image: "/images/catalog/dishes/dish-sw-2.jpg", price: 179, isVeg: false },
    { name: "Paneer Tikka Sandwich", image: "/images/catalog/dishes/bakery/banana-bread.webp", price: 159, isVeg: true },
    { name: "Multigrain Veg Sandwich", image: "/images/catalog/dishes/bakery/blueberry-muffin.webp", price: 149, isVeg: true },
    { name: "Classic Toast Sandwich", image: "/images/catalog/dishes/bakery/cinnamon-roll.webp", price: 119, isVeg: true },
    { name: "Premium Club Stack", image: "/images/catalog/dishes/bakery/chocolate-danish.webp", price: 219, isVeg: false },
    { name: "Masala Toast Sandwich", image: "/images/catalog/dishes/bakery/choco-chip-cookies.webp", price: 109, isVeg: true },
  ],
  { restaurantName: "Subway", restaurantId: "rest-bakery" }
);

const DONUTS_DISHES = buildDishes(
  "donuts",
  [
    { name: "Chocolate Donut", image: "/images/catalog/dishes/desserts/glazed-donuts.webp", price: 79, isVeg: true },
    { name: "Strawberry Donut", image: "/images/catalog/dishes/bakery/red-velvet-cupcake.webp", price: 79, isVeg: true },
    { name: "Vanilla Glazed Donut", image: "/images/catalog/dishes/bakery/cupcake.webp", price: 69, isVeg: true },
    { name: "Caramel Donut", image: "/images/catalog/dishes/bakery/chocolate-danish.webp", price: 89, isVeg: true },
    { name: "Cinnamon Roll Donut", image: "/images/catalog/dishes/bakery/cinnamon-roll.webp", price: 89, isVeg: true },
    { name: "Blueberry Donut", image: "/images/catalog/dishes/bakery/blueberry-muffin.webp", price: 79, isVeg: true },
    { name: "Choco Chip Donut", image: "/images/catalog/dishes/bakery/choco-chip-cookies.webp", price: 79, isVeg: true },
    { name: "Red Velvet Donut", image: "/images/catalog/dishes/bakery/red-velvet-cake.webp", price: 89, isVeg: true },
    { name: "Nutella Filled Donut", image: "/images/catalog/dishes/bakery/chocolate-cupcake.webp", price: 99, isVeg: true },
    { name: "Almond Croissant Donut", image: "/images/catalog/dishes/bakery/almond-croissant.webp", price: 99, isVeg: true },
    { name: "Butter Croissant Ring", image: "/images/catalog/dishes/bakery/butter-croissant.webp", price: 89, isVeg: true },
    { name: "Pineapple Donut", image: "/images/catalog/dishes/bakery/pineapple-cake.webp", price: 79, isVeg: true },
    { name: "Black Forest Donut", image: "/images/catalog/dishes/bakery/black-forest-cake.webp", price: 89, isVeg: true },
    { name: "Banana Bread Donut", image: "/images/catalog/dishes/bakery/banana-bread.webp", price: 69, isVeg: true },
    { name: "Cheese Straw Donut", image: "/images/catalog/dishes/bakery/cheese-straw.webp", price: 79, isVeg: true },
    { name: "Classic Sweet Donut", image: "/images/catalog/dishes/dish-bk-1.jpg", price: 69, isVeg: true },
    { name: "Premium Frosted Donut", image: "/images/catalog/dishes/dish-bk-2.jpg", price: 89, isVeg: true },
    { name: "Assorted Donut Box", image: "/images/catalog/dishes/desserts/assorted-pastries.webp", price: 219, isVeg: true },
    { name: "Fudge Donut", image: "/images/catalog/dishes/desserts/fudge-brownie.webp", price: 79, isVeg: true },
    { name: "Glazed Ring Donut", image: "/images/catalog/dishes/desserts/chocolate-cake.webp", price: 69, isVeg: true },
  ],
  { restaurantName: "Sweet Tooth Bakery", restaurantId: "rest-icecream" }
);

const ICECREAM_DISHES = buildDishes(
  "icecream",
  [
    { name: "Chocolate Ice Cream", image: "/images/catalog/dishes/desserts/chocolate-ice-cream.webp", price: 89, isVeg: true },
    { name: "Vanilla Ice Cream", image: "/images/catalog/dishes/desserts/vanilla-ice-cream.webp", price: 79, isVeg: true },
    { name: "Butterscotch Ice Cream", image: "/images/catalog/dishes/desserts/butterscotch-ice-cream.webp", price: 89, isVeg: true },
    { name: "Strawberry Ice Cream", image: "/images/catalog/dishes/desserts/strawberry-ice-cream.webp", price: 89, isVeg: true },
    { name: "Hot Chocolate Sundae", image: "/images/catalog/dishes/desserts/hot-chocolate-sundae.webp", price: 149, isVeg: true },
    { name: "Brownie Sundae", image: "/images/catalog/dishes/desserts/brownie-sundae.webp", price: 169, isVeg: true },
    { name: "Classic Ice Cream Cup", image: "/images/catalog/dishes/dish-ic-1.jpg", price: 99, isVeg: true },
    { name: "Premium Ice Cream Scoop", image: "/images/catalog/dishes/dish-ic-2.jpg", price: 109, isVeg: true },
    { name: "Mango Ice Cream", image: "/images/catalog/dishes/desserts/mango-pudding.webp", price: 89, isVeg: true },
    { name: "Kulfi Stick", image: "/images/catalog/dishes/desserts/rasmalai.webp", price: 99, isVeg: true, restaurantName: "Haldiram's" },
    { name: "Cone Ice Cream", image: "/images/catalog/dishes/desserts/caramel-custard.webp", price: 119, isVeg: true },
    { name: "Cookie Dough Ice Cream", image: "/images/catalog/dishes/desserts/chocolate-mousse.webp", price: 129, isVeg: true },
    { name: "Pistachio Ice Cream", image: "/images/catalog/dishes/desserts/tiramisu-cup.webp", price: 119, isVeg: true },
    { name: "Rocky Road Ice Cream", image: "/images/catalog/dishes/desserts/new-york-cheesecake.webp", price: 129, isVeg: true },
    { name: "Mint Chip Ice Cream", image: "/images/catalog/dishes/desserts/belgian-waffle.webp", price: 109, isVeg: true },
    { name: "Coffee Ice Cream", image: "/images/catalog/dishes/beverages/cold-coffee.webp", price: 99, isVeg: true },
    { name: "Fruit Overload Ice Cream", image: "/images/catalog/dishes/beverages/mango-shake.webp", price: 119, isVeg: true },
    { name: "Triple Scoop Sundae", image: "/images/catalog/dishes/desserts/red-velvet-cake.webp", price: 179, isVeg: true },
    { name: "Family Ice Cream Tub", image: "/images/catalog/dishes/desserts/gulab-jamun.webp", price: 299, isVeg: true },
    { name: "Belgian Waffle Ice Cream", image: "/images/catalog/dishes/desserts/fudge-brownie.webp", price: 189, isVeg: true },
  ],
  { restaurantName: "Baskin Robbins", restaurantId: "rest-icecream" }
);

export const CATEGORY_DISHES: Record<CategorySlug, CategoryDishItem[]> = {
  pizza: PIZZA_DISHES,
  burger: BURGER_DISHES,
  chicken: CHICKEN_DISHES,
  biryani: BIRYANI_DISHES,
  momos: MOMOS_DISHES,
  drinks: DRINKS_DISHES,
  dessert: DESSERT_DISHES,
  coffee: COFFEE_DISHES,
  fries: FRIES_DISHES,
  wraps: WRAPS_DISHES,
  noodles: NOODLES_DISHES,
  sandwich: SANDWICH_DISHES,
  donuts: DONUTS_DISHES,
  icecream: ICECREAM_DISHES,
};

const ALL_DISHES = Object.values(CATEGORY_DISHES).flat();
const DISH_BY_ID = new Map(ALL_DISHES.map((dish) => [dish.id, dish]));

export function isCategorySlug(slug: string): slug is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(slug);
}

export function getCategoryBySlug(slug: string): CategoryOption | undefined {
  return CATEGORIES.find((category) => category.id === slug);
}

export function getCategoryDishes(slug: string): CategoryDishItem[] {
  if (!isCategorySlug(slug)) return [];
  return CATEGORY_DISHES[slug];
}

export function getCategoryDishById(id: string): CategoryDishItem | undefined {
  return DISH_BY_ID.get(id);
}

export function isCategoryDishId(id: string): boolean {
  return DISH_BY_ID.has(id);
}
