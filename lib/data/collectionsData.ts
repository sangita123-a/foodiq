export interface CollectionMeta {
  slug: string;
  emoji: string;
  title: string;
  description: string;
  itemCount: string;
  coverImage: string;
  bannerImage: string;
}

export interface CollectionDishItem {
  id: string;
  name: string;
  collection: string;
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

export const COLLECTION_SLUGS = [
  "pizza-deals",
  "biryani-specials",
  "burger-lovers",
  "summer-drinks",
  "sweet-desserts",
  "spicy-indian",
] as const;

export type CollectionSlug = (typeof COLLECTION_SLUGS)[number];

export const FEATURED_COLLECTIONS: CollectionMeta[] = [
  {
    slug: "pizza-deals",
    emoji: "🍕",
    title: "Best Pizza Deals",
    description: "Hot oven-fresh pizzas at unbeatable prices.",
    itemCount: "25+ Items",
    coverImage: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
    bannerImage: "/images/catalog/dishes/pizza/pepperoni-pizza.webp",
  },
  {
    slug: "biryani-specials",
    emoji: "🍛",
    title: "Biryani Specials",
    description: "Aromatic dum biryanis from legendary kitchens.",
    itemCount: "25+ Items",
    coverImage: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp",
    bannerImage: "/images/catalog/dishes/biryani/chicken-dum-biryani.webp",
  },
  {
    slug: "burger-lovers",
    emoji: "🍔",
    title: "Burger Lovers",
    description: "Juicy patties, melted cheese, and bold flavours.",
    itemCount: "22+ Items",
    coverImage: "/images/catalog/dishes/burger/double-patty-burger.webp",
    bannerImage: "/images/catalog/dishes/burger/smash-burger.webp",
  },
  {
    slug: "summer-drinks",
    emoji: "🥤",
    title: "Summer Drinks",
    description: "Icy coolers, shakes, and refreshing sips.",
    itemCount: "24+ Items",
    coverImage: "/images/catalog/dishes/beverages/virgin-mojito.webp",
    bannerImage: "/images/catalog/dishes/beverages/mango-shake.webp",
  },
  {
    slug: "sweet-desserts",
    emoji: "🍰",
    title: "Sweet Desserts",
    description: "Indulgent cakes, sundaes, and sweet treats.",
    itemCount: "25+ Items",
    coverImage: "/images/catalog/dishes/desserts/brownie-sundae.webp",
    bannerImage: "/images/catalog/dishes/desserts/new-york-cheesecake.webp",
  },
  {
    slug: "spicy-indian",
    emoji: "🌶️",
    title: "Spicy Indian Meals",
    description: "Fiery curries, tandoori, and bold Indian spice.",
    itemCount: "25+ Items",
    coverImage: "/images/catalog/dishes/indian/butter-chicken.webp",
    bannerImage: "/images/catalog/dishes/north-indian/kadhai-paneer.webp",
  },
];

function buildCollectionDishes(
  slug: string,
  seeds: DishSeed[],
  defaults: { restaurantName: string; restaurantId: string; isVeg?: boolean }
): CollectionDishItem[] {
  return seeds.map((seed, index) => ({
    id: `coll_${slug.replace(/-/g, "_")}_${index + 1}`,
    name: seed.name,
    collection: slug,
    restaurantName: seed.restaurantName ?? defaults.restaurantName,
    restaurantId: seed.restaurantId ?? defaults.restaurantId,
    price: seed.price,
    originalPrice: seed.originalPrice ?? Math.round(seed.price * 1.35),
    rating: seed.rating ?? (4.4 + (index % 6) * 0.1).toFixed(1),
    deliveryTime: seed.deliveryTime ?? `${18 + (index % 5) * 4} min`,
    isVeg: seed.isVeg ?? defaults.isVeg ?? true,
    image: seed.image,
    description:
      seed.description ??
      `Premium ${seed.name.toLowerCase()} from our curated ${slug.replace(/-/g, " ")} collection.`,
  }));
}

const PIZZA_DEALS = buildCollectionDishes(
  "pizza-deals",
  [
    { name: "Deal: Classic Margherita", image: "/images/catalog/dishes/pizza/classic-margherita.webp", price: 199, isVeg: true },
    { name: "Deal: Cheese Burst Feast", image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp", price: 299, isVeg: true },
    { name: "Deal: Farmhouse Loaded", image: "/images/catalog/dishes/pizza/farmhouse-pizza.webp", price: 279, isVeg: true },
    { name: "Deal: Veggie Supreme", image: "/images/catalog/dishes/pizza/veggie-supreme-pizza.webp", price: 259, isVeg: true },
    { name: "Deal: Pepperoni Overload", image: "/images/catalog/dishes/pizza/pepperoni-pizza.webp", price: 379, isVeg: false },
    { name: "Deal: BBQ Chicken Blaze", image: "/images/catalog/dishes/pizza/bbq-chicken-pizza.webp", price: 329, isVeg: false },
    { name: "Deal: Mexican Green Wave", image: "/images/catalog/dishes/pizza/mexican-green-wave-pizza.webp", price: 269, isVeg: true },
    { name: "Deal: Paneer Tikka Special", image: "/images/catalog/dishes/pizza/paneer-tikka-pizza.webp", price: 289, isVeg: true },
    { name: "Deal: Peri Peri Chicken", image: "/images/catalog/dishes/pizza/spicy-peri-peri-pizza.webp", price: 319, isVeg: false },
    { name: "Deal: Chicken Sausage Max", image: "/images/catalog/dishes/pizza/chicken-sausage-pizza.webp", price: 349, isVeg: false },
    { name: "Deal: Four Cheese Melt", image: "/images/catalog/dishes/pizza/four-cheese-pizza.webp", price: 359, isVeg: true },
    { name: "Deal: Mushroom Truffle", image: "/images/catalog/dishes/pizza/mushroom-truffle-pizza.webp", price: 389, isVeg: true },
    { name: "Deal: Hawaiian Paradise", image: "/images/catalog/dishes/pizza/hawaiian-pizza.webp", price: 309, isVeg: true },
    { name: "Deal: Corn & Cheese Delight", image: "/images/catalog/dishes/pizza/corn-and-cheese-pizza.webp", price: 229, isVeg: true },
    { name: "Deal: Tandoori Paneer", image: "/images/catalog/dishes/pizza/tandoori-pizza.webp", price: 299, isVeg: true },
    { name: "Deal: Wood Fired Special", image: "/images/catalog/dishes/dish-pz-1.jpg", price: 249, isVeg: true },
    { name: "Deal: Smoky BBQ Overload", image: "/images/catalog/dishes/dish-pz-2.jpg", price: 399, isVeg: false },
    { name: "Deal: Personal Pan Combo", image: "/images/catalog/dishes/fast-food/personal-pizza.webp", price: 179, isVeg: true },
    { name: "Deal: Thin Crust Classic", image: "/images/catalog/food/pizza.webp", price: 219, isVeg: true },
    { name: "Deal: Family Feast Pizza", image: "/images/catalog/cuisines/pizza.webp", price: 449, isVeg: false },
    { name: "Deal: Weekend Mega Offer", image: "/images/catalog/dishes/pizza/classic-margherita.webp", price: 189, isVeg: true, description: "Limited weekend offer on our best-selling margherita." },
    { name: "Deal: Combo Cheese Burst", image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp", price: 319, isVeg: true },
    { name: "Deal: Spicy Inferno Pizza", image: "/images/catalog/dishes/pizza/spicy-peri-peri-pizza.webp", price: 339, isVeg: false },
    { name: "Deal: Gourmet Supreme", image: "/images/catalog/dishes/pizza/farmhouse-pizza.webp", price: 369, isVeg: true },
    { name: "Deal: Midnight Munch Pizza", image: "/images/catalog/dishes/pizza/pepperoni-pizza.webp", price: 359, isVeg: false },
  ],
  { restaurantName: "Domino's Pizza", restaurantId: "rest-pizza" }
);

const BIRYANI_SPECIALS = buildCollectionDishes(
  "biryani-specials",
  [
    { name: "Special: Hyderabadi Dum", image: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp", price: 289, isVeg: false },
    { name: "Special: Royal Chicken Dum", image: "/images/catalog/dishes/biryani/hyderabadi-chicken-biryani.webp", price: 309, isVeg: false },
    { name: "Special: Mutton Handi", image: "/images/catalog/dishes/biryani/mutton-biryani.webp", price: 389, isVeg: false },
    { name: "Special: Egg Dum Biryani", image: "/images/catalog/dishes/biryani/egg-biryani.webp", price: 199, isVeg: false },
    { name: "Special: Garden Veg Dum", image: "/images/catalog/dishes/biryani/veg-biryani.webp", price: 179, isVeg: true },
    { name: "Special: Paneer Tikka Biryani", image: "/images/catalog/dishes/biryani/paneer-biryani.webp", price: 239, isVeg: true },
    { name: "Special: Kolkata Style", image: "/images/catalog/dishes/biryani/kolkata-biryani.webp", price: 299, isVeg: false },
    { name: "Special: Lucknowi Awadhi", image: "/images/catalog/dishes/biryani/lucknowi-biryani.webp", price: 319, isVeg: false },
    { name: "Special: Boneless Chicken", image: "/images/catalog/dishes/biryani/boneless-chicken-biryani.webp", price: 329, isVeg: false },
    { name: "Special: Chicken Handi Dum", image: "/images/catalog/dishes/biryani/chicken-dum-biryani.webp", price: 279, isVeg: false },
    { name: "Special: Classic Chicken", image: "/images/catalog/dishes/biryani/chicken-biryani.webp", price: 269, isVeg: false },
    { name: "Special: Keema Dum Biryani", image: "/images/catalog/dishes/biryani/keema-biryani.webp", price: 359, isVeg: false },
    { name: "Special: Prawn Dum Pot", image: "/images/catalog/dishes/biryani/prawn-biryani.webp", price: 429, isVeg: false },
    { name: "Special: Malabar Fish Pot", image: "/images/catalog/dishes/biryani/fish-biryani-pot.webp", price: 369, isVeg: false },
    { name: "Special: Mushroom Dum", image: "/images/catalog/dishes/biryani/mushroom-biryani.webp", price: 219, isVeg: true },
    { name: "Special: Family Feast Pack", image: "/images/catalog/dishes/biryani/family-biryani-feast.webp", price: 649, isVeg: false },
    { name: "Special: Matka Handi Biryani", image: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp", price: 339, isVeg: false, restaurantName: "Behrouz Biryani" },
    { name: "Special: Saffron Royal Pack", image: "/images/catalog/cuisines/biryani.webp", price: 499, isVeg: false },
    { name: "Special: Chef's Signature Dum", image: "/images/catalog/dishes/biryani/chicken-dum-biryani.webp", price: 349, isVeg: false },
    { name: "Special: Premium Mutton Pot", image: "/images/catalog/dishes/biryani/mutton-biryani.webp", price: 419, isVeg: false },
    { name: "Special: Raita Combo Biryani", image: "/images/catalog/dishes/biryani/raita.webp", price: 229, isVeg: true },
    { name: "Special: Double Egg Dum", image: "/images/catalog/dishes/biryani/egg-biryani.webp", price: 249, isVeg: false },
    { name: "Special: Nawabi Chicken", image: "/images/catalog/dishes/biryani/lucknowi-biryani.webp", price: 359, isVeg: false },
    { name: "Special: Kolkata Potato Egg", image: "/images/catalog/dishes/biryani/kolkata-biryani.webp", price: 329, isVeg: false },
    { name: "Special: Grand Feast Biryani", image: "/images/catalog/dishes/biryani/family-biryani-feast.webp", price: 799, isVeg: false },
  ],
  { restaurantName: "Behrouz Biryani", restaurantId: "rest-biryani" }
);

const BURGER_LOVERS = buildCollectionDishes(
  "burger-lovers",
  [
    { name: "Lover's Veg Classic", image: "/images/catalog/dishes/burger/veg-burger.webp", price: 129, isVeg: true },
    { name: "Lover's Crispy Chicken", image: "/images/catalog/dishes/burger/chicken-burger.webp", price: 189, isVeg: false },
    { name: "Lover's Double Patty", image: "/images/catalog/dishes/burger/double-patty-burger.webp", price: 249, isVeg: false },
    { name: "Lover's Cheese Melt", image: "/images/catalog/dishes/burger/cheese-burger.webp", price: 159, isVeg: true },
    { name: "Lover's BBQ Chicken", image: "/images/catalog/dishes/burger/bbq-chicken-burger.webp", price: 209, isVeg: false },
    { name: "Lover's Peri Peri", image: "/images/catalog/dishes/burger/peri-peri-burger.webp", price: 199, isVeg: false },
    { name: "Lover's Smash Patty", image: "/images/catalog/dishes/burger/smash-burger.webp", price: 239, isVeg: false },
    { name: "Lover's Bacon Cheese", image: "/images/catalog/dishes/burger/bacon-cheese-burger.webp", price: 269, isVeg: false },
    { name: "Lover's Grilled Chicken", image: "/images/catalog/dishes/burger/grilled-chicken-burger.webp", price: 219, isVeg: false },
    { name: "Lover's Crispy Zinger", image: "/images/catalog/dishes/burger/crispy-chicken-burger.webp", price: 199, isVeg: false },
    { name: "Lover's Mushroom Swiss", image: "/images/catalog/dishes/burger/mushroom-swiss-burger.webp", price: 219, isVeg: true },
    { name: "Lover's Paneer Patty", image: "/images/catalog/dishes/burger/paneer-burger.webp", price: 169, isVeg: true },
    { name: "Lover's Aloo Tikki", image: "/images/catalog/dishes/burger/aloo-tikki-burger.webp", price: 119, isVeg: true },
    { name: "Lover's Spicy Bean", image: "/images/catalog/dishes/burger/spicy-bean-burger.webp", price: 139, isVeg: true },
    { name: "Lover's Veggie Supreme", image: "/images/catalog/dishes/burger/veggie-burger.webp", price: 149, isVeg: true },
    { name: "Lover's Slider Trio", image: "/images/catalog/dishes/burger/mini-slider-trio.webp", price: 279, isVeg: false },
    { name: "Lover's Flame Grilled", image: "/images/catalog/dishes/dish-bg-1.jpg", price: 179, isVeg: false },
    { name: "Lover's Tower Zinger", image: "/images/catalog/dishes/dish-bg-2.jpg", price: 259, isVeg: false },
    { name: "Lover's Classic Stack", image: "/images/catalog/dishes/fast-food/classic-burger.webp", price: 169, isVeg: false },
    { name: "Lover's Loaded Hot Dog", image: "/images/catalog/dishes/fast-food/loaded-hot-dog.webp", price: 149, isVeg: false },
    { name: "Lover's Mega Combo", image: "/images/catalog/dishes/burger/double-patty-burger.webp", price: 299, isVeg: false },
    { name: "Lover's Cheesy Deluxe", image: "/images/catalog/dishes/burger/cheese-burger.webp", price: 189, isVeg: true },
  ],
  { restaurantName: "Burger King", restaurantId: "rest-burger" }
);

const SUMMER_DRINKS = buildCollectionDishes(
  "summer-drinks",
  [
    { name: "Summer: Chilled Cola", image: "/images/catalog/dishes/beverages/coca-cola.webp", price: 40, isVeg: true },
    { name: "Summer: Classic Pepsi", image: "/images/catalog/dishes/beverages/pepsi.webp", price: 40, isVeg: true },
    { name: "Summer: Sparkling Sprite", image: "/images/catalog/dishes/beverages/sprite.webp", price: 40, isVeg: true },
    { name: "Summer: Fanta Orange", image: "/images/catalog/dishes/beverages/fanta.webp", price: 40, isVeg: true },
    { name: "Summer: Mountain Dew", image: "/images/catalog/dishes/beverages/mountain-dew.webp", price: 40, isVeg: true },
    { name: "Summer: Virgin Mojito", image: "/images/catalog/dishes/beverages/virgin-mojito.webp", price: 119, isVeg: true },
    { name: "Summer: Fresh Lemonade", image: "/images/catalog/dishes/beverages/lemonade.webp", price: 79, isVeg: true },
    { name: "Summer: Orange Juice", image: "/images/catalog/dishes/beverages/fresh-orange-juice.webp", price: 109, isVeg: true },
    { name: "Summer: Mango Shake", image: "/images/catalog/dishes/beverages/mango-shake.webp", price: 129, isVeg: true },
    { name: "Summer: Chocolate Shake", image: "/images/catalog/dishes/beverages/chocolate-milkshake.webp", price: 139, isVeg: true },
    { name: "Summer: Oreo Blast", image: "/images/catalog/dishes/beverages/oreo-shake.webp", price: 139, isVeg: true },
    { name: "Summer: Iced Peach Tea", image: "/images/catalog/dishes/beverages/iced-tea.webp", price: 89, isVeg: true },
    { name: "Summer: Red Bull Boost", image: "/images/catalog/dishes/beverages/red-bull.webp", price: 115, isVeg: true },
    { name: "Summer: Masala Chai Flask", image: "/images/catalog/dishes/beverages/masala-tea.webp", price: 89, isVeg: true },
    { name: "Summer: Iced Cold Coffee", image: "/images/catalog/dishes/beverages/cold-coffee.webp", price: 139, isVeg: true },
    { name: "Summer: Chilled Cooler", image: "/images/catalog/dishes/dish-cd-1.jpg", price: 49, isVeg: true },
    { name: "Summer: Fruit Punch", image: "/images/catalog/dishes/dish-cd-2.jpg", price: 119, isVeg: true },
    { name: "Summer: Tropical Mocktail", image: "/images/catalog/dishes/dish-jc-1.jpg", price: 129, isVeg: true },
    { name: "Summer: Citrus Cooler", image: "/images/catalog/dishes/dish-jc-2.jpg", price: 109, isVeg: true },
    { name: "Summer: Sparkling Soda", image: "/images/catalog/dishes/dish-ms-1.jpg", price: 69, isVeg: true },
    { name: "Summer: Caramel Frappe", image: "/images/catalog/dishes/beverages/salted-caramel-frappe.webp", price: 149, isVeg: true },
    { name: "Summer: Cafe Latte Iced", image: "/images/catalog/dishes/beverages/cafe-latte.webp", price: 139, isVeg: true },
    { name: "Summer: Espresso Shot", image: "/images/catalog/dishes/beverages/espresso-coffee.webp", price: 99, isVeg: true },
    { name: "Summer: Cappuccino Chill", image: "/images/catalog/dishes/beverages/classic-cappuccino.webp", price: 129, isVeg: true },
  ],
  { restaurantName: "Beverage Hub", restaurantId: "rest-cold-drinks" }
);

const SWEET_DESSERTS = buildCollectionDishes(
  "sweet-desserts",
  [
    { name: "Sweet: Brownie Sundae", image: "/images/catalog/dishes/desserts/brownie-sundae.webp", price: 169, isVeg: true },
    { name: "Sweet: Hot Chocolate Sundae", image: "/images/catalog/dishes/desserts/hot-chocolate-sundae.webp", price: 139, isVeg: true },
    { name: "Sweet: Belgian Waffle", image: "/images/catalog/dishes/desserts/belgian-waffle.webp", price: 159, isVeg: true },
    { name: "Sweet: NY Cheesecake", image: "/images/catalog/dishes/desserts/new-york-cheesecake.webp", price: 189, isVeg: true },
    { name: "Sweet: Chocolate Cake", image: "/images/catalog/dishes/desserts/chocolate-cake.webp", price: 139, isVeg: true },
    { name: "Sweet: Red Velvet Slice", image: "/images/catalog/dishes/desserts/red-velvet-cake.webp", price: 129, isVeg: true },
    { name: "Sweet: Gulab Jamun", image: "/images/catalog/dishes/desserts/gulab-jamun.webp", price: 79, isVeg: true },
    { name: "Sweet: Rasmalai", image: "/images/catalog/dishes/desserts/rasmalai.webp", price: 109, isVeg: true },
    { name: "Sweet: Tiramisu Cup", image: "/images/catalog/dishes/desserts/tiramisu-cup.webp", price: 169, isVeg: true },
    { name: "Sweet: Mango Pudding", image: "/images/catalog/dishes/desserts/mango-pudding.webp", price: 89, isVeg: true },
    { name: "Sweet: Chocolate Mousse", image: "/images/catalog/dishes/desserts/chocolate-mousse.webp", price: 119, isVeg: true },
    { name: "Sweet: Caramel Custard", image: "/images/catalog/dishes/desserts/caramel-custard.webp", price: 99, isVeg: true },
    { name: "Sweet: Fudge Brownie", image: "/images/catalog/dishes/desserts/fudge-brownie.webp", price: 109, isVeg: true },
    { name: "Sweet: Pastry Assortment", image: "/images/catalog/dishes/desserts/assorted-pastries.webp", price: 229, isVeg: true },
    { name: "Sweet: Butterscotch Scoop", image: "/images/catalog/dishes/desserts/butterscotch-ice-cream.webp", price: 79, isVeg: true },
    { name: "Sweet: Vanilla Scoop", image: "/images/catalog/dishes/desserts/vanilla-ice-cream.webp", price: 69, isVeg: true },
    { name: "Sweet: Strawberry Gelato", image: "/images/catalog/dishes/desserts/strawberry-ice-cream.webp", price: 109, isVeg: true },
    { name: "Sweet: Chocolate Scoop", image: "/images/catalog/dishes/desserts/chocolate-ice-cream.webp", price: 79, isVeg: true },
    { name: "Sweet: Glazed Donuts", image: "/images/catalog/dishes/desserts/glazed-donuts.webp", price: 89, isVeg: true },
    { name: "Sweet: Black Forest Slice", image: "/images/catalog/dishes/bakery/black-forest-cake.webp", price: 149, isVeg: true },
    { name: "Sweet: Pineapple Pastry", image: "/images/catalog/dishes/bakery/pineapple-cake.webp", price: 119, isVeg: true },
    { name: "Sweet: Choco Cupcake", image: "/images/catalog/dishes/bakery/chocolate-cupcake.webp", price: 79, isVeg: true },
    { name: "Sweet: Red Velvet Cupcake", image: "/images/catalog/dishes/bakery/red-velvet-cupcake.webp", price: 89, isVeg: true },
    { name: "Sweet: Cinnamon Roll", image: "/images/catalog/dishes/bakery/cinnamon-roll.webp", price: 99, isVeg: true },
    { name: "Sweet: Choco Chip Cookie", image: "/images/catalog/dishes/bakery/choco-chip-cookies.webp", price: 69, isVeg: true },
  ],
  { restaurantName: "Sweet Tooth Bakery", restaurantId: "rest-icecream" }
);

const SPICY_INDIAN = buildCollectionDishes(
  "spicy-indian",
  [
    { name: "Spicy: Butter Chicken", image: "/images/catalog/dishes/indian/butter-chicken.webp", price: 319, isVeg: false },
    { name: "Spicy: Chicken Tikka Masala", image: "/images/catalog/dishes/indian/chicken-tikka-masala.webp", price: 309, isVeg: false },
    { name: "Spicy: Chicken Korma", image: "/images/catalog/dishes/indian/chicken-korma.webp", price: 289, isVeg: false },
    { name: "Spicy: Tandoori Chicken", image: "/images/catalog/dishes/indian/tandoori-chicken.webp", price: 339, isVeg: false },
    { name: "Spicy: Kadhai Paneer", image: "/images/catalog/dishes/north-indian/kadhai-paneer.webp", price: 249, isVeg: true },
    { name: "Spicy: Palak Paneer", image: "/images/catalog/dishes/north-indian/palak-paneer.webp", price: 229, isVeg: true },
    { name: "Spicy: Paneer Tikka", image: "/images/catalog/dishes/north-indian/paneer-tikka.webp", price: 269, isVeg: true },
    { name: "Spicy: Chilli Chicken", image: "/images/catalog/dishes/chinese/chilli-chicken.webp", price: 259, isVeg: false },
    { name: "Spicy: Chilli Paneer", image: "/images/catalog/dishes/chinese/chilli-paneer.webp", price: 239, isVeg: true },
    { name: "Spicy: Kung Pao Chicken", image: "/images/catalog/dishes/chinese/kung-pao-chicken.webp", price: 279, isVeg: false },
    { name: "Spicy: Schezwan Noodles", image: "/images/catalog/dishes/chinese/schezwan-noodles.webp", price: 189, isVeg: true },
    { name: "Spicy: Honey Chilli Potato", image: "/images/catalog/dishes/chinese/honey-chilli-potato.webp", price: 169, isVeg: true },
    { name: "Spicy: Veg Manchurian", image: "/images/catalog/dishes/chinese/veg-manchurian.webp", price: 179, isVeg: true },
    { name: "Spicy: Chicken Seekh Kebab", image: "/images/catalog/dishes/north-indian/chicken-seekh-kebab.webp", price: 269, isVeg: false },
    { name: "Spicy: Dal Tadka", image: "/images/catalog/dishes/north-indian/dal-tadka.webp", price: 189, isVeg: true },
    { name: "Spicy: Chana Masala", image: "/images/catalog/dishes/north-indian/chana-masala.webp", price: 179, isVeg: true },
    { name: "Spicy: Shahi Paneer", image: "/images/catalog/dishes/indian/shahi-paneer.webp", price: 259, isVeg: true },
    { name: "Spicy: Malai Kofta", image: "/images/catalog/dishes/indian/malai-kofta.webp", price: 249, isVeg: true },
    { name: "Spicy: Rajma Chawal", image: "/images/catalog/dishes/indian/rajma-chawal.webp", price: 199, isVeg: true },
    { name: "Spicy: Chole Bhature", image: "/images/catalog/dishes/indian/chole-bhature.webp", price: 179, isVeg: true },
    { name: "Spicy: Punjabi Kadhi", image: "/images/catalog/dishes/north-indian/punjabi-kadhi.webp", price: 169, isVeg: true },
    { name: "Spicy: Aloo Gobi", image: "/images/catalog/dishes/north-indian/aloo-gobi.webp", price: 159, isVeg: true },
    { name: "Spicy: Amritsari Kulcha", image: "/images/catalog/dishes/north-indian/amritsari-kulcha.webp", price: 149, isVeg: true },
    { name: "Spicy: Butter Naan Combo", image: "/images/catalog/dishes/north-indian/butter-naan.webp", price: 129, isVeg: true },
    { name: "Spicy: Fiery Curry Thali", image: "/images/catalog/dishes/indian/mixed-veg-curry.webp", price: 299, isVeg: true },
  ],
  { restaurantName: "Haldiram's", restaurantId: "rest-north-indian" }
);

export const COLLECTION_DISHES: Record<CollectionSlug, CollectionDishItem[]> = {
  "pizza-deals": PIZZA_DEALS,
  "biryani-specials": BIRYANI_SPECIALS,
  "burger-lovers": BURGER_LOVERS,
  "summer-drinks": SUMMER_DRINKS,
  "sweet-desserts": SWEET_DESSERTS,
  "spicy-indian": SPICY_INDIAN,
};

const ALL_COLLECTION_DISHES = Object.values(COLLECTION_DISHES).flat();
const DISH_BY_ID = new Map(ALL_COLLECTION_DISHES.map((dish) => [dish.id, dish]));

export function isCollectionSlug(slug: string): slug is CollectionSlug {
  return (COLLECTION_SLUGS as readonly string[]).includes(slug);
}

export function getCollectionBySlug(slug: string): CollectionMeta | undefined {
  return FEATURED_COLLECTIONS.find((c) => c.slug === slug);
}

export function getCollectionDishes(slug: string): CollectionDishItem[] {
  if (!isCollectionSlug(slug)) return [];
  return COLLECTION_DISHES[slug];
}

export function getCollectionDishById(id: string): CollectionDishItem | undefined {
  return DISH_BY_ID.get(id);
}

export function isCollectionDishId(id: string): boolean {
  return DISH_BY_ID.has(id);
}
