"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FavoritesHeader from "@/components/favorites/FavoritesHeader";
import FavoritesFilterTabs, { FavoriteTab } from "@/components/favorites/FavoritesFilterTabs";
import FavRestaurantCard, { FavRestaurantType } from "@/components/favorites/FavRestaurantCard";
import FavDishCard, { FavDishType } from "@/components/favorites/FavDishCard";
import FavoritesEmptyState from "@/components/favorites/FavoritesEmptyState";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<FavoriteTab>("All Favorites");
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();
  
  const { data: favsData, mutate, isLoading, error } = useSWR('/api/favorites');
  const favItems = favsData?.items || (Array.isArray(favsData) ? favsData : []);
  const favRestaurantsRaw = favsData?.restaurants || [];
  
  const favDishes = favItems.map((item: any) => ({
    id: item.id, // menuItemId
    name: item.name,
    restaurant: item.restaurant_name,
    image: item.image_url || "https://images.unsplash.com/photo-1589302168068-964664d93cb0?auto=format&fit=crop&q=80&w=300",
    price: item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price),
    rating: "4.5",
    isVeg: item.is_vegetarian
  }));
  
  const favRestaurants = favRestaurantsRaw.map((r: any) => ({
    id: r.id,
    name: r.name,
    image: r.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    cuisine: r.description || "Various",
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
    try {
      await api.delete(`/api/favorites/${id}`);
      mutate();
      showToast("Removed from favorites", "success");
    } catch (error) {
      console.error("Failed to remove favorite", error);
      showToast("Failed to remove favorite", "error");
    }
  };

  // Filter by Tab and Search Query
  const q = searchQuery.toLowerCase();
  
  const filteredRestaurants = favRestaurants.filter((r: any) => r.name?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q));
  const filteredDishes = favDishes.filter((d: any) => d.name?.toLowerCase().includes(q) || d.restaurant?.toLowerCase().includes(q));

  const showRestaurants = activeTab === "All Favorites" || activeTab === "Restaurants";
  const showDishes = activeTab === "All Favorites" || activeTab === "Dishes";

  const isEmpty = (showRestaurants ? filteredRestaurants.length : 0) + (showDishes ? filteredDishes.length : 0) === 0;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="w-64 h-10 bg-white/5 animate-pulse rounded-lg"></div>
            <div className="w-64 h-10 bg-white/5 animate-pulse rounded-lg"></div>
          </div>
          {/* Tabs Skeleton */}
          <div className="flex gap-4 mb-8">
            <div className="w-24 h-10 bg-white/5 animate-pulse rounded-full"></div>
            <div className="w-24 h-10 bg-white/5 animate-pulse rounded-full"></div>
            <div className="w-24 h-10 bg-white/5 animate-pulse rounded-full"></div>
          </div>
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-white/5 animate-pulse rounded-2xl border border-white/10"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-white text-xl">Failed to load favorites</div>
        <button onClick={() => mutate()} className="px-6 py-2 bg-primary text-white rounded-lg">Retry</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
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
                {activeTab === "All Favorites" && <h3 className="text-2xl font-bold text-white mb-6">Restaurants</h3>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                {activeTab === "All Favorites" && <h3 className="text-2xl font-bold text-white mb-6">Dishes</h3>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredDishes.map((d: any) => (
                      <FavDishCard key={d.id} dish={d} onRemove={handleRemoveDish} />
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
