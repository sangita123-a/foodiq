"use client";

import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, RESTAURANT_FALLBACK } from "@/lib/images";

export default function FavoritesPanel() {
  const { data, mutate, isLoading } = useSWR("/api/favorites");
  const { showToast } = useToast();
  const items = data?.items || (Array.isArray(data) ? data : []);
  const restaurants = data?.restaurants || [];

  const removeDish = async (id: string) => {
    try {
      await api.delete(`/api/favorites/${id}`);
      mutate();
      showToast("Removed from favorites", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to remove", "error");
    }
  };

  const removeRestaurant = async (id: string) => {
    try {
      await api.delete(`/api/favorites/restaurants/${id}`);
      mutate();
      showToast("Restaurant removed", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to remove", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-section rounded-[24px] p-6 md:p-8 border border-border">
        <div className="h-8 w-40 bg-section animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-section animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-section rounded-[24px] p-6 md:p-8 border border-border"
    >
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Favorites</h2>
        </div>
        <Link href="/favorites" className="text-primary text-sm font-bold hover:text-foreground">
          Open full page
        </Link>
      </div>

      {restaurants.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-white mb-4">Restaurants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((r: any) => (
              <div
                key={r.id}
                className="bg-white border border-border rounded-2xl p-4 flex gap-4 items-center"
              >
                <SafeImage
                  src={r.image_url}
                  fallback={RESTAURANT_FALLBACK}
                  alt={r.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/restaurant/${r.id}`} className="text-white font-bold hover:text-primary line-clamp-1">
                    {r.name}
                  </Link>
                  <p className="text-[#9CA3AF] text-sm line-clamp-1">{r.description || "Restaurant"}</p>
                </div>
                <button
                  onClick={() => removeRestaurant(r.id)}
                  className="text-[#9CA3AF] hover:text-red-400 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Dishes</h3>
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-text">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No favorite dishes yet.</p>
            <Link href="/order-online" className="text-primary text-sm font-bold mt-2 inline-block">
              Explore menu →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="bg-white border border-border rounded-2xl p-4 flex gap-4 items-center"
              >
                <SafeImage
                  src={item.image_url}
                  fallback={FOOD_FALLBACK}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold line-clamp-1">{item.name}</h4>
                  <p className="text-[#9CA3AF] text-sm">{item.restaurant_name}</p>
                  <p className="text-primary text-sm font-bold">
                    ₹{parseFloat(item.discount_price || item.price || 0).toFixed(0)}
                  </p>
                </div>
                <button
                  onClick={() => removeDish(item.id)}
                  className="text-[#9CA3AF] hover:text-red-400 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
