"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star, Clock } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { fetchRestaurantsPage } from "@/lib/restaurants";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import useSWR from "swr";

const INITIAL_LIMIT = 8;
const LOAD_MORE_LIMIT = 12;

type PopularRestaurant = {
  id: string | number;
  name: string;
  image: string;
  rating: string;
  time: string;
  cuisine: string;
  priceForTwo: string;
  is_veg?: boolean;
};

export default function PopularRestaurants() {
  const { data: coupons } = useSWR("/api/coupons");
  const activeOffer = coupons?.[0];

  const [restaurants, setRestaurants] = useState<PopularRestaurant[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const limit = pageNum === 1 ? INITIAL_LIMIT : LOAD_MORE_LIMIT;
      const { restaurants: items, pagination } = await fetchRestaurantsPage(
        pageNum,
        limit,
        "sort=popular"
      );
      setRestaurants((prev) => (append ? [...prev, ...items] : items));
      setPage(pagination.page);
      setTotalPages(pagination.totalPages);
    } catch {
      if (!append) setRestaurants([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  const handleViewMore = () => {
    if (page < totalPages && !isLoadingMore) {
      loadPage(page + 1, true);
    }
  };

  const hasMore = page < totalPages;
  const offerLabel = activeOffer
    ? activeOffer.discount_type === "percentage"
      ? `${activeOffer.discount_amount}% OFF`
      : `₹${activeOffer.discount_amount} OFF`
    : null;

  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Popular Restaurants Near You
          </h2>
          <p className="text-gray-400 text-lg">
            Handpicked restaurants with the best ratings and fastest delivery.
          </p>
        </div>
        <Link
          href="/popular-restaurants"
          className="hidden sm:inline-flex flex-shrink-0 px-5 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {isLoading
          ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-[320px] bg-[#111] rounded-2xl animate-pulse border border-white/10"
              />
            ))
          : restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="group relative bg-[#111] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(255,45,59,0.15)] transition-all duration-300 flex flex-col"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <SafeImage
                    src={restaurant.image}
                    fallback={RESTAURANT_FALLBACK}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                  {offerLabel && (
                    <div className="absolute top-3 left-3 bg-[#FF2D3B] text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
                      {offerLabel}
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md p-1.5 rounded-md">
                    <div
                      className={`w-4 h-4 border-2 flex items-center justify-center ${restaurant.is_veg ? "border-green-500" : "border-red-500"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${restaurant.is_veg ? "bg-green-500" : "bg-red-500"}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-green-600/20 text-green-500 px-2 py-1 rounded-lg text-sm font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {restaurant.rating}
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-1">{restaurant.cuisine}</p>

                  <div className="flex items-center justify-between text-sm text-gray-300 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{restaurant.time}</span>
                    </div>
                    <div className="text-gray-400 text-xs">•</div>
                    <span>{restaurant.priceForTwo}</span>
                  </div>

                  <Link
                    href={`/restaurant/${restaurant.id}`}
                    className="w-full mt-5 bg-white/5 hover:bg-primary text-white py-2.5 rounded-xl font-medium transition-colors duration-300 text-center block"
                  >
                    View Menu
                  </Link>
                </div>
              </div>
            ))}
      </div>

      {!isLoading && hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={handleViewMore}
            disabled={isLoadingMore}
            className="px-8 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold transition-all disabled:opacity-60"
          >
            {isLoadingMore ? "Loading..." : "View More"}
          </button>
        </div>
      )}
    </section>
  );
}
