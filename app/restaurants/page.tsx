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
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="w-full border-b border-[#ECECEC] bg-[#F8F9FA] py-8">
        <div className="container mx-auto px-4 md:px-8">
          <CompactSearchBar />
        </div>
      </div>

      <div className="container mx-auto max-w-[1600px] px-4 md:px-8 py-10">
        <div className="food-section-heading text-center md:text-left">
          <h1 className="mb-2 text-3xl font-black tracking-[-0.04em] text-[#1C1C1C] md:text-4xl">
            Restaurants Near You
          </h1>
          <p>
            Discover the best restaurants and delicious food around you
          </p>
        </div>

        <CategoryFilter />

        <div className="flex flex-col lg:flex-row gap-6 mt-8">
          <FilterSidebar />

          <div className="flex-1">
            <TrendingSection />

            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">All Restaurants</h2>
                <div className="text-[var(--color-gray-text)] text-sm">
                  {isLoading ? "Loading..." : `${restaurants.length} places`}
                </div>
              </div>

              {isLoading ? (
                <div className="food-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                    className="h-[300px] animate-pulse rounded-2xl border border-[#ECECEC] bg-[#F8F9FA]"
                    />
                  ))}
                </div>
              ) : restaurants.length === 0 ? (
                <div className="rounded-2xl border border-[#ECECEC] bg-white py-20 text-center shadow-[0_8px_24px_rgba(28,28,28,0.06)]">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h3 className="mb-2 text-2xl font-bold text-[#1C1C1C]">No restaurants found</h3>
                  <p className="text-[#686B78]">
                    Try adjusting your filters or searching for something else.
                  </p>
                </div>
              ) : (
                <>
                  <div className="food-grid">
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
                        className="food-button px-7 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
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
        <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center text-[#111827]">
          Loading...
        </div>
      }
    >
      <RestaurantsContent />
    </Suspense>
  );
}
