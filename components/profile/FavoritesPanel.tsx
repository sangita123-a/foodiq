"use client";

import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

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
      <div className="bg-[#171717] rounded-[24px] p-6 md:p-8 border border-white/5">
        <div className="h-8 w-40 bg-white/5 animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 animate-pulse rounded-2xl" />
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
      className="bg-[#171717] rounded-[24px] p-6 md:p-8 border border-white/5"
    >
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-white">Favorites</h2>
        </div>
        <Link href="/favorites" className="text-primary text-sm font-bold hover:text-white">
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
                className="bg-[#111] border border-white/5 rounded-2xl p-4 flex gap-4 items-center"
              >
                <img
                  src={
                    r.image_url ||
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200"
                  }
                  alt={r.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/restaurant/${r.id}`} className="text-white font-bold hover:text-primary line-clamp-1">
                    {r.name}
                  </Link>
                  <p className="text-gray-500 text-sm line-clamp-1">{r.description || "Restaurant"}</p>
                </div>
                <button
                  onClick={() => removeRestaurant(r.id)}
                  className="text-gray-500 hover:text-red-400 p-2"
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
          <div className="text-center py-12 text-gray-400">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No favorite dishes yet.</p>
            <Link href="/restaurants" className="text-primary text-sm font-bold mt-2 inline-block">
              Explore menu →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="bg-[#111] border border-white/5 rounded-2xl p-4 flex gap-4 items-center"
              >
                <img
                  src={
                    item.image_url ||
                    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200"
                  }
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold line-clamp-1">{item.name}</h4>
                  <p className="text-gray-500 text-sm">{item.restaurant_name}</p>
                  <p className="text-primary text-sm font-bold">
                    ₹{parseFloat(item.discount_price || item.price || 0).toFixed(0)}
                  </p>
                </div>
                <button
                  onClick={() => removeDish(item.id)}
                  className="text-gray-500 hover:text-red-400 p-2"
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
