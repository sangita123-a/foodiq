"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompactSearchBar from "@/components/CompactSearchBar";
import RestaurantCard from "@/components/RestaurantCard";
import MenuItemCard from "@/components/restaurant/MenuItemCard";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Suspense } from "react";
import { getFoodImage, mapRestaurantCard } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { quantities, updatingId, updateQuantity } = useCartActions();

  const { data, isLoading } = useSWR(query ? `/api/search?q=${encodeURIComponent(query)}` : null);

  const results = Array.isArray(data) ? data : [];
  const restaurants = results.filter((r: any) => r.type === "restaurant");
  const menuItems = results.filter((r: any) => r.type === "menu_item");
  const cuisines = results.filter((r: any) => r.type === "cuisine");

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="w-full bg-[#FFFFFF] py-8 border-b border-[#E5E7EB]">
        <div className="container mx-auto px-4 md:px-8">
          <CompactSearchBar />
        </div>
      </div>

      <div className="container mx-auto max-w-[1600px] px-4 md:px-8 py-10">
        <div className="food-section-heading text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Search Results for &quot;{query}&quot;
          </h1>
          <p>
            {!query
              ? "Enter a search term above."
              : isLoading
                ? "Searching..."
                : `Found ${restaurants.length} restaurants, ${menuItems.length} dishes, and ${cuisines.length} cuisines.`}
          </p>
        </div>

        {isLoading && query && (
          <div className="food-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-[#F8FAFC] rounded-2xl animate-pulse border border-[#E5E7EB]" />
            ))}
          </div>
        )}

        {!isLoading && query && (
          <>
            {cuisines.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Cuisines</h2>
                <div className="food-grid">
                  {cuisines.map((cuisine: any) => (
                    <Link
                      key={cuisine.id || cuisine.slug}
                      href={`/cuisine/${cuisine.slug}`}
                      className="food-card p-4 hover:border-primary/40"
                    >
                      <h3 className="text-lg font-bold text-[#111827]">{cuisine.name}</h3>
                      <p className="mt-2 text-sm text-[#6B7280] line-clamp-2">{cuisine.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {restaurants.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Restaurants</h2>
                <div className="food-grid">
                  {restaurants.map((restaurant: any, idx: number) => (
                    <RestaurantCard
                      key={restaurant.id}
                      {...mapRestaurantCard({
                        id: restaurant.id,
                        name: restaurant.name,
                        image_url: restaurant.image_url,
                        rating: restaurant.rating,
                        estimated_delivery_time: restaurant.estimated_delivery_time || restaurant.preparation_time,
                        description: restaurant.description,
                        category_name: restaurant.category_name,
                        price_range: restaurant.price_range,
                        distance_km: restaurant.distance_km,
                        offer_text: restaurant.offer_text,
                        is_veg: restaurant.is_veg,
                      })}
                      delay={idx * 0.1}
                    />
                  ))}
                </div>
              </div>
            )}

            {menuItems.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Dishes</h2>
                <div className="food-grid">
                  {menuItems.map((item: any) => {
                    const mappedItem = {
                      id: item.id,
                      name: item.name,
                      description: item.description,
                      image: getFoodImage(item.image_url),
                      price: item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price),
                      rating: String(item.rating || "4.5"),
                      isVeg: item.is_vegetarian,
                      prepTime: item.preparation_time ? `${item.preparation_time} min` : "15 min",
                    };
                    return (
                      <div key={item.id} className="min-w-0">
                        <MenuItemCard
                          item={mappedItem}
                          quantity={quantities.get(item.id) || 0}
                          isUpdating={updatingId === item.id}
                          onUpdateQuantity={updateQuantity}
                        />
                        <div className="px-4 pb-3 flex items-center justify-between text-xs">
                          <span className="text-primary font-bold">From: {item.restaurant_name}</span>
                          <Link href={`/food/${item.id}`} className="font-bold text-[#6B7280] hover:text-[#111827]">
                            View Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {restaurants.length === 0 && menuItems.length === 0 && cuisines.length === 0 && (
              <div className="text-center py-20 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB]">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
                <p className="text-[#6B7280]">Try searching for something else like &quot;Biryani&quot; or &quot;Pizza&quot;.</p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center text-[#111827]">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
