"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import SafeImage from "@/components/ui/SafeImage";
import CuisineFoodCard, { CuisineFoodItem } from "@/components/cuisines/CuisineFoodCard";
import CuisineNotFound from "@/components/cuisines/CuisineNotFound";
import {
  Search,
  ArrowLeft,
  UtensilsCrossed,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Clock,
  Heart,
  Sparkles,
} from "lucide-react";
import { RESTAURANT_FALLBACK, FOOD_FALLBACK } from "@/lib/images";
import { HERO_BACKGROUND_SIZES } from "@/lib/performance/assets";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";

type Props = {
  slug: string;
};

// Rich 20+ Items per Category Generator for Fallback / Full Data Coverage
function getMockCategoryData(slug: string) {
  const normalized = slug.toLowerCase();
  
  const categoryMeta: Record<string, { name: string; description: string; banner: string }> = {
    pizza: {
      name: "Pizza",
      description: "Hand-crafted sourdough pizzas with rich mozzarella cheese, fresh basil, and oven-baked toppings.",
      banner: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
    },
    burger: {
      name: "Burger",
      description: "Juicy flame-grilled burgers with crispy patties, melted cheddar, and secret signature sauces.",
      banner: "/images/catalog/cuisines/burger.webp",
    },
    chicken: {
      name: "Chicken",
      description: "Crispy fried, tandoori roasted, and rich gravy chicken delicacies crafted by top chefs.",
      banner: "/images/catalog/cuisines/indian.webp",
    },
    biryani: {
      name: "Biryani",
      description: "Aromatic dum biryanis cooked with long-grain basmati, saffron, whole spices, and tender meat.",
      banner: "/images/catalog/cuisines/biryani.webp",
    },
    momos: {
      name: "Momos",
      description: "Steamed, fried, and tandoori momos served with fiery chili-garlic chutney and spicy dip.",
      banner: "/images/catalog/dishes/dish-mo-1.jpg",
    },
    beverages: {
      name: "Drinks",
      description: "Refreshing cold drinks, sodas, chilled mocktails, and fresh fruit juices delivered icy cold.",
      banner: "/images/catalog/dishes/beverages/coca-cola.webp",
    },
    drinks: {
      name: "Drinks",
      description: "Refreshing cold drinks, sodas, chilled mocktails, and fresh fruit juices delivered icy cold.",
      banner: "/images/catalog/dishes/beverages/coca-cola.webp",
    },
    desserts: {
      name: "Desserts",
      description: "Indulgent brownies, cakes, ice cream sundaes, waffles, and traditional Indian sweets.",
      banner: "/images/catalog/dishes/desserts/brownie-sundae.webp",
    },
    dessert: {
      name: "Desserts",
      description: "Indulgent brownies, cakes, ice cream sundaes, waffles, and traditional Indian sweets.",
      banner: "/images/catalog/dishes/desserts/brownie-sundae.webp",
    },
    coffee: {
      name: "Coffee",
      description: "Artisanal espresso brews, creamy lattes, caramel frappes, and refreshing cold brews.",
      banner: "/images/catalog/dishes/beverages/cold-coffee.webp",
    },
  };

  const defaultMeta = categoryMeta[normalized] || {
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    description: `Explore delicious ${slug} options from top-rated restaurants near you.`,
    banner: "/images/catalog/cuisines/pizza.webp",
  };

  // Mock catalog of 20+ items for category fallback
  const mockItemsMap: Record<string, Array<{ name: string; price: number; isVeg: boolean; img: string; rest: string }>> = {
    pizza: [
      { name: "Cheese Burst Pizza", price: 349, isVeg: true, img: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp", rest: "Pizza Italia Oven" },
      { name: "Classic Margherita Pizza", price: 249, isVeg: true, img: "/images/catalog/dishes/pizza/classic-margherita.webp", rest: "Domino's Pizza" },
      { name: "Farmhouse Loaded Pizza", price: 329, isVeg: true, img: "/images/catalog/dishes/pizza/farmhouse-pizza.webp", rest: "Pizza Hut" },
      { name: "BBQ Chicken Feast Pizza", price: 399, isVeg: false, img: "/images/catalog/dishes/pizza/bbq-chicken-pizza.webp", rest: "Pizza Italia Oven" },
      { name: "Pepperoni Overload Pizza", price: 449, isVeg: false, img: "/images/catalog/dishes/pizza/pepperoni-pizza.webp", rest: "Pizza Hut" },
      { name: "Veggie Supreme Delight", price: 339, isVeg: true, img: "/images/catalog/dishes/pizza/veggie-supreme-pizza.webp", rest: "Pizza Italia Oven" },
      { name: "Paneer Tikka Pizza", price: 339, isVeg: true, img: "/images/catalog/dishes/pizza/paneer-tikka-pizza.webp", rest: "Domino's Pizza" },
      { name: "Mexican Green Wave", price: 319, isVeg: true, img: "/images/catalog/dishes/pizza/mexican-green-wave-pizza.webp", rest: "Pizza Hut" },
      { name: "Spicy Peri Peri Chicken Pizza", price: 359, isVeg: false, img: "/images/catalog/dishes/pizza/spicy-peri-peri-pizza.webp", rest: "Pizza Italia Oven" },
      { name: "Chicken Sausage Pizza", price: 389, isVeg: false, img: "/images/catalog/dishes/pizza/chicken-sausage-pizza.webp", rest: "Domino's Pizza" },
      { name: "Four Cheese Feast", price: 429, isVeg: true, img: "/images/catalog/dishes/pizza/four-cheese-pizza.webp", rest: "Pizza Italia Oven" },
      { name: "Mushroom Truffle Pizza", price: 459, isVeg: true, img: "/images/catalog/dishes/pizza/mushroom-truffle-pizza.webp", rest: "Pizza Hut" },
      { name: "Hawaiian Pineapple Pizza", price: 379, isVeg: true, img: "/images/catalog/dishes/pizza/hawaiian-pizza.webp", rest: "Pizza Italia Oven" },
      { name: "Corn and Cheese Pizza", price: 279, isVeg: true, img: "/images/catalog/dishes/pizza/corn-and-cheese-pizza.webp", rest: "Domino's Pizza" },
      { name: "Tandoori Paneer Pizza", price: 349, isVeg: true, img: "/images/catalog/dishes/pizza/tandoori-pizza.webp", rest: "Pizza Hut" },
      { name: "Double Cheese Margherita", price: 289, isVeg: true, img: "/images/catalog/dishes/pizza/classic-margherita.webp", rest: "Domino's Pizza" },
      { name: "Italian Spicy Veggie", price: 319, isVeg: true, img: "/images/catalog/dishes/pizza/veggie-supreme-pizza.webp", rest: "Pizza Italia Oven" },
      { name: "Smoked Chicken BBQ Overload", price: 469, isVeg: false, img: "/images/catalog/dishes/pizza/bbq-chicken-pizza.webp", rest: "Pizza Hut" },
      { name: "Fiery Jalapeño Chicken", price: 419, isVeg: false, img: "/images/catalog/dishes/pizza/spicy-peri-peri-pizza.webp", rest: "Pizza Italia Oven" },
      { name: "Gourmet Basil Pesto Pizza", price: 439, isVeg: true, img: "/images/catalog/dishes/pizza/four-cheese-pizza.webp", rest: "Domino's Pizza" },
    ],
    burger: [
      { name: "Crispy Chicken Zinger Burger", price: 199, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "KFC" },
      { name: "Veg Supreme Cheese Burger", price: 149, isVeg: true, img: "/images/catalog/cuisines/burger.webp", rest: "Burger King" },
      { name: "Double Cheese Beef Burger", price: 249, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "McDonald's" },
      { name: "Tower Zinger Monster Burger", price: 279, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "KFC" },
      { name: "Paneer Tikka Burger", price: 169, isVeg: true, img: "/images/catalog/cuisines/burger.webp", rest: "Burger Craft House" },
      { name: "Spicy Peri Peri Chicken Burger", price: 209, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "KFC" },
      { name: "Mushroom Swiss Cheese Burger", price: 229, isVeg: true, img: "/images/catalog/cuisines/burger.webp", rest: "Burger King" },
      { name: "Classic American Cheeseburger", price: 189, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "McDonald's" },
      { name: "Smoky BBQ Bacon Burger", price: 269, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "Burger Craft House" },
      { name: "Tex-Mex Jalapeño Burger", price: 179, isVeg: true, img: "/images/catalog/cuisines/burger.webp", rest: "Burger King" },
      { name: "Mexican Nacho Crunch Burger", price: 199, isVeg: true, img: "/images/catalog/cuisines/burger.webp", rest: "McDonald's" },
      { name: "Royal Mutton Galouti Burger", price: 289, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "Burger Craft House" },
      { name: "Grilled Teriyaki Chicken Burger", price: 239, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "Burger King" },
      { name: "Crispy Fish Fillet Burger", price: 219, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "McDonald's" },
      { name: "Double Patty Overload Burger", price: 279, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "KFC" },
      { name: "Herb Potato Patty Burger", price: 129, isVeg: true, img: "/images/catalog/cuisines/burger.webp", rest: "McDonald's" },
      { name: "Chipotle Chicken Slider", price: 159, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "KFC" },
      { name: "Fried Egg & Cheese Burger", price: 169, isVeg: false, img: "/images/catalog/cuisines/burger.webp", rest: "Burger King" },
      { name: "Butter Paneer Makhani Burger", price: 179, isVeg: true, img: "/images/catalog/cuisines/burger.webp", rest: "Burger Craft House" },
      { name: "Volcano Cheese Burst Burger", price: 249, isVeg: true, img: "/images/catalog/cuisines/burger.webp", rest: "Burger King" },
    ],
    biryani: [
      { name: "Hyderabadi Chicken Dum Biryani", price: 299, isVeg: false, img: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp", rest: "Behrouz Biryani" },
      { name: "Royal Mutton Dum Biryani", price: 399, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Biryani By Kilo" },
      { name: "Special Egg Dum Biryani", price: 219, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Behrouz Biryani" },
      { name: "Veg Dum Biryani with Raita", price: 199, isVeg: true, img: "/images/catalog/cuisines/biryani.webp", rest: "Biryani By Kilo" },
      { name: "Paneer Tikka Dum Biryani", price: 249, isVeg: true, img: "/images/catalog/cuisines/biryani.webp", rest: "Behrouz Biryani" },
      { name: "Kolkata Chicken Biryani", price: 319, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Biryani By Kilo" },
      { name: "Family Pack Chicken Biryani", price: 699, isVeg: false, img: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp", rest: "Behrouz Biryani" },
      { name: "Lucknowi Awadhi Chicken Biryani", price: 329, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Behrouz Biryani" },
      { name: "Boneless Chicken Biryani", price: 339, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Biryani By Kilo" },
      { name: "Spicy Andhra Chicken Biryani", price: 289, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Behrouz Biryani" },
      { name: "Prawns Dum Biryani", price: 449, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Biryani By Kilo" },
      { name: "Chicken 65 Biryani Fusion", price: 349, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Behrouz Biryani" },
      { name: "Keema Dum Biryani", price: 379, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Biryani By Kilo" },
      { name: "Matka Handi Biryani", price: 359, isVeg: false, img: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp", rest: "Behrouz Biryani" },
      { name: "Fish Tikka Biryani", price: 389, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Biryani By Kilo" },
      { name: "Mushroom Dum Biryani", price: 229, isVeg: true, img: "/images/catalog/cuisines/biryani.webp", rest: "Behrouz Biryani" },
      { name: "Soya Chaap Biryani", price: 219, isVeg: true, img: "/images/catalog/cuisines/biryani.webp", rest: "Biryani By Kilo" },
      { name: "Butter Chicken Biryani", price: 349, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Behrouz Biryani" },
      { name: "Malabar Fish Biryani", price: 399, isVeg: false, img: "/images/catalog/cuisines/biryani.webp", rest: "Biryani By Kilo" },
      { name: "Jumbo Party Pack Biryani", price: 999, isVeg: false, img: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp", rest: "Behrouz Biryani" },
    ],
    momos: [
      { name: "Steamed Veg Momos (8 pcs)", price: 119, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Fried Chicken Momos (8 pcs)", price: 149, isVeg: false, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Kurkure Cheese Corn Momos", price: 179, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Tandoori Paneer Momos", price: 169, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Momo House" },
      { name: "Schezwan Chicken Gravy Momos", price: 189, isVeg: false, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Darjeeling Steam Chicken Momos", price: 139, isVeg: false, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Momo House" },
      { name: "Afghan Malai Cream Momos", price: 199, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Chili Garlic Pan Fried Momos", price: 159, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Momo House" },
      { name: "Jhol Momos Special Bowl", price: 169, isVeg: false, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Soup Momos Bowl", price: 149, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Momo House" },
      { name: "Mushroom Cheese Steam Momos", price: 139, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Wheat Veg Momos", price: 129, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Momo House" },
      { name: "Chicken Cheese Kurkure Momos", price: 199, isVeg: false, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Green Chili Paneer Momos", price: 159, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Momo House" },
      { name: "Chocolate Sweet Dessert Momos", price: 139, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Spicy Dragon Chicken Momos", price: 179, isVeg: false, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Momo House" },
      { name: "BBQ Grilled Chicken Momos", price: 189, isVeg: false, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Soya Crunchy Momos", price: 139, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Momo House" },
      { name: "Cheese Blast Steam Momos", price: 189, isVeg: true, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
      { name: "Assorted Momos Platter (12 pcs)", price: 249, isVeg: false, img: "/images/catalog/dishes/dish-mo-1.jpg", rest: "Wow! Momo" },
    ],
    beverages: [
      { name: "Chilled Coca Cola (500ml)", price: 45, isVeg: true, img: "/images/catalog/dishes/beverages/coca-cola.webp", rest: "Beverage Hub" },
      { name: "Pepsi Cold Can (330ml)", price: 40, isVeg: true, img: "/images/catalog/dishes/beverages/pepsi.webp", rest: "Beverage Hub" },
      { name: "Virgin Mojito Mocktail", price: 129, isVeg: true, img: "/images/catalog/dishes/beverages/virgin-mojito.webp", rest: "Mocktail Bar" },
      { name: "Iced Cold Coffee with Scoop", price: 149, isVeg: true, img: "/images/catalog/dishes/beverages/cold-coffee.webp", rest: "Cafe Latte" },
      { name: "Fresh Mango Milkshake", price: 139, isVeg: true, img: "/images/catalog/dishes/beverages/mango-shake.webp", rest: "Beverage Hub" },
      { name: "Fresh Lemonade Spritzer", price: 89, isVeg: true, img: "/images/catalog/dishes/beverages/lemonade.webp", rest: "Mocktail Bar" },
      { name: "Fresh Orange Juice", price: 119, isVeg: true, img: "/images/catalog/dishes/beverages/fresh-orange-juice.webp", rest: "Juice Corner" },
      { name: "Red Bull Energy Drink", price: 125, isVeg: true, img: "/images/catalog/dishes/beverages/red-bull.webp", rest: "Beverage Hub" },
      { name: "Chocolate Milkshake", price: 149, isVeg: true, img: "/images/catalog/dishes/beverages/chocolate-milkshake.webp", rest: "Beverage Hub" },
      { name: "Iced Peach Tea", price: 99, isVeg: true, img: "/images/catalog/dishes/beverages/iced-tea.webp", rest: "Mocktail Bar" },
      { name: "Salted Caramel Frappe", price: 159, isVeg: true, img: "/images/catalog/dishes/beverages/salted-caramel-frappe.webp", rest: "Cafe Latte" },
      { name: "Espresso Coffee Shot", price: 119, isVeg: true, img: "/images/catalog/dishes/beverages/espresso-coffee.webp", rest: "Cafe Latte" },
      { name: "Oreo Overload Shake", price: 149, isVeg: true, img: "/images/catalog/dishes/beverages/oreo-shake.webp", rest: "Beverage Hub" },
      { name: "Classic Cappuccino", price: 139, isVeg: true, img: "/images/catalog/dishes/beverages/classic-cappuccino.webp", rest: "Cafe Latte" },
      { name: "Masala Chai Flask", price: 99, isVeg: true, img: "/images/catalog/dishes/beverages/masala-tea.webp", rest: "Tea Point" },
      { name: "Fanta Orange Can", price: 40, isVeg: true, img: "/images/catalog/dishes/beverages/fanta.webp", rest: "Beverage Hub" },
      { name: "Sprite Lemon Can", price: 40, isVeg: true, img: "/images/catalog/dishes/beverages/sprite.webp", rest: "Beverage Hub" },
      { name: "Mountain Dew Can", price: 40, isVeg: true, img: "/images/catalog/dishes/beverages/mountain-dew.webp", rest: "Beverage Hub" },
      { name: "Cafe Latte", price: 149, isVeg: true, img: "/images/catalog/dishes/beverages/cafe-latte.webp", rest: "Cafe Latte" },
      { name: "Chilled Badam Milk", price: 119, isVeg: true, img: "/images/catalog/dishes/beverages/cold-coffee.webp", rest: "Beverage Hub" },
    ],
    desserts: [
      { name: "Sizzling Brownie & Ice Cream", price: 189, isVeg: true, img: "/images/catalog/dishes/desserts/brownie-sundae.webp", rest: "Baskin Robbins" },
      { name: "Hot Chocolate Sundae", price: 149, isVeg: true, img: "/images/catalog/dishes/desserts/hot-chocolate-sundae.webp", rest: "Baskin Robbins" },
      { name: "Belgian Chocolate Waffle", price: 169, isVeg: true, img: "/images/catalog/dishes/desserts/belgian-waffle.webp", rest: "The Waffle Co" },
      { name: "Red Velvet Cake Slice", price: 139, isVeg: true, img: "/images/catalog/dishes/desserts/red-velvet-cake.webp", rest: "Sweet Tooth Bakery" },
      { name: "Hot Gulab Jamun (2 pcs)", price: 89, isVeg: true, img: "/images/catalog/dishes/desserts/gulab-jamun.webp", rest: "Haldiram's" },
      { name: "New York Cheesecake", price: 199, isVeg: true, img: "/images/catalog/dishes/desserts/new-york-cheesecake.webp", rest: "Sweet Tooth Bakery" },
      { name: "Kesari Rasmalai (2 pcs)", price: 119, isVeg: true, img: "/images/catalog/dishes/desserts/rasmalai.webp", rest: "Haldiram's" },
      { name: "Italian Tiramisu Cup", price: 179, isVeg: true, img: "/images/catalog/dishes/desserts/tiramisu-cup.webp", rest: "Sweet Tooth Bakery" },
      { name: "Mango Pudding Cup", price: 99, isVeg: true, img: "/images/catalog/dishes/desserts/mango-pudding.webp", rest: "Sweet Tooth Bakery" },
      { name: "Assorted Donut Box (4 pcs)", price: 219, isVeg: true, img: "/images/catalog/dishes/desserts/glazed-donuts.webp", rest: "Glazed Donuts" },
      { name: "Butterscotch Ice Cream", price: 89, isVeg: true, img: "/images/catalog/dishes/desserts/butterscotch-ice-cream.webp", rest: "Baskin Robbins" },
      { name: "Chocolate Mousse Glass", price: 129, isVeg: true, img: "/images/catalog/dishes/desserts/chocolate-mousse.webp", rest: "Sweet Tooth Bakery" },
      { name: "Caramel Custard Pudding", price: 109, isVeg: true, img: "/images/catalog/dishes/desserts/caramel-custard.webp", rest: "Sweet Tooth Bakery" },
      { name: "Fudge Chocolate Cake", price: 149, isVeg: true, img: "/images/catalog/dishes/desserts/chocolate-cake.webp", rest: "Sweet Tooth Bakery" },
      { name: "Assorted Pastries Pack", price: 249, isVeg: true, img: "/images/catalog/dishes/desserts/assorted-pastries.webp", rest: "Sweet Tooth Bakery" },
      { name: "Vanilla Bean Ice Cream", price: 79, isVeg: true, img: "/images/catalog/dishes/desserts/vanilla-ice-cream.webp", rest: "Baskin Robbins" },
      { name: "Strawberry Gelato", price: 119, isVeg: true, img: "/images/catalog/dishes/desserts/strawberry-ice-cream.webp", rest: "Baskin Robbins" },
      { name: "Fudge Brownie Slice", price: 119, isVeg: true, img: "/images/catalog/dishes/desserts/fudge-brownie.webp", rest: "Sweet Tooth Bakery" },
      { name: "Chocolate Ice Cream Scoop", price: 89, isVeg: true, img: "/images/catalog/dishes/desserts/chocolate-ice-cream.webp", rest: "Baskin Robbins" },
      { name: "Royal Rabri Jalebi", price: 129, isVeg: true, img: "/images/catalog/dishes/desserts/gulab-jamun.webp", rest: "Haldiram's" },
    ],
  };

  const key = normalized === "drinks" ? "beverages" : normalized === "dessert" ? "desserts" : normalized;
  const rawList = mockItemsMap[key] || mockItemsMap["pizza"];

  const items: CuisineFoodItem[] = rawList.map((item, idx) => ({
    menu_item_id: `mock-${key}-${idx + 1}`,
    restaurant_id: `rest-${key}-${(idx % 4) + 1}`,
    restaurant_name: item.rest,
    name: item.name,
    description: `Delicious authentic ${defaultMeta.name.toLowerCase()} item freshly prepared with premium ingredients.`,
    price: Math.round(item.price * 1.3),
    original_price: Math.round(item.price * 1.3),
    discounted_price: item.price,
    discount_percentage: 23,
    rating: (4.4 + (idx % 5) * 0.1).toFixed(1),
    delivery_time: `${20 + (idx % 3) * 5} min`,
    is_vegetarian: item.isVeg,
    image_url: item.img,
  }));

  return { meta: defaultMeta, items };
}

export default function CuisineDetailView({ slug }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [diet, setDiet] = useState("all");
  const [rating, setRating] = useState("all");
  const [delivery, setDelivery] = useState("all");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState("popular");
  const { quantities, updatingId, updateQuantity, addAndCheckout, cart } = useCartActions();
  const { itemIds, restaurantIds, toggleItem, toggleRestaurant } = useFavoriteActions();

  const { data: rawCuisine, isLoading: loadingCuisine } = useSWR(
    slug ? `/api/cuisines/${slug}` : null
  );
  const { data: rawItems, isLoading: loadingItems } = useSWR(
    slug ? `/api/cuisines/${slug}/items` : null
  );

  const fallbackData = useMemo(() => getMockCategoryData(slug), [slug]);

  const cuisine = (rawCuisine as any)?.data || rawCuisine || {
    name: fallbackData.meta.name,
    description: fallbackData.meta.description,
    image_url: fallbackData.meta.banner,
    restaurant_count: 12,
    item_count: fallbackData.items.length,
  };

  const fetchedItems = (rawItems as any)?.data || rawItems;
  const items: CuisineFoodItem[] = Array.isArray(fetchedItems) && fetchedItems.length > 0
    ? fetchedItems
    : fallbackData.items;

  const cartItems = cart?.items || [];
  const cuisineGallery = (items || []).slice(0, 6);

  const filteredItems = useMemo(() => {
    const list: CuisineFoodItem[] = items || [];
    const q = searchQuery.toLowerCase();
    const result = list.filter((item) => {
      const itemRating = Number(item.rating || 0);
      const deliveryMinutes = Number.parseInt(item.delivery_time || "30", 10);
      const itemPrice = item.discounted_price;
      return (
        (!q ||
          item.name.toLowerCase().includes(q) ||
          item.restaurant_name.toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q)) &&
        (diet === "all" || (diet === "veg" ? item.is_vegetarian : !item.is_vegetarian)) &&
        (rating === "all" || itemRating >= Number(rating)) &&
        (delivery === "all" || deliveryMinutes <= Number(delivery)) &&
        (price === "all" ||
          (price === "under-200"
            ? itemPrice < 200
            : price === "200-400"
              ? itemPrice >= 200 && itemPrice <= 400
              : itemPrice > 400))
      );
    });

    return result.sort((a, b) => {
      if (sort === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
      if (sort === "price-low") return a.discounted_price - b.discounted_price;
      if (sort === "price-high") return b.discounted_price - a.discounted_price;
      return 0;
    });
  }, [delivery, diet, items, price, rating, searchQuery, sort]);

  const restaurants = useMemo(() => {
    const restaurantMap = new Map<
      string,
      {
        id: string;
        name: string;
        image?: string;
        rating: number;
        deliveryTime: string;
        minPrice: number;
        dishCount: number;
      }
    >();

    (items || []).forEach((item: CuisineFoodItem) => {
      const existing = restaurantMap.get(item.restaurant_id);
      if (existing) {
        existing.dishCount += 1;
        existing.minPrice = Math.min(existing.minPrice, item.discounted_price);
        existing.rating = Math.max(existing.rating, Number(item.rating || 4.5));
        return;
      }
      restaurantMap.set(item.restaurant_id, {
        id: item.restaurant_id,
        name: item.restaurant_name,
        image: item.image_url,
        rating: Number(item.rating || 4.5),
        deliveryTime: item.delivery_time || "30 min",
        minPrice: item.discounted_price,
        dishCount: 1,
      });
    });

    const q = restaurantQuery.trim().toLowerCase();
    return Array.from(restaurantMap.values()).filter(
      (restaurant) => !q || restaurant.name.toLowerCase().includes(q)
    );
  }, [items, restaurantQuery]);

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[#E23744] selection:text-white pt-[90px]">
      <Navbar />
      <FloatingCart />

      <div className="container mx-auto px-4 md:px-8 py-8 max-w-[1600px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#666666] hover:text-[#1A1A1A] mb-6 transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Large Banner */}
        <div className="relative rounded-3xl overflow-hidden mb-10 border border-[#ECECEC] bg-[#1A1A1A]">
          <div className="absolute inset-0">
            <SafeImage
              src={cuisine.image_url}
              fallback={RESTAURANT_FALLBACK}
              alt={cuisine.name}
              fill
              sizes={HERO_BACKGROUND_SIZES}
              className="object-cover opacity-50"
            />
          </div>
          <div className="relative z-10 bg-gradient-to-r from-black/80 via-black/50 to-transparent p-8 md:p-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E23744] text-white text-xs font-black uppercase tracking-wider mb-3 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Category</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3">{cuisine.name} Options</h1>
            <p className="text-gray-200 text-sm md:text-lg max-w-2xl mb-4 font-medium">{cuisine.description}</p>
            <div className="flex flex-wrap gap-4 text-xs font-bold">
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-white">
                <UtensilsCrossed className="w-4 h-4 text-[#E23744]" />
                {cuisine.restaurant_count || 12} Restaurants
              </span>
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-white">
                {items.length} Delicious Dishes Available
              </span>
            </div>
          </div>
        </div>

        {/* Nearby Restaurants for Category */}
        {restaurants.length > 0 && (
          <section className="mb-12" aria-labelledby="cuisine-restaurants-heading">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 id="cuisine-restaurants-heading" className="text-2xl font-black text-[#1A1A1A]">
                  Popular {cuisine.name} Spots
                </h2>
                <p className="mt-1 text-xs md:text-sm text-[#666666] font-medium">
                  Top nearby restaurants serving authentic {cuisine.name.toLowerCase()}.
                </p>
              </div>
              <label className="relative w-full md:w-80">
                <span className="sr-only">Search restaurants</span>
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E8E]" />
                <input
                  type="search"
                  value={restaurantQuery}
                  onChange={(event) => setRestaurantQuery(event.target.value)}
                  placeholder="Search restaurants..."
                  className="h-11 w-full rounded-xl border border-[#ECECEC] bg-[#F8F8F8] pl-10 pr-4 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-gray-500 focus:border-[#E23744]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {restaurants.map((restaurant) => (
                <article
                  key={restaurant.id}
                  className="group relative flex min-w-0 gap-3 rounded-2xl border border-[#ECECEC] bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#E23744]/50 hover:shadow-md"
                >
                  <Link
                    href={`/restaurant/${restaurant.id}`}
                    className="flex min-w-0 flex-1 gap-3"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F8F8F8] relative">
                      <SafeImage
                        src={restaurant.image}
                        fallback={RESTAURANT_FALLBACK}
                        alt={restaurant.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 py-1">
                      <h3 className="line-clamp-1 pr-7 text-sm font-black text-[#1A1A1A]">
                        {restaurant.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-3 text-xs text-[#666666] font-semibold">
                        <span className="inline-flex items-center gap-1 bg-[#16A34A] text-white px-1.5 py-0.5 rounded text-[10px] font-black">
                          <Star className="h-3 w-3 fill-current" />
                          {restaurant.rating.toFixed(1)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[#E23744]" />
                          {restaurant.deliveryTime}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[#666666]">
                        {restaurant.dishCount} dishes · From ₹{restaurant.minPrice}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleRestaurant(restaurant.id)}
                    className="absolute right-3 top-3 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#E23744]"
                    aria-label={
                      restaurantIds.has(restaurant.id)
                        ? "Remove restaurant from favorites"
                        : "Add restaurant to favorites"
                    }
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        restaurantIds.has(restaurant.id)
                          ? "fill-[#E23744] text-[#E23744]"
                          : ""
                      }`}
                    />
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Food Gallery */}
        {cuisineGallery.length > 0 && (
          <section className="mb-10" aria-labelledby="cuisine-gallery-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="cuisine-gallery-heading" className="text-2xl font-black text-[#1A1A1A]">
                  {cuisine.name} Food Highlights
                </h2>
                <p className="mt-1 text-xs md:text-sm text-[#666666]">
                  Top choices in this category available for instant order.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {cuisineGallery.map((item: any) => (
                <Link
                  key={item.menu_item_id}
                  href={`/food/${item.menu_item_id}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-[#ECECEC] bg-[#F8F8F8]"
                  aria-label={`View ${item.name}`}
                >
                  <SafeImage
                    src={item.image_url}
                    fallback={FOOD_FALLBACK}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10">
                    <span className="line-clamp-1 text-xs font-black text-white">{item.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search, Filters, Sorting & Dishes Section */}
        <section className="mb-8" aria-labelledby="popular-dishes-heading">
          <div className="mb-5">
            <h2 id="popular-dishes-heading" className="text-2xl font-black text-[#1A1A1A]">
              Explore All {cuisine.name} Dishes ({filteredItems.length})
            </h2>
            <p className="mt-1 text-xs md:text-sm text-[#666666]">
              Search and filter delicious {cuisine.name.toLowerCase()} items delivered in 25-30 minutes.
            </p>
          </div>

          <div className="rounded-2xl border border-[#ECECEC] bg-[#F8F8F8] p-3 md:p-4 mb-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A]">
              <SlidersHorizontal className="h-4 w-4 text-[#E23744]" />
              Filters & Search
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <label className="relative sm:col-span-2 lg:col-span-2">
                <span className="sr-only">Search dishes or restaurants</span>
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E8E]" />
                <input
                  type="search"
                  placeholder={`Search ${cuisine.name.toLowerCase()} dishes...`}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#ECECEC] bg-white pl-10 pr-4 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-gray-400 focus:border-[#E23744]"
                />
              </label>

              <select
                value={diet}
                onChange={(event) => setDiet(event.target.value)}
                aria-label="Diet preference"
                className="h-11 rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#E23744] font-medium"
              >
                <option value="all">All Food</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
              </select>
              <select
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                aria-label="Minimum rating"
                className="h-11 rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#E23744] font-medium"
              >
                <option value="all">Any Rating</option>
                <option value="4">4.0+ Rating</option>
                <option value="4.5">4.5+ Rating</option>
              </select>
              <select
                value={delivery}
                onChange={(event) => setDelivery(event.target.value)}
                aria-label="Maximum delivery time"
                className="h-11 rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#E23744] font-medium"
              >
                <option value="all">Any Time</option>
                <option value="30">Under 30 min</option>
                <option value="45">Under 45 min</option>
              </select>
              <select
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                aria-label="Price range"
                className="h-11 rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#E23744] font-medium"
              >
                <option value="all">Any Price</option>
                <option value="under-200">Under ₹200</option>
                <option value="200-400">₹200–₹400</option>
                <option value="above-400">Above ₹400</option>
              </select>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort dishes"
                className="h-11 rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#E23744] font-bold"
              >
                <option value="popular">Recommended</option>
                <option value="rating">Top Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </section>

        {cartItems.length > 0 && (
          <div className="mb-8 flex justify-end">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 bg-[#E23744] hover:bg-[#C81E34] text-white px-6 py-3 rounded-xl font-black transition-colors shadow-md"
            >
              <ShoppingCart className="w-5 h-5" />
              Proceed to Checkout
            </Link>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-[#F8F8F8] rounded-2xl border border-[#ECECEC]">
            <p className="text-[#666666] font-bold">
              No dishes match the selected search and filters.
            </p>
          </div>
        ) : (
          <div className="food-grid">
            {filteredItems.map((item: any) => (
              <CuisineFoodCard
                key={item.menu_item_id}
                item={item}
                quantity={quantities.get(item.menu_item_id) || 0}
                isUpdating={updatingId === item.menu_item_id}
                isFavorite={itemIds.has(item.menu_item_id)}
                onUpdateQuantity={updateQuantity}
                onToggleFavorite={toggleItem}
                onBuyNow={(menuItemId) => addAndCheckout(menuItemId, router)}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
