"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ShoppingCart, Eye, Sparkles, Plus, Minus, Heart } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";
import { useToast } from "@/contexts/ToastContext";

export interface CategoryOption {
  id: string;
  name: string;
  image: string;
}

export interface FoodDishItem {
  id: string;
  name: string;
  category: string;
  restaurantName: string;
  restaurantId: string;
  price: number;
  originalPrice: number;
  rating: string;
  isVeg: boolean;
  image: string;
  description: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: "pizza", name: "Pizza", image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp" },
  { id: "burger", name: "Burger", image: "/images/catalog/cuisines/burger.webp" },
  { id: "chicken", name: "Chicken", image: "/images/catalog/cuisines/indian.webp" },
  { id: "biryani", name: "Biryani", image: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp" },
  { id: "momos", name: "Momos", image: "/images/catalog/dishes/dish-mo-1.jpg" },
  { id: "drinks", name: "Drinks", image: "/images/catalog/dishes/beverages/coca-cola.webp" },
  { id: "dessert", name: "Dessert", image: "/images/catalog/dishes/desserts/brownie-sundae.webp" },
  { id: "coffee", name: "Coffee", image: "/images/catalog/dishes/beverages/cold-coffee.webp" },
];

export const CATEGORY_DISHES: Record<string, FoodDishItem[]> = {
  pizza: [
    {
      id: "dish_pizza_1",
      name: "Margherita Pizza",
      category: "pizza",
      restaurantName: "Domino's Pizza",
      restaurantId: "rest-pizza",
      price: 249,
      originalPrice: 349,
      rating: "4.8",
      isVeg: true,
      image: "/images/catalog/dishes/pizza/classic-margherita.webp",
      description: "Classic mozzarella cheese with signature tomato sauce on hand-tossed sourdough.",
    },
    {
      id: "dish_pizza_2",
      name: "Cheese Burst Pizza",
      category: "pizza",
      restaurantName: "Pizza Italia Oven",
      restaurantId: "rest-pizza",
      price: 349,
      originalPrice: 499,
      rating: "4.9",
      isVeg: true,
      image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
      description: "Overflowing molten mozzarella cheese stuffed inside a golden crust.",
    },
    {
      id: "dish_pizza_3",
      name: "Farmhouse Pizza",
      category: "pizza",
      restaurantName: "Pizza Hut",
      restaurantId: "rest-pizza",
      price: 329,
      originalPrice: 429,
      rating: "4.8",
      isVeg: true,
      image: "/images/catalog/dishes/pizza/farmhouse-pizza.webp",
      description: "Loaded with capsicum, tomatoes, mushrooms, and grilled paneer.",
    },
    {
      id: "dish_pizza_4",
      name: "Veg Loaded Pizza",
      category: "pizza",
      restaurantName: "Domino's Pizza",
      restaurantId: "rest-pizza",
      price: 299,
      originalPrice: 399,
      rating: "4.7",
      isVeg: true,
      image: "/images/catalog/dishes/pizza/veggie-supreme-pizza.webp",
      description: "Golden corn, sweet jalapeños, onions, bell peppers, and extra cheese blend.",
    },
    {
      id: "dish_pizza_5",
      name: "Pepperoni Overload Pizza",
      category: "pizza",
      restaurantName: "Pizza Italia Oven",
      restaurantId: "rest-pizza",
      price: 449,
      originalPrice: 599,
      rating: "4.9",
      isVeg: false,
      image: "/images/catalog/dishes/pizza/pepperoni-pizza.webp",
      description: "Authentic spicy pork pepperoni slices generously layered over melted mozzarella.",
    },
    {
      id: "dish_pizza_6",
      name: "BBQ Chicken Feast Pizza",
      category: "pizza",
      restaurantName: "Pizza Hut",
      restaurantId: "rest-pizza",
      price: 399,
      originalPrice: 529,
      rating: "4.9",
      isVeg: false,
      image: "/images/catalog/dishes/pizza/bbq-chicken-pizza.webp",
      description: "Smoky BBQ glazed chicken chunks with red onions, mozzarella, and cilantro.",
    },
  ],
  burger: [
    {
      id: "dish_burger_1",
      name: "Crispy Chicken Zinger Burger",
      category: "burger",
      restaurantName: "KFC",
      restaurantId: "rest-burger",
      price: 199,
      originalPrice: 279,
      rating: "4.8",
      isVeg: false,
      image: "/images/catalog/cuisines/burger.webp",
      description: "Signature extra crispy chicken fillet topped with fresh lettuce & creamy mayo.",
    },
    {
      id: "dish_burger_2",
      name: "Veg Supreme Cheese Burger",
      category: "burger",
      restaurantName: "Burger King",
      restaurantId: "rest-burger",
      price: 149,
      originalPrice: 199,
      rating: "4.6",
      isVeg: true,
      image: "/images/catalog/cuisines/burger.webp",
      description: "Herb-seasoned crunchy veg patty with melted cheddar slice & tangy sauce.",
    },
    {
      id: "dish_burger_3",
      name: "Double Cheese Beef Burger",
      category: "burger",
      restaurantName: "McDonald's",
      restaurantId: "rest-burger",
      price: 249,
      originalPrice: 329,
      rating: "4.9",
      isVeg: false,
      image: "/images/catalog/cuisines/burger.webp",
      description: "Two juicy flame-grilled patties sandwiched with double cheddar & pickles.",
    },
    {
      id: "dish_burger_4",
      name: "Tower Zinger Monster Burger",
      category: "burger",
      restaurantName: "KFC",
      restaurantId: "rest-burger",
      price: 279,
      originalPrice: 369,
      rating: "4.9",
      isVeg: false,
      image: "/images/catalog/cuisines/burger.webp",
      description: "Stacked zinger fillet, hashbrown, double cheese, and spicy habanero sauce.",
    },
  ],
  chicken: [
    {
      id: "dish_chicken_1",
      name: "Butter Chicken Special",
      category: "chicken",
      restaurantName: "Haldiram's",
      restaurantId: "rest-north-indian",
      price: 349,
      originalPrice: 449,
      rating: "4.9",
      isVeg: false,
      image: "/images/catalog/cuisines/indian.webp",
      description: "Tender tandoori chicken simmered in rich creamy tomato and cashew nut gravy.",
    },
    {
      id: "dish_chicken_2",
      name: "Crispy Fried Chicken Bucket",
      category: "chicken",
      restaurantName: "KFC",
      restaurantId: "rest-fast-food",
      price: 499,
      originalPrice: 699,
      rating: "4.9",
      isVeg: false,
      image: "/images/catalog/cuisines/indian.webp",
      description: "8 pieces of signature golden fried chicken with secret herbs & spices.",
    },
    {
      id: "dish_chicken_3",
      name: "Tandoori Full Chicken",
      category: "chicken",
      restaurantName: "Barbeque Nation",
      restaurantId: "rest-north-indian",
      price: 449,
      originalPrice: 599,
      rating: "4.8",
      isVeg: false,
      image: "/images/catalog/cuisines/indian.webp",
      description: "Whole roasted chicken marinated in yogurt, red chili, and tandoori spices.",
    },
    {
      id: "dish_chicken_4",
      name: "Spicy Hot Wings (8 pcs)",
      category: "chicken",
      restaurantName: "KFC",
      restaurantId: "rest-fast-food",
      price: 279,
      originalPrice: 349,
      rating: "4.8",
      isVeg: false,
      image: "/images/catalog/cuisines/indian.webp",
      description: "Juicy chicken wings tossed in fiery chili glaze and served hot.",
    },
  ],
  biryani: [
    {
      id: "dish_biryani_1",
      name: "Hyderabadi Chicken Dum Biryani",
      category: "biryani",
      restaurantName: "Behrouz Biryani",
      restaurantId: "rest-biryani",
      price: 299,
      originalPrice: 399,
      rating: "4.9",
      isVeg: false,
      image: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp",
      description: "Authentic Hyderabadi dum biryani cooked with marinated chicken, saffron & mint.",
    },
    {
      id: "dish_biryani_2",
      name: "Royal Mutton Dum Biryani",
      category: "biryani",
      restaurantName: "Biryani By Kilo",
      restaurantId: "rest-biryani",
      price: 399,
      originalPrice: 499,
      rating: "4.9",
      isVeg: false,
      image: "/images/catalog/cuisines/biryani.webp",
      description: "Slow-cooked tender mutton handi biryani layered with kewra & fried onions.",
    },
    {
      id: "dish_biryani_3",
      name: "Paneer Tikka Dum Biryani",
      category: "biryani",
      restaurantName: "Behrouz Biryani",
      restaurantId: "rest-biryani",
      price: 249,
      originalPrice: 329,
      rating: "4.7",
      isVeg: true,
      image: "/images/catalog/cuisines/biryani.webp",
      description: "Tandoori grilled paneer tikka layered with aromatic saffron rice & biryani masala.",
    },
    {
      id: "dish_biryani_4",
      name: "Veg Dum Biryani with Raita",
      category: "biryani",
      restaurantName: "Biryani By Kilo",
      restaurantId: "rest-biryani",
      price: 199,
      originalPrice: 259,
      rating: "4.5",
      isVeg: true,
      image: "/images/catalog/cuisines/biryani.webp",
      description: "Garden fresh vegetables & paneer cooked in handi dum style with cooling raita.",
    },
  ],
  momos: [
    {
      id: "dish_momos_1",
      name: "Steamed Veg Momos (8 pcs)",
      category: "momos",
      restaurantName: "Wow! Momo",
      restaurantId: "rest-chinese",
      price: 119,
      originalPrice: 159,
      rating: "4.7",
      isVeg: true,
      image: "/images/catalog/dishes/dish-mo-1.jpg",
      description: "Delicate thin wrappers stuffed with finely minced vegetables, served with red chutney.",
    },
    {
      id: "dish_momos_2",
      name: "Fried Chicken Momos (8 pcs)",
      category: "momos",
      restaurantName: "Wow! Momo",
      restaurantId: "rest-chinese",
      price: 149,
      originalPrice: 199,
      rating: "4.8",
      isVeg: false,
      image: "/images/catalog/dishes/dish-mo-1.jpg",
      description: "Golden crispy fried chicken momos served with fiery chili dip & mayo.",
    },
    {
      id: "dish_momos_3",
      name: "Kurkure Cheese Corn Momos",
      category: "momos",
      restaurantName: "Wow! Momo",
      restaurantId: "rest-chinese",
      price: 179,
      originalPrice: 229,
      rating: "4.9",
      isVeg: true,
      image: "/images/catalog/dishes/dish-mo-1.jpg",
      description: "Extra crunchy corn and cheese stuffed momos coated with spicy crunchy crust.",
    },
    {
      id: "dish_momos_4",
      name: "Afghan Malai Cream Momos",
      category: "momos",
      restaurantName: "Wow! Momo",
      restaurantId: "rest-chinese",
      price: 199,
      originalPrice: 259,
      rating: "4.9",
      isVeg: true,
      image: "/images/catalog/dishes/dish-mo-1.jpg",
      description: "Rich and creamy momos drenched in white malai sauce and roasted garlic.",
    },
  ],
  drinks: [
    {
      id: "dish_drinks_1",
      name: "Chilled Coca Cola (500ml)",
      category: "drinks",
      restaurantName: "Beverage Hub",
      restaurantId: "rest-cold-drinks",
      price: 45,
      originalPrice: 60,
      rating: "4.8",
      isVeg: true,
      image: "/images/catalog/dishes/beverages/coca-cola.webp",
      description: "Refreshing carbonated cola delivered icy cold.",
    },
    {
      id: "dish_drinks_2",
      name: "Pepsi Cold Can (330ml)",
      category: "drinks",
      restaurantName: "Beverage Hub",
      restaurantId: "rest-cold-drinks",
      price: 40,
      originalPrice: 50,
      rating: "4.7",
      isVeg: true,
      image: "/images/catalog/dishes/beverages/pepsi.webp",
      description: "Chilled classic Pepsi beverage bottle.",
    },
    {
      id: "dish_drinks_3",
      name: "Virgin Mojito Mocktail",
      category: "drinks",
      restaurantName: "Mocktail Bar",
      restaurantId: "rest-cold-drinks",
      price: 129,
      originalPrice: 179,
      rating: "4.9",
      isVeg: true,
      image: "/images/catalog/dishes/beverages/virgin-mojito.webp",
      description: "Fresh mint, lime wedges, crushed ice, and sparkling soda infusion.",
    },
    {
      id: "dish_drinks_4",
      name: "Fresh Mango Milkshake",
      category: "drinks",
      restaurantName: "Beverage Hub",
      restaurantId: "rest-cold-drinks",
      price: 139,
      originalPrice: 179,
      rating: "4.8",
      isVeg: true,
      image: "/images/catalog/dishes/beverages/mango-shake.webp",
      description: "Alphonso mango pulp blended with rich whole milk and cream.",
    },
  ],
  dessert: [
    {
      id: "dish_dessert_1",
      name: "Sizzling Brownie & Ice Cream",
      category: "dessert",
      restaurantName: "Baskin Robbins",
      restaurantId: "rest-icecream",
      price: 189,
      originalPrice: 249,
      rating: "4.9",
      isVeg: true,
      image: "/images/catalog/dishes/desserts/brownie-sundae.webp",
      description: "Warm fudgy dark chocolate brownie topped with cold vanilla scoop & hot fudge.",
    },
    {
      id: "dish_dessert_2",
      name: "Hot Chocolate Sundae",
      category: "dessert",
      restaurantName: "Baskin Robbins",
      restaurantId: "rest-icecream",
      price: 149,
      originalPrice: 199,
      rating: "4.8",
      isVeg: true,
      image: "/images/catalog/dishes/desserts/hot-chocolate-sundae.webp",
      description: "Layered chocolate ice cream with crushed nuts, whipped cream & hot chocolate.",
    },
    {
      id: "dish_dessert_3",
      name: "Belgian Chocolate Waffle",
      category: "dessert",
      restaurantName: "The Waffle Co",
      restaurantId: "rest-icecream",
      price: 169,
      originalPrice: 229,
      rating: "4.9",
      isVeg: true,
      image: "/images/catalog/dishes/desserts/belgian-waffle.webp",
      description: "Freshly baked crispy waffle smothered in melted Belgian chocolate sauce.",
    },
    {
      id: "dish_dessert_4",
      name: "New York Cheesecake",
      category: "dessert",
      restaurantName: "Sweet Tooth Bakery",
      restaurantId: "rest-icecream",
      price: 199,
      originalPrice: 269,
      rating: "4.9",
      isVeg: true,
      image: "/images/catalog/dishes/desserts/new-york-cheesecake.webp",
      description: "Dense and rich cream cheese cake on a graham cracker crust.",
    },
  ],
  coffee: [
    {
      id: "dish_coffee_1",
      name: "Classic Cappuccino",
      category: "coffee",
      restaurantName: "Cafe Latte",
      restaurantId: "rest-coffee",
      price: 139,
      originalPrice: 179,
      rating: "4.8",
      isVeg: true,
      image: "/images/catalog/dishes/beverages/classic-cappuccino.webp",
      description: "Rich dark espresso topped with steamed milk foam and cocoa dusting.",
    },
    {
      id: "dish_coffee_2",
      name: "Creamy Cold Coffee with Scoop",
      category: "coffee",
      restaurantName: "Cafe Latte",
      restaurantId: "rest-coffee",
      price: 159,
      originalPrice: 209,
      rating: "4.9",
      isVeg: true,
      image: "/images/catalog/dishes/beverages/cold-coffee.webp",
      description: "Blended arabica coffee shake topped with thick vanilla ice cream scoop.",
    },
    {
      id: "dish_coffee_3",
      name: "Cafe Latte",
      category: "coffee",
      restaurantName: "Cafe Latte",
      restaurantId: "rest-coffee",
      price: 149,
      originalPrice: 189,
      rating: "4.8",
      isVeg: true,
      image: "/images/catalog/dishes/beverages/cafe-latte.webp",
      description: "Smooth espresso poured over hot velvety microfoam milk.",
    },
    {
      id: "dish_coffee_4",
      name: "Salted Caramel Frappe",
      category: "coffee",
      restaurantName: "Cafe Latte",
      restaurantId: "rest-coffee",
      price: 179,
      originalPrice: 229,
      rating: "4.9",
      isVeg: true,
      image: "/images/catalog/dishes/beverages/salted-caramel-frappe.webp",
      description: "Blended coffee frappe infused with salted caramel sauce & whipped cream.",
    },
  ],
};

export default function BestFoodOptions() {
  const { showToast } = useToast();
  const { quantities, updateQuantity } = useCartActions();
  const { itemIds, toggleItem } = useFavoriteActions();

  // Pure Swiggy-style React state for filtering category on the SAME page without routing!
  const [selectedCategory, setSelectedCategory] = useState<string>("pizza");

  const activeDishes = CATEGORY_DISHES[selectedCategory] || CATEGORY_DISHES.pizza;
  const activeCategoryMeta = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const handleAddToCart = async (dish: FoodDishItem) => {
    await updateQuantity(dish.id, 1, {
      restaurant_id: dish.restaurantId,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      isVeg: dish.isVeg,
    });
    showToast(`🛒 ${dish.name} added to cart!`, "success");
  };

  return (
    <section className="py-8 bg-white border-y border-[#ECECEC]" id="best-food-options-section">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        
        {/* Section Header Title & Subtitle */}
        <div className="mb-6 pb-2 border-b border-[#ECECEC]">
          <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
            🍽 Order Our Best Food Options
          </h2>
          <p className="text-[#666666] text-xs md:text-sm font-medium mt-1">
            Choose your favourite food category to view delicious options below.
          </p>
        </div>

        {/* Swiggy Homepage Category Row: NO cards, NO background boxes, NO borders, NO shadow containers */}
        <div className="flex overflow-x-auto gap-6 md:gap-8 pb-4 scrollbar-none md:grid md:grid-cols-8 justify-items-center mb-8">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className="group flex flex-col items-center justify-center bg-transparent border-0 shadow-none p-0 outline-none cursor-pointer shrink-0 transition-transform duration-300"
              >
                {/* Clean Swiggy Circular Food Image (110px size, no card container) */}
                <div
                  className={`relative w-[105px] h-[105px] sm:w-[115px] sm:h-[115px] rounded-full overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? "ring-4 ring-[#E23744] ring-offset-2 scale-105 shadow-md"
                      : "hover:scale-105"
                  }`}
                >
                  <SafeImage
                    src={cat.image}
                    fallback={FOOD_FALLBACK}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <span className="w-6 h-6 rounded-full bg-[#E23744] text-white flex items-center justify-center text-xs font-black shadow-sm">
                        ✓
                      </span>
                    </div>
                  )}
                </div>

                {/* Category Name Centered Below Image Only */}
                <span
                  className={`mt-2.5 text-xs md:text-sm font-black text-center tracking-tight transition-colors ${
                    isSelected ? "text-[#E23744]" : "text-[#1A1A1A] group-hover:text-[#E23744]"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Status Banner */}
        <div className="flex items-center justify-between mb-6 bg-[#FFF5F6] border border-[#E23744]/20 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-[#E23744]">
              {selectedCategory === "pizza" ? "🍕" :
               selectedCategory === "burger" ? "🍔" :
               selectedCategory === "chicken" ? "🍗" :
               selectedCategory === "biryani" ? "🍛" :
               selectedCategory === "momos" ? "🥟" :
               selectedCategory === "drinks" ? "🥤" :
               selectedCategory === "dessert" ? "🍰" : "☕"}
            </span>
            <div>
              <h3 className="text-sm md:text-base font-black text-[#1A1A1A]">
                {activeCategoryMeta.name} Dishes
              </h3>
              <p className="text-[11px] text-[#666666] font-medium">
                Freshly prepared and delivered piping hot in 25-30 mins
              </p>
            </div>
          </div>

          <span className="text-xs font-black text-[#E23744] bg-white px-3 py-1 rounded-xl border border-[#E23744]/20 shadow-xs">
            {activeDishes.length} Items
          </span>
        </div>

        {/* Dynamic Category Items Display (Filters on same page without routing) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 transition-opacity duration-300">
          {activeDishes.map((dish) => {
            const qty = quantities.get(dish.id) || 0;
            const isFav = itemIds.has(dish.id);

            return (
              <div
                key={dish.id}
                className="group relative bg-white rounded-[20px] border border-[#ECECEC] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_rgba(226,55,68,0.18)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Food Image Container */}
                <div className="relative h-[160px] w-full overflow-hidden bg-[#F8F8F8]">
                  <SafeImage
                    src={dish.image}
                    fallback={FOOD_FALLBACK}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Veg / Non-Veg Indicator */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md p-1 rounded-md shadow-sm border border-gray-200 z-10">
                    <div
                      className={`w-3 h-3 border-2 flex items-center justify-center ${
                        dish.isVeg ? "border-green-600" : "border-red-600"
                      }`}
                    >
                      <div className={`w-1 h-1 rounded-full ${dish.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="absolute bottom-3 left-3 bg-[#16A34A] text-white text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm z-10">
                    <span>{dish.rating}</span>
                    <Star className="w-3 h-3 fill-white" />
                  </div>

                  {/* Favourite Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleItem(dish.id);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md transition-all z-20 backdrop-blur-sm active:scale-90"
                    aria-label="Save Favorite"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        isFav ? "fill-[#E23744] text-[#E23744]" : "text-gray-600 hover:text-[#E23744]"
                      }`}
                    />
                  </button>
                </div>

                {/* Dish Info Content */}
                <div className="p-4 flex flex-col flex-1 justify-between bg-white min-w-0">
                  <div>
                    {/* Restaurant Name */}
                    <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider block mb-0.5">
                      {dish.restaurantName}
                    </span>

                    {/* Dish Name */}
                    <h4 className="font-black text-[#1A1A1A] text-base line-clamp-1 group-hover:text-[#E23744] transition-colors">
                      {dish.name}
                    </h4>

                    {/* Description */}
                    <p className="text-[#666666] text-xs font-medium line-clamp-2 mt-1 mb-3">
                      {dish.description}
                    </p>
                  </div>

                  {/* Bottom Row: Price & Action Buttons */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-black text-[#1A1A1A]">₹{dish.price}</span>
                      <span className="text-xs text-[#8E8E8E] line-through font-medium">₹{dish.originalPrice}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Add to Cart Button */}
                      {qty > 0 ? (
                        <div className="flex items-center justify-between bg-[#E23744] text-white rounded-xl p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish.id, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20 active:scale-90 transition-all"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black px-1">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish.id, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20 active:scale-90 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(dish)}
                          className="w-full inline-flex items-center justify-center gap-1 py-2 rounded-xl bg-[#E23744] hover:bg-[#C81E34] text-white text-xs font-black transition-all shadow-sm active:scale-95"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      )}

                      {/* View Details Button */}
                      <Link
                        href={`/food/${dish.id}`}
                        className="w-full inline-flex items-center justify-center gap-1 py-2 rounded-xl bg-[#F8F8F8] hover:bg-[#ECECEC] text-[#1A1A1A] text-xs font-bold transition-all border border-[#ECECEC] active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#666666]" />
                        <span>Details</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
