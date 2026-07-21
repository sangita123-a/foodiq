import { TRENDING_DISHES_60 } from "@/lib/data/30restaurantsData";

type ImageRule = {
  image: string;
  match: (name: string, category: string) => boolean;
};

const n = (value: string) => value.toLowerCase();

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

const GENERIC_IMAGES = new Set([
  "/default-food.webp",
  "/default-restaurant.webp",
  "/images/catalog/food/pizza.webp",
  "/images/catalog/cuisines/pizza.webp",
  "/images/catalog/cuisines/biryani.webp",
  "/images/catalog/cuisines/chinese.webp",
]);

function isGenericImage(url?: string | null): boolean {
  if (!url) return true;
  const normalized = url.trim().toLowerCase();
  return GENERIC_IMAGES.has(normalized) || normalized.endsWith("/default-food.webp");
}

const IMAGE_RULES: ImageRule[] = [
  { image: "/images/catalog/dishes/pizza/classic-margherita.webp", match: (name, cat) => cat.includes("pizza") && includesAny(name, ["margherita"]) },
  { image: "/images/catalog/dishes/pizza/pepperoni-pizza.webp", match: (name, cat) => cat.includes("pizza") && includesAny(name, ["pepperoni"]) },
  { image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp", match: (name, cat) => cat.includes("pizza") && includesAny(name, ["cheese burst", "cheese-burst"]) },
  { image: "/images/catalog/dishes/burger/crispy-chicken-burger.webp", match: (name, cat) => cat.includes("burger") && includesAny(name, ["crispy chicken", "double patty", "double-patty"]) },
  { image: "/images/catalog/dishes/burger/double-patty-burger.webp", match: (name, cat) => cat.includes("burger") && includesAny(name, ["double patty", "double-patty"]) },
  { image: "/images/catalog/dishes/burger/veg-burger.webp", match: (name, cat) => cat.includes("burger") && includesAny(name, ["veg", "veggie", "smokey veggie"]) },
  { image: "/images/catalog/dishes/biryani/hyderabadi-chicken-biryani.webp", match: (name, cat) => cat.includes("biryani") && includesAny(name, ["hyderabadi", "dum chicken"]) },
  { image: "/images/catalog/dishes/biryani/paneer-biryani.webp", match: (name, cat) => cat.includes("biryani") && includesAny(name, ["paneer", "shahi"]) },
  { image: "/images/catalog/dishes/chinese/chicken-momos.webp", match: (name, cat) => (cat.includes("momo") || name.includes("momo")) && includesAny(name, ["chicken", "darjeeling"]) && !includesAny(name, ["fried", "kurkure"]) },
  { image: "/images/catalog/dishes/dish-mo-2.jpg", match: (name, cat) => (cat.includes("momo") || name.includes("momo")) && includesAny(name, ["fried", "kurkure", "paneer"]) },
  { image: "/images/catalog/dishes/chinese/hakka-noodles.webp", match: (name) => includesAny(name, ["hakka noodle"]) && !includesAny(name, ["schezwan"]) },
  { image: "/images/catalog/dishes/chinese/schezwan-noodles.webp", match: (name) => includesAny(name, ["schezwan noodle", "schezwan hakka"]) },
  { image: "/images/catalog/dishes/chinese/chow-mein.webp", match: (name) => includesAny(name, ["chow mein"]) },
  { image: "/images/catalog/dishes/chinese/veg-fried-rice.webp", match: (name) => includesAny(name, ["veg fried rice"]) },
  { image: "/images/catalog/dishes/chinese/chicken-fried-rice.webp", match: (name) => includesAny(name, ["chicken fried rice"]) },
  { image: "/images/catalog/dishes/chinese/veg-manchurian.webp", match: (name) => includesAny(name, ["manchurian"]) },
  { image: "/images/catalog/dishes/chinese/chilli-chicken.webp", match: (name) => includesAny(name, ["chilli chicken", "chili chicken"]) },
  { image: "/images/catalog/dishes/chinese/kung-pao-chicken.webp", match: (name) => includesAny(name, ["kung pao"]) },
  { image: "/images/catalog/dishes/chinese/honey-chilli-potato.webp", match: (name) => includesAny(name, ["honey chilli potato", "honey chili potato"]) },
  { image: "/images/catalog/dishes/chinese/hot-and-sour-soup.webp", match: (name) => includesAny(name, ["hot & sour", "hot and sour"]) },
  { image: "/images/catalog/dishes/chinese/spring-rolls.webp", match: (name) => includesAny(name, ["spring roll"]) },
  { image: "/images/catalog/dishes/street-food/chicken-kathi-roll.webp", match: (name, cat) => (cat.includes("roll") || name.includes("roll")) && includesAny(name, ["chicken", "egg"]) },
  { image: "/images/catalog/dishes/street-food/paneer-kathi-roll.webp", match: (name, cat) => (cat.includes("roll") || name.includes("roll")) && includesAny(name, ["paneer"]) },
  { image: "/images/catalog/dishes/fast-food/club-sandwich.webp", match: (name, cat) => (cat.includes("sandwich") || name.includes("sandwich")) && includesAny(name, ["club"]) },
  { image: "/images/catalog/dishes/fast-food/grilled-sandwich.webp", match: (name, cat) => (cat.includes("sandwich") || name.includes("sandwich")) && includesAny(name, ["grilled", "avocado"]) },
  { image: "/images/catalog/dishes/south-indian/masala-dosa.webp", match: (name) => includesAny(name, ["dosa"]) },
  { image: "/images/catalog/dishes/south-indian/idli-sambar.webp", match: (name) => includesAny(name, ["idli"]) },
  { image: "/images/catalog/dishes/south-indian/onion-uttapam.webp", match: (name) => includesAny(name, ["uttapam"]) },
  { image: "/images/catalog/dishes/desserts/chocolate-ice-cream.webp", match: (name, cat) => cat.includes("ice cream") && includesAny(name, ["chocolate", "belgian"]) },
  { image: "/images/catalog/dishes/desserts/strawberry-ice-cream.webp", match: (name, cat) => (cat.includes("ice cream") || name.includes("sorbet")) && includesAny(name, ["mango", "sorbet"]) },
  { image: "/images/catalog/dishes/desserts/vanilla-ice-cream.webp", match: (name, cat) => cat.includes("ice cream") && includesAny(name, ["vanilla"]) },
  { image: "/images/catalog/dishes/desserts/red-velvet-cake.webp", match: (name) => includesAny(name, ["red velvet"]) },
  { image: "/images/catalog/dishes/desserts/chocolate-cake.webp", match: (name) => includesAny(name, ["chocolate truffle", "chocolate cake"]) },
  { image: "/images/catalog/dishes/bakery/black-forest-cake.webp", match: (name) => includesAny(name, ["black forest"]) },
  { image: "/images/catalog/dishes/beverages/classic-cappuccino.webp", match: (name) => includesAny(name, ["cappuccino"]) },
  { image: "/images/catalog/dishes/beverages/espresso-coffee.webp", match: (name) => includesAny(name, ["espresso"]) },
  { image: "/images/catalog/dishes/beverages/cafe-latte.webp", match: (name) => includesAny(name, ["latte"]) && !includesAny(name, ["cappuccino"]) },
  { image: "/images/catalog/dishes/beverages/cold-coffee.webp", match: (name) => includesAny(name, ["cold brew", "cold coffee", "caramel"]) },
  { image: "/images/catalog/dishes/beverages/masala-tea.webp", match: (name) => includesAny(name, ["masala", "adrak", "chai"]) && !includesAny(name, ["green", "peach", "hibiscus"]) },
  { image: "/images/catalog/dishes/beverages/iced-tea.webp", match: (name) => includesAny(name, ["green tea", "peach", "hibiscus", "iced tea"]) },
  { image: "/images/catalog/dishes/beverages/coca-cola.webp", match: (name) => includesAny(name, ["cola", "coke", "coca", "iced cola"]) },
  { image: "/images/catalog/dishes/beverages/virgin-mojito.webp", match: (name) => includesAny(name, ["mojito", "lemon lime", "sparkling lemon"]) },
  { image: "/images/catalog/dishes/beverages/fresh-orange-juice.webp", match: (name) => includesAny(name, ["orange juice", "abc", "detox", "mixed fruit"]) },
  { image: "/images/catalog/dishes/beverages/mango-shake.webp", match: (name) => includesAny(name, ["watermelon"]) },
  { image: "/images/catalog/dishes/healthy/quinoa-buddha-bowl.webp", match: (name) => includesAny(name, ["buddha bowl", "quinoa"]) },
  { image: "/images/catalog/dishes/healthy/greek-salad.webp", match: (name) => includesAny(name, ["tofu salad", "greek", "feta"]) },
  { image: "/images/catalog/dishes/dish-th-1.jpg", match: (name, cat) => cat.includes("thali") && includesAny(name, ["maharaja", "royal"]) },
  { image: "/images/catalog/dishes/dish-th-2.jpg", match: (name, cat) => cat.includes("thali") },
  { image: "/images/catalog/dishes/seafood/garlic-butter-prawns.webp", match: (name) => includesAny(name, ["prawn", "shrimp"]) },
  { image: "/images/catalog/dishes/seafood/goan-prawn-curry.webp", match: (name) => includesAny(name, ["fish curry", "goan fish"]) },
  { image: "/images/catalog/dishes/dish-bb-1.jpg", match: (name, cat) => cat.includes("bbq") && includesAny(name, ["wing"]) },
  { image: "/images/catalog/dishes/dish-bb-2.jpg", match: (name, cat) => cat.includes("bbq") && includesAny(name, ["mushroom"]) },
  { image: "/images/catalog/dishes/italian/alfredo-pasta.webp", match: (name) => includesAny(name, ["alfredo", "penne pasta", "creamy alfredo"]) },
  { image: "/images/catalog/dishes/italian/penne-arrabbiata.webp", match: (name) => includesAny(name, ["arrabbiata", "spicy tomato"]) },
  { image: "/images/catalog/dishes/dish-sh-1.jpg", match: (name) => includesAny(name, ["shawarma"]) && includesAny(name, ["chicken"]) },
  { image: "/images/catalog/dishes/dish-sh-2.jpg", match: (name) => includesAny(name, ["falafel"]) },
  { image: "/images/catalog/dishes/indian/tandoori-chicken.webp", match: (name) => includesAny(name, ["tandoori whole", "tandoori chicken roast"]) },
  { image: "/images/catalog/dishes/north-indian/paneer-tikka.webp", match: (name) => includesAny(name, ["paneer tikka kebab", "achari paneer"]) },
  { image: "/images/catalog/dishes/north-indian/north-indian-butter-chicken.webp", match: (name) => includesAny(name, ["butter chicken"]) },
  { image: "/images/catalog/dishes/indian/dal-makhani.webp", match: (name) => includesAny(name, ["dal makhani"]) },
  { image: "/images/catalog/dishes/street-food/pani-puri.webp", match: (name) => includesAny(name, ["pani puri"]) },
  { image: "/images/catalog/dishes/street-food/pav-bhaji.webp", match: (name) => includesAny(name, ["samosa", "ragda chaat"]) },
  { image: "/images/catalog/dishes/bakery/butter-croissant.webp", match: (name) => includesAny(name, ["croissant"]) },
  { image: "/images/catalog/dishes/bakery/cinnamon-roll.webp", match: (name) => includesAny(name, ["cinnamon roll"]) },
  { image: "/images/catalog/dishes/fast-food/peri-peri-fries.webp", match: (name) => includesAny(name, ["peri peri fries", "loaded fries"]) },
  { image: "/images/catalog/dishes/fast-food/mozzarella-sticks.webp", match: (name) => includesAny(name, ["cheese nugget", "nuggets"]) },
  { image: "/images/catalog/dishes/desserts/fudge-brownie.webp", match: (name) => includesAny(name, ["brownie"]) },
  { image: "/images/catalog/dishes/desserts/belgian-waffle.webp", match: (name) => includesAny(name, ["waffle", "nutella"]) },
  { image: "/images/catalog/dishes/healthy/chicken-caesar-salad.webp", match: (name) => includesAny(name, ["caesar"]) },
  { image: "/images/catalog/dishes/dish-sm-1.jpg", match: (name, cat) => cat.includes("smoothie") && includesAny(name, ["berry", "detox"]) },
  { image: "/images/catalog/dishes/dish-sm-2.jpg", match: (name, cat) => cat.includes("smoothie") },
  { image: "/images/catalog/dishes/beverages/oreo-shake.webp", match: (name) => includesAny(name, ["oreo"]) },
  { image: "/images/catalog/dishes/beverages/chocolate-milkshake.webp", match: (name) => includesAny(name, ["ferrero", "nutella shake"]) },
  { image: "/images/catalog/dishes/fast-food/loaded-nachos.webp", match: (name) => includesAny(name, ["nachos"]) },
  { image: "/images/catalog/dishes/dish-sn-2.jpg", match: (name) => includesAny(name, ["popcorn shots"]) },
];

const TRENDING_IMAGE_BY_ID = new Map(TRENDING_DISHES_60.map((dish) => [dish.id, dish.image]));
const TRENDING_IMAGE_BY_NAME = new Map(
  TRENDING_DISHES_60.map((dish) => [n(dish.name), dish.image])
);

function matchByRules(name: string, category: string): string | null {
  const normalizedName = n(name);
  const normalizedCategory = n(category);
  for (const rule of IMAGE_RULES) {
    if (rule.match(normalizedName, normalizedCategory)) {
      return rule.image;
    }
  }
  return null;
}

export function resolveTrendingDishImagePath(
  name: string,
  category: string,
  dishId?: string | null,
  apiImage?: string | null,
  datasetImage?: string | null
): string {
  const id = dishId?.trim();
  if (id && TRENDING_IMAGE_BY_ID.has(id)) {
    return TRENDING_IMAGE_BY_ID.get(id)!;
  }

  const normalizedName = n(name);
  if (normalizedName && TRENDING_IMAGE_BY_NAME.has(normalizedName)) {
    return TRENDING_IMAGE_BY_NAME.get(normalizedName)!;
  }

  const ruled = matchByRules(name, category);
  if (ruled) {
    return ruled;
  }

  if (apiImage?.trim() && !isGenericImage(apiImage)) {
    return apiImage.trim();
  }

  if (datasetImage?.trim() && !isGenericImage(datasetImage)) {
    return datasetImage.trim();
  }

  return "/default-food.webp";
}
