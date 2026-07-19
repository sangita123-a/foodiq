"use client";

import Link from "next/link";
import { ArrowRight, Clock, Star } from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK, mapRestaurantCard } from "@/lib/images";

export default function PopularRestaurants() {
  const { data: rawRestaurants, isLoading } = useSWR(
    "/api/restaurants?sort=popular&limit=8"
  );

  const restaurants = Array.isArray(rawRestaurants)
    ? rawRestaurants.map(mapRestaurantCard)
    : [];
  return (
    <section className="food-section" aria-labelledby="popular-restaurants-heading">
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-7">
        <div>
          <h2
            id="popular-restaurants-heading"
            className="mb-2 text-[32px] font-bold leading-tight tracking-[-0.045em] text-[#1C1C1C] sm:text-[34px] lg:text-[36px]"
          >
            Popular Restaurants Near You
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[#686B78] sm:text-[15px]">
            Handpicked restaurants with the best ratings and fastest delivery.
          </p>
        </div>
        <Link
          href="/popular-restaurants"
          className="food-button hidden sm:inline-flex flex-shrink-0 items-center px-5 rounded-xl border border-[#E5E7EB] text-[#111827] text-sm font-medium hover:bg-[#F8FAFC]"
        >
          View All
        </Link>
      </div>

      <div className="popular-restaurants-grid">
        {isLoading
          ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-[292px] animate-pulse rounded-[18px] border border-[#ECECEC] bg-[#F8F9FA]"
              />
            ))
          : restaurants.length === 0
            ? (
              <p className="col-span-full py-8 text-center text-sm text-[#686B78]">
                No restaurants available right now. Please try again shortly.
              </p>
            )
          : restaurants.map((restaurant, index) => (
              <div
                key={`${restaurant.id}-${index}`}
                className="food-card group relative flex h-full flex-col rounded-[18px]"
              >
                <Link
                  href={`/restaurant/${restaurant.id}`}
                  className="relative block h-[138px] w-full overflow-hidden"
                  aria-label={`View ${restaurant.name} menu`}
                >
                  <SafeImage
                    src={restaurant.image}
                    fallback={RESTAURANT_FALLBACK}
                    alt={restaurant.name}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 280px"
                    priority={index < 4}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.055]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/65 via-transparent to-white/10" />

                  {restaurant.offer && (
                    <div className="absolute left-3 top-3 rounded-lg bg-[#FC8019] px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_6px_18px_rgba(252,128,25,0.3)]">
                      {restaurant.offer}
                    </div>
                  )}

                  <div className="absolute right-3 top-3 rounded-md border border-[#E5E7EB] bg-black/45 p-1.5 backdrop-blur-md">
                    <div
                      className={`w-4 h-4 border-2 flex items-center justify-center ${restaurant.is_veg ? "border-green-500" : "border-red-500"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${restaurant.is_veg ? "bg-green-500" : "bg-red-500"}`}
                      />
                    </div>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col p-3">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-[15px] font-semibold leading-5 tracking-[-0.02em] text-[#1C1C1C] transition-colors group-hover:text-primary">
                      {restaurant.name}
                    </h3>
                    <div className="food-rating shrink-0">
                      <Star className="h-3 w-3 fill-current" />
                      {restaurant.rating}
                    </div>
                  </div>

                  <p className="mb-2.5 line-clamp-1 text-xs leading-5 text-[#6B7280]">
                    {restaurant.cuisine}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#E5E7EB] pt-2.5 text-[11px] text-[#6B7280]">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{restaurant.time}</span>
                    </div>
                    <span className="truncate font-semibold text-[#111827]">
                      {restaurant.priceForTwo}
                    </span>
                  </div>

                  <Link
                    href={`/restaurant/${restaurant.id}`}
                    className="food-button mt-2.5 inline-flex min-h-9 w-full items-center justify-center gap-1.5 border border-[#ECECEC] bg-[#F8F9FA] px-3 text-center text-xs font-semibold text-[#1C1C1C] hover:border-primary hover:bg-primary hover:text-white"
                  >
                    View Menu
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}
