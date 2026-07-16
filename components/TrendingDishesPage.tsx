"use client";

import Image from "next/image";
import { Star, Plus, Minus } from "lucide-react";
import useSWR, { mutate as globalMutate } from "swr";
import Cookies from "js-cookie";
import { useMemo, useState, useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";

type TrendingDish = {
  id: string;
  name: string;
  restaurant: string;
  rating: number;
  price: number;
  image: string;
  description?: string;
};

export default function TrendingDishesPage() {
  const { showToast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get("token"));
  }, []);

  const { data: menuItems, isLoading } = useSWR("/api/menu-items");
  const { data: restaurants } = useSWR("/api/restaurants?limit=50");
  const { data: cartData, mutate: mutateCart } = useSWR(isLoggedIn ? "/api/cart" : null);

  const cartItems = cartData?.items || [];

  const restaurantMap = useMemo(() => {
    return Object.fromEntries(
      (restaurants || []).map((r: { id: string; name: string }) => [r.id, r.name])
    );
  }, [restaurants]);

  const dishes: TrendingDish[] = useMemo(() => {
    return (menuItems || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      restaurant: restaurantMap[item.restaurant_id] || "Foodiq Partner",
      rating: 4.5,
      price: item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price),
      image: getFoodImage(item.image_url),
      description: item.description,
    }));
  }, [menuItems, restaurantMap]);

  const getQuantity = (menuItemId: string) => {
    const cartItem = cartItems.find((i: { menu_item_id: string }) => i.menu_item_id === menuItemId);
    return cartItem?.quantity || 0;
  };

  const handleUpdateQuantity = async (menuItemId: string, delta: number) => {
    if (!Cookies.get("token")) {
      showToast("Please login to add items to cart", "error");
      return;
    }
    if (updatingId) return;

    const cartItem = cartItems.find((i: { menu_item_id: string }) => i.menu_item_id === menuItemId);
    const currentQty = cartItem ? cartItem.quantity : 0;
    const newQty = currentQty + delta;

    try {
      setUpdatingId(menuItemId);
      if (newQty <= 0) {
        if (cartItem) {
          await api.delete(`/api/cart/remove/${cartItem.cart_item_id}`);
        }
      } else if (!cartItem) {
        await api.post("/api/cart/add", { menu_item_id: menuItemId, quantity: newQty });
        showToast("Item added to cart.", "success");
      } else {
        await api.put(`/api/cart/update/${cartItem.cart_item_id}`, { quantity: newQty });
      }
      mutateCart();
      globalMutate("/api/cart");
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to update cart", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <div className="mb-10 border-b border-white/5 pb-8">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-3">Trending Dishes</h1>
        <p className="text-gray-400 text-lg">Top ordered dishes right now across Foodiq.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-[360px] bg-[#111] rounded-2xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : dishes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No trending dishes available yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dishes.map((dish) => {
            const qty = getQuantity(dish.id);
            const isUpdating = updatingId === dish.id;

            return (
              <div
                key={dish.id}
                className="bg-[#111] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors group"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={dish.image || FOOD_FALLBACK}
                    alt={dish.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-sm font-semibold text-white">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                    {dish.rating}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{dish.name}</h3>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-1">by {dish.restaurant}</p>
                  {dish.description && (
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2">{dish.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-white">₹{dish.price}</span>

                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(dish.id, 1)}
                        disabled={isUpdating}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2.5 rounded-full transition-colors disabled:opacity-50"
                        aria-label={`Add ${dish.name} to cart`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-primary/10 rounded-full px-1 py-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(dish.id, -1)}
                          disabled={isUpdating}
                          className="p-1.5 text-primary hover:text-white hover:bg-primary rounded-full transition-colors disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-white font-bold text-sm min-w-[20px] text-center">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(dish.id, 1)}
                          disabled={isUpdating}
                          className="p-1.5 text-primary hover:text-white hover:bg-primary rounded-full transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
