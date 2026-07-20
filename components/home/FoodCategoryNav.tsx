"use client";

import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

const FOOD_CATEGORIES = [
  { slug: "pizza", label: "Pizza", image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp" },
  { slug: "burger", label: "Burger", image: "/images/catalog/dishes/burger/cheese-burger.webp" },
  { slug: "chicken", label: "Chicken", image: "/images/catalog/dishes/indian/tandoori-chicken.webp" },
  { slug: "biryani", label: "Biryani", image: "/images/catalog/dishes/biryani/hyderabadi-biryani.webp" },
  { slug: "momos", label: "Momos", image: "/images/catalog/dishes/chinese/veg-momos.webp" },
  { slug: "drinks", label: "Drinks", image: "/images/catalog/dishes/beverages/coca-cola.webp" },
  { slug: "dessert", label: "Dessert", image: "/images/catalog/dishes/desserts/brownie-sundae.webp" },
  { slug: "coffee", label: "Coffee", image: "/images/catalog/dishes/beverages/classic-cappuccino.webp" },
  { slug: "fries", label: "Fries", image: "/images/catalog/dishes/burger/french-fries.webp" },
  { slug: "wraps", label: "Wraps", image: "/images/catalog/dishes/fast-food/chicken-wrap.webp" },
  { slug: "noodles", label: "Noodles", image: "/images/catalog/dishes/chinese/hakka-noodles.webp" },
  { slug: "sandwich", label: "Sandwich", image: "/images/catalog/dishes/fast-food/club-sandwich.webp" },
  { slug: "donuts", label: "Donuts", image: "/images/catalog/dishes/desserts/glazed-donuts.webp" },
  { slug: "icecream", label: "Ice Cream", image: "/images/catalog/dishes/desserts/butterscotch-ice-cream.webp" },
] as const;

export default function FoodCategoryNav() {
  return (
    <section className="bg-white py-6 sm:py-8" id="food-category-nav">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1A1A] md:text-3xl">
          🍽 Order Our Best Food Options
        </h2>
        <p className="mt-1 text-xs font-medium text-[#666666] md:text-sm">
          Choose your favourite food category
        </p>

        <div className="scroll-row mt-5 sm:mt-6 flex flex-nowrap overflow-x-auto">
          {FOOD_CATEGORIES.map((item) => (
            <Link
              key={item.slug}
              href={`/category/${item.slug}`}
              className="flex w-[72px] sm:w-[88px] md:w-[96px] flex-col items-center gap-2"
            >
              <div className="h-[72px] w-[72px] sm:h-[88px] sm:w-[88px] md:h-[96px] md:w-[96px] overflow-hidden rounded-full ring-2 ring-[#ECECEC] ring-offset-2">
                <SafeImage
                  src={item.image}
                  fallback={FOOD_FALLBACK}
                  decorative
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="w-full text-center text-[10px] sm:text-xs font-black text-[#1A1A1A] line-clamp-2 leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
