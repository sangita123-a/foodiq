"use client";

import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { CATEGORY_NAV_IMAGES } from "@/lib/data/sectionImages";
import { CATEGORY_NAV_IMAGE_SIZES } from "@/lib/performance/assets";

const FOOD_CATEGORIES = [
  { slug: "pizza", label: "Pizza", image: CATEGORY_NAV_IMAGES.pizza },
  { slug: "burger", label: "Burger", image: CATEGORY_NAV_IMAGES.burger },
  { slug: "chicken", label: "Chicken", image: CATEGORY_NAV_IMAGES.chicken },
  { slug: "biryani", label: "Biryani", image: CATEGORY_NAV_IMAGES.biryani },
  { slug: "momos", label: "Momos", image: CATEGORY_NAV_IMAGES.momos },
  { slug: "drinks", label: "Drinks", image: CATEGORY_NAV_IMAGES.drinks },
  { slug: "dessert", label: "Dessert", image: CATEGORY_NAV_IMAGES.dessert },
  { slug: "coffee", label: "Coffee", image: CATEGORY_NAV_IMAGES.coffee },
  { slug: "fries", label: "Fries", image: CATEGORY_NAV_IMAGES.fries },
  { slug: "wraps", label: "Wraps", image: CATEGORY_NAV_IMAGES.wraps },
  { slug: "noodles", label: "Noodles", image: CATEGORY_NAV_IMAGES.noodles },
  { slug: "sandwich", label: "Sandwich", image: CATEGORY_NAV_IMAGES.sandwich },
  { slug: "donuts", label: "Donuts", image: CATEGORY_NAV_IMAGES.donuts },
  { slug: "cakes", label: "Cakes", image: CATEGORY_NAV_IMAGES.cakes },
] as const;

export default function FoodCategoryNav() {
  return (
    <section className="bg-white py-4 sm:py-8 md:py-8" id="food-category-nav">
      <div className="mx-auto max-w-[1440px] px-3 md:px-8">
        <h2 className="text-lg font-black tracking-tight text-foreground md:text-3xl sm:text-2xl">
          <span aria-hidden="true">🍽 </span>
          Order Our Best Food Options
        </h2>
        <p className="mt-0.5 text-[11px] font-medium text-gray-text md:mt-1 md:text-sm">
          Choose your favourite food category
        </p>

        <div className="scroll-row mt-3 flex flex-nowrap overflow-x-auto sm:mt-6">
          {FOOD_CATEGORIES.map((item) => (
            <Link
              key={item.slug}
              href={`/category/${item.slug}`}
              className="flex w-[56px] flex-col items-center gap-1 touch-target sm:w-[88px] md:w-[96px] sm:gap-1.5"
            >
              <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-border ring-offset-1 sm:h-[88px] sm:w-[88px] sm:ring-offset-2 md:h-[96px] md:w-[96px]">
                <SafeImage
                  src={item.image}
                  fallback={FOOD_FALLBACK}
                  decorative
                  width={96}
                  height={96}
                  sizes={CATEGORY_NAV_IMAGE_SIZES}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="w-full text-center text-[10px] font-black leading-tight text-foreground line-clamp-2 sm:text-xs">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
