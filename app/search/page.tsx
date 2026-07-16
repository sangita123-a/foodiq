"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompactSearchBar from "@/components/CompactSearchBar";
import RestaurantCard from "@/components/RestaurantCard";
import MenuItemCard from "@/components/restaurant/MenuItemCard";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useState, Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  // The global search API
  const { data, isLoading } = useSWR(query ? `/api/search?q=${encodeURIComponent(query)}` : null);

  const results = Array.isArray(data) ? data : [];
  const restaurants = results.filter((r: any) => r.type === 'restaurant');
  const menuItems = results.filter((r: any) => r.type === 'menu_item');

  const [cart, setCart] = useState<Record<string, { quantity: number; price: number }>>({});
  
  const handleUpdateQuantity = (itemId: string, delta: number, price: number = 0) => {
    setCart((prev) => {
      const newCart = { ...prev };
      const currentQty = newCart[itemId]?.quantity || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        delete newCart[itemId];
      } else {
        newCart[itemId] = { quantity: newQty, price };
      }
      return newCart;
    });
  };

  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      
      {/* Top Search Section */}
      <div className="w-full bg-[#121212] py-8 border-b border-white/10">
        <div className="container mx-auto px-4 md:px-8">
          <CompactSearchBar />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">
            Search Results for "{query}"
          </h1>
          <p className="text-[var(--color-gray-text)] text-lg">
            {!query ? "Enter a search term above." : 
             isLoading ? "Searching..." :
             `Found ${restaurants.length} restaurants and ${menuItems.length} dishes.`}
          </p>
        </div>

        {/* Loading Skeletons */}
        {isLoading && query && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse border border-white/10"></div>
            ))}
          </div>
        )}

        {!isLoading && query && (
          <>
            {/* Restaurants */}
            {restaurants.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Restaurants</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {restaurants.map((restaurant: any, idx: number) => {
                    const mapped = {
                      id: restaurant.id,
                      name: restaurant.name,
                      image: restaurant.image_url || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600&h=400",
                      rating: restaurant.rating || "4.5",
                      time: "30 min",
                      cuisine: restaurant.description || "Various Cuisines",
                      priceForTwo: "₹400 for two"
                    };
                    return (
                      <RestaurantCard key={mapped.id} {...mapped} delay={idx * 0.1} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dishes */}
            {menuItems.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Dishes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {menuItems.map((item: any) => {
                     const mappedItem = {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        image: item.image_url || "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400",
                        price: item.price,
                        rating: "4.5",
                        isVeg: item.is_vegetarian,
                        prepTime: item.preparation_time || "15 min",
                      };
                      return (
                        <div key={item.id} className="bg-[#171717] rounded-xl p-1">
                           <MenuItemCard 
                             item={mappedItem} 
                             quantity={cart[item.id]?.quantity || 0}
                             onUpdateQuantity={(id, delta) => handleUpdateQuantity(id, delta, item.price)}
                           />
                           <div className="px-4 pb-3 text-xs text-primary font-bold">
                             From: {item.restaurant_name}
                           </div>
                        </div>
                      );
                  })}
                </div>
              </div>
            )}

            {restaurants.length === 0 && menuItems.length === 0 && (
              <div className="text-center py-20 bg-[#121212] rounded-2xl border border-white/10">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
                <p className="text-gray-400">Try searching for something else like "Biryani" or "Pizza".</p>
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
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-white">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
