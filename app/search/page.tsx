"use client";

import { useMemo, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompactSearchBar from "@/components/CompactSearchBar";
import RestaurantCard from "@/components/RestaurantCard";
import MenuItemCard from "@/components/restaurant/MenuItemCard";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { getFoodImage, mapRestaurantCard } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { POPULAR_RESTAURANTS_30, TRENDING_DISHES_60 } from "@/lib/data/30restaurantsData";
import { restaurantMatchesCity, resolveCityKey } from "@/lib/heroLocation";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "";
  const cityKey = cityParam ? resolveCityKey(cityParam) : "";
  const { quantities, updatingId, updateQuantity } = useCartActions();

  const { data, isLoading } = useSWR(query ? `/api/search?q=${encodeURIComponent(query)}` : null);

  const results = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.results)
        ? data.results
        : [];

  const fallbackRestaurants = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return POPULAR_RESTAURANTS_30.filter((r) => {
      const matchesQuery =
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (!cityKey) return true;
      return restaurantMatchesCity(r.id, cityKey);
    });
  }, [query, cityKey]);

  const fallbackDishes = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return TRENDING_DISHES_60.filter((d) => {
      const matchesQuery =
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.restaurantName.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (!cityKey) return true;
      return restaurantMatchesCity(d.restaurantId, cityKey);
    });
  }, [query, cityKey]);

  const apiRestaurants = results
    .filter((r: any) => r.type === "restaurant")
    .filter((r: any) => !cityKey || !r.id || restaurantMatchesCity(String(r.id), cityKey));
  const apiMenuItems = results.filter((r: any) => r.type === "menu_item");
  const cuisines = results.filter((r: any) => r.type === "cuisine");

  const restaurants =
    apiRestaurants.length > 0
      ? apiRestaurants
      : fallbackRestaurants.map((r) => ({
          id: r.id,
          name: r.name,
          image_url: r.image,
          rating: r.rating,
          estimated_delivery_time: r.time,
          description: r.cuisine,
          category_name: r.category,
          price_range: 2,
          is_veg: r.isVeg,
        }));

  const menuItems =
    apiMenuItems.length > 0
      ? apiMenuItems
      : fallbackDishes.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          image_url: d.image,
          price: d.price,
          rating: d.rating,
          is_vegetarian: d.isVeg,
          restaurant_name: d.restaurantName,
        }));

  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="w-full bg-background py-8 border-b border-border">
        <div className="container mx-auto px-4 md:px-8">
          <CompactSearchBar />
        </div>
      </div>

      <div className="container mx-auto max-w-[1600px] px-4 md:px-8 py-10">
        <div className="food-section-heading text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
            Search Results for &quot;{query}&quot;
          </h1>
          <p className="text-gray-text">
            {!query
              ? "Enter a search term above."
              : isLoading && restaurants.length === 0
                ? "Searching..."
                : `Found ${restaurants.length} restaurants, ${menuItems.length} dishes, and ${cuisines.length} cuisines${
                    cityKey ? ` in ${cityKey}` : ""
                  }.`}
          </p>
        </div>

        {isLoading && restaurants.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-section rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        )}

        {query && (
          <>
            {cuisines.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Cuisines</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {cuisines.map((cuisine: any) => (
                    <Link
                      key={cuisine.id || cuisine.slug}
                      href={`/cuisine/${cuisine.slug}`}
                      className="p-4 rounded-2xl border border-border bg-white hover:border-primary transition-all shadow-sm"
                    >
                      <h3 className="text-lg font-bold text-foreground">{cuisine.name}</h3>
                      <p className="mt-2 text-sm text-gray-text line-clamp-2">{cuisine.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {restaurants.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Restaurants</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Dishes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {menuItems.map((item: any) => {
                    const mappedItem = {
                      id: String(item.id),
                      name: item.name,
                      description: item.description || "",
                      image: getFoodImage(item.image_url),
                      price: item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price),
                      rating: String(item.rating || "4.5"),
                      isVeg: Boolean(item.is_vegetarian ?? item.is_veg ?? true),
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
                        <div className="px-4 pb-3 flex items-center justify-between text-xs mt-2">
                          <span className="text-primary font-bold">From: {item.restaurant_name}</span>
                          <Link href={`/food/${item.id}`} className="font-bold text-gray-text hover:text-foreground">
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
              <div className="text-center py-20 bg-background rounded-2xl border border-border">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No results found</h3>
                <p className="text-gray-text">Try searching for something else like &quot;Biryani&quot; or &quot;Pizza&quot;.</p>
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
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
