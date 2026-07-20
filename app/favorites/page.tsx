"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FavoritesHeader from "@/components/favorites/FavoritesHeader";
import FavoritesFilterTabs, { FavoriteTab } from "@/components/favorites/FavoritesFilterTabs";
import FavRestaurantCard from "@/components/favorites/FavRestaurantCard";
import FavDishCard from "@/components/favorites/FavDishCard";
import FavoritesEmptyState from "@/components/favorites/FavoritesEmptyState";
import useSWR from "swr";
import api from "@/services/api";
import { getFoodImage, getRestaurantImage } from "@/lib/images";
import { useToast } from "@/contexts/ToastContext";
import { useCartActions } from "@/hooks/useCartActions";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  resolveLocalFavoriteDishes,
  toggleLocalFavorite,
  type LocalFavoriteDishMeta,
} from "@/lib/favorites";

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<FavoriteTab>("All Favorites");
  const [searchQuery, setSearchQuery] = useState("");
  const [localDishes, setLocalDishes] = useState<LocalFavoriteDishMeta[]>([]);
  const authenticated = useAuthToken();
  const { showToast } = useToast();
  const { updateQuantity, updatingId } = useCartActions();

  const refreshLocalDishes = useCallback(() => {
    setLocalDishes(resolveLocalFavoriteDishes());
  }, []);

  useEffect(() => {
    refreshLocalDishes();
    const handler = () => refreshLocalDishes();
    window.addEventListener("foodiq:favorites-updated", handler);
    return () => window.removeEventListener("foodiq:favorites-updated", handler);
  }, [refreshLocalDishes]);
  
  const { data: favsData, mutate, isLoading, error } = useSWR(authenticated ? '/api/favorites' : null);
  const favItems = favsData?.items || (Array.isArray(favsData) ? favsData : []);
  const favRestaurantsRaw = favsData?.restaurants || [];
  
  const favDishes = useMemo(() => {
    const apiDishes = favItems.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item.name as string,
      restaurant: item.restaurant_name as string,
      image: getFoodImage(item.image_url as string),
      price: item.discount_price ? parseFloat(String(item.discount_price)) : parseFloat(String(item.price)),
      rating: Number(item.rating || item.restaurant_rating || 4.5).toFixed(1),
      isVeg: Boolean(item.is_vegetarian),
    }));

    if (authenticated) return apiDishes;

    return localDishes.map((d) => ({
      id: d.id,
      name: d.name,
      restaurant: d.restaurant,
      image: getFoodImage(d.image),
      price: d.price,
      rating: d.rating,
      isVeg: d.isVeg,
    }));
  }, [authenticated, favItems, localDishes]);
  
  const favRestaurants = favRestaurantsRaw.map((r: any) => ({
    id: r.id,
    name: r.name,
    image: getRestaurantImage(r.image_url),
    cuisine: r.category_name || r.description || "Various",
    rating: String(r.rating || "4.5"),
    eta: `${r.estimated_delivery_time || 30} min`,
    priceForTwo: "₹400 for two",
    isOpen: r.is_active !== false,
  }));

  const handleRemoveRestaurant = async (id: string) => {
    try {
      await api.delete(`/api/favorites/restaurants/${id}`);
      mutate();
      showToast("Removed from favorites", "success");
    } catch (error) {
      showToast("Failed to remove favorite", "error");
    }
  };

  const handleRemoveDish = async (id: string) => {
    if (!authenticated) {
      toggleLocalFavorite(id);
      refreshLocalDishes();
      showToast("Removed from favorites", "success");
      return;
    }
    try {
      await api.delete(`/api/favorites/${id}`);
      mutate();
      showToast("Removed from favorites", "success");
    } catch {
      showToast("Failed to remove favorite", "error");
    }
  };

  const handleAddDish = async (id: string) => {
    await updateQuantity(id, 1);
  };

  // Filter by Tab and Search Query
  const q = searchQuery.toLowerCase();
  
  const filteredRestaurants = favRestaurants.filter((r: any) => r.name?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q));
  const filteredDishes = favDishes.filter((d: any) => d.name?.toLowerCase().includes(q) || d.restaurant?.toLowerCase().includes(q));

  const showRestaurants = activeTab === "All Favorites" || activeTab === "Restaurants";
  const showDishes = activeTab === "All Favorites" || activeTab === "Dishes";

  const isEmpty =
    (authenticated
      ? (showRestaurants ? filteredRestaurants.length : 0) + (showDishes ? filteredDishes.length : 0)
      : showDishes
        ? filteredDishes.length
        : 0) === 0;

  if (authenticated && isLoading) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="w-64 h-10 bg-[#F8FAFC] animate-pulse rounded-lg"></div>
            <div className="w-64 h-10 bg-[#F8FAFC] animate-pulse rounded-lg"></div>
          </div>
          {/* Tabs Skeleton */}
          <div className="flex gap-4 mb-8">
            <div className="w-24 h-10 bg-[#F8FAFC] animate-pulse rounded-full"></div>
            <div className="w-24 h-10 bg-[#F8FAFC] animate-pulse rounded-full"></div>
            <div className="w-24 h-10 bg-[#F8FAFC] animate-pulse rounded-full"></div>
          </div>
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-[#F8FAFC] animate-pulse rounded-2xl border border-[#E5E7EB]"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (authenticated && error) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-white text-xl">Failed to load favorites</div>
        <button onClick={() => mutate()} className="px-6 py-2 bg-primary text-white rounded-lg">Retry</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12">
        
        <FavoritesHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <FavoritesFilterTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {isEmpty ? (
          <FavoritesEmptyState />
        ) : (
          <div className="flex flex-col gap-12">
            
            {showRestaurants && filteredRestaurants.length > 0 && (
              <div>
                {activeTab === "All Favorites" && <h3 className="text-2xl font-bold text-[#111827] mb-6">Restaurants</h3>}
                <div className="food-grid">
                  <AnimatePresence>
                    {filteredRestaurants.map((r: any) => (
                      <FavRestaurantCard key={r.id} restaurant={r} onRemove={handleRemoveRestaurant} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {showDishes && filteredDishes.length > 0 && (
              <div>
                {activeTab === "All Favorites" && <h3 className="text-2xl font-bold text-[#111827] mb-6">Dishes</h3>}
                <div className="food-grid">
                  <AnimatePresence>
                    {filteredDishes.map((d: any) => (
                      <FavDishCard
                        key={d.id}
                        dish={d}
                        onRemove={handleRemoveDish}
                        onAdd={handleAddDish}
                        isAdding={updatingId === d.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      <Footer />
    </main>
  );
}
