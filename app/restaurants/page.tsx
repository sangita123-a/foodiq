"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompactSearchBar from "@/components/CompactSearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import FilterSidebar from "@/components/FilterSidebar";
import RestaurantCard from "@/components/RestaurantCard";
import TrendingSection from "@/components/TrendingSection";
import FoodRecommendation from "@/components/FoodRecommendation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchRestaurantsPage } from "@/lib/restaurants";

const PAGE_SIZE = 6;

function RestaurantsContent() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);

      try {
        const { restaurants: items, pagination } = await fetchRestaurantsPage(
          pageNum,
          PAGE_SIZE,
          queryString
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
    },
    [queryString]
  );

  useEffect(() => {
    setPage(1);
    loadPage(1, false);
  }, [loadPage]);

  const handleViewMore = () => {
    if (page < totalPages && !isLoadingMore) {
      loadPage(page + 1, true);
    }
  };

  const hasMore = page < totalPages;

  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="w-full bg-[#121212] py-8 border-b border-white/10">
        <div className="container mx-auto px-4 md:px-8">
          <CompactSearchBar />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">
            Restaurants Near You
          </h1>
          <p className="text-[var(--color-gray-text)] text-lg">
            Discover the best restaurants and delicious food around you
          </p>
        </div>

        <CategoryFilter />

        <div className="flex flex-col lg:flex-row gap-8 mt-12">
          <FilterSidebar />

          <div className="flex-1">
            <TrendingSection />

            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white">All Restaurants</h2>
                <div className="text-[var(--color-gray-text)] text-sm">
                  {isLoading ? "Loading..." : `${restaurants.length} places`}
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-[300px] bg-white/5 rounded-2xl animate-pulse border border-white/10"
                    />
                  ))}
                </div>
              ) : restaurants.length === 0 ? (
                <div className="text-center py-20 bg-[#121212] rounded-2xl border border-white/10">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No restaurants found</h3>
                  <p className="text-gray-400">
                    Try adjusting your filters or searching for something else.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {restaurants.map((restaurant: any, idx: number) => (
                      <RestaurantCard
                        key={`${restaurant.id}-${idx}`}
                        {...restaurant}
                        delay={Math.min(idx * 0.1, 0.5)}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center mt-10">
                      <button
                        onClick={handleViewMore}
                        disabled={isLoadingMore}
                        className="px-8 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isLoadingMore ? "Loading..." : "View More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <FoodRecommendation />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <RestaurantsContent />
    </Suspense>
  );
}
