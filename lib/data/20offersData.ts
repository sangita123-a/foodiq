export interface PromotionalOffer {
  id: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  description: string;
  code: string;
  discountBadge: string;
  discountType: "percentage" | "fixed";
  discountAmount: number;
  expiryDate: string;
  minOrder: number;
  maxDiscount?: number;
  image: string;
}

export const FIVE_BEST_OFFERS: PromotionalOffer[] = [
  {
    id: "card-1-pizza",
    restaurantId: "rest-pizza",
    restaurantName: "Pizza Italia Oven",
    title: "Pizza Mania",
    description: "Flat 50% OFF on all gourmet cheesy pizzas",
    code: "PIZZA50",
    discountBadge: "Flat 50% OFF",
    discountType: "percentage",
    discountAmount: 50,
    expiryDate: "Valid Today",
    minOrder: 299,
    maxDiscount: 200,
    image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
  },
  {
    id: "card-2-burger",
    restaurantId: "rest-burger",
    restaurantName: "Burger Craft House",
    title: "Burger Combo",
    description: "Buy 1 Get 1 Free on all double patty burgers",
    code: "BURGERBOGO",
    discountBadge: "Buy 1 Get 1",
    discountType: "percentage",
    discountAmount: 50,
    expiryDate: "Valid Today",
    minOrder: 249,
    maxDiscount: 150,
    image: "/images/catalog/dishes/burger/crispy-chicken-burger.webp",
  },
  {
    id: "card-3-biryani",
    restaurantId: "rest-biryani",
    restaurantName: "Royal Hyderabadi Biryani",
    title: "Biryani Festival",
    description: "Flat ₹150 OFF on authentic dum biryanis",
    code: "BIRYANI150",
    discountBadge: "Flat ₹150 OFF",
    discountType: "fixed",
    discountAmount: 150,
    expiryDate: "Valid Today",
    minOrder: 499,
    maxDiscount: 150,
    image: "/images/catalog/dishes/biryani/hyderabadi-chicken-biryani.webp",
  },
  {
    id: "card-4-drinks",
    restaurantId: "rest-cold-drinks",
    restaurantName: "The Soda & Chill Hub",
    title: "Cold Drinks",
    description: "30% OFF on sodas, energy drinks & cold teas",
    code: "DRINK30",
    discountBadge: "30% OFF",
    discountType: "percentage",
    discountAmount: 30,
    expiryDate: "Valid Today",
    minOrder: 149,
    maxDiscount: 100,
    image: "/images/catalog/dishes/beverages/coca-cola.webp",
  },
  {
    id: "card-5-desserts",
    restaurantId: "rest-icecream",
    restaurantName: "Frosty Scoop Creamery",
    title: "Desserts Special",
    description: "40% OFF on ice cream scoops & sundaes",
    code: "SWEET40",
    discountBadge: "40% OFF",
    discountType: "percentage",
    discountAmount: 40,
    expiryDate: "Valid Today",
    minOrder: 199,
    maxDiscount: 120,
    image: "/images/catalog/dishes/desserts/chocolate-ice-cream.webp",
  },
];

export const PROMOTIONAL_OFFERS_20: PromotionalOffer[] = FIVE_BEST_OFFERS;

export function getOfferByCode(code: string): PromotionalOffer | undefined {
  if (!code) return undefined;
  const clean = code.trim().toUpperCase();
  return FIVE_BEST_OFFERS.find((o) => o.code.toUpperCase() === clean);
}

export function getOffersForRestaurant(restaurantId: string): PromotionalOffer[] {
  if (!restaurantId) return [];
  const cleanId = restaurantId.trim().toLowerCase();
  return FIVE_BEST_OFFERS.filter((o) => o.restaurantId.toLowerCase() === cleanId);
}
