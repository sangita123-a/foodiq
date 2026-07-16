"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import Cookies from "js-cookie";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/ui/SafeImage";
import CuisineFoodCard from "@/components/cuisines/CuisineFoodCard";
import CuisineNotFound from "@/components/cuisines/CuisineNotFound";
import { Search, ArrowLeft, UtensilsCrossed, ShoppingCart } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { RESTAURANT_FALLBACK } from "@/lib/images";

type Props = {
  slug: string;
};

export default function CuisineDetailView({ slug }: Props) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get("token"));
  }, []);

  const { data: cuisine, isLoading: loadingCuisine, error: cuisineError } = useSWR(
    slug ? `/api/cuisines/${slug}` : null
  );
  const { data: items, isLoading: loadingItems } = useSWR(
    slug ? `/api/cuisines/${slug}/items` : null
  );
  const { data: cartData, mutate: mutateCart } = useSWR(isLoggedIn ? "/api/cart" : null);
  const { data: favoritesData, mutate: mutateFavorites } = useSWR(isLoggedIn ? "/api/favorites" : null);

  const cartItems = cartData?.items || [];
  const favoriteIds = new Set(
    (favoritesData?.items || [])
      .map((f: any) => f.menu_item_id || f.id)
      .filter(Boolean)
  );

  const getQuantity = (menuItemId: string) => {
    const cartItem = cartItems.find((i: { menu_item_id: string }) => i.menu_item_id === menuItemId);
    return cartItem?.quantity || 0;
  };

  const handleToggleFavorite = async (menuItemId: string) => {
    if (!Cookies.get("token")) {
      showToast("Please login to save favorites", "error");
      return;
    }
    try {
      if (favoriteIds.has(menuItemId)) {
        await api.delete(`/api/favorites/${menuItemId}`);
        showToast("Removed from favorites", "success");
      } else {
        await api.post(`/api/favorites/${menuItemId}`);
        showToast("Added to favorites", "success");
      }
      mutateFavorites();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to update favorites", "error");
    }
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

  const filteredItems = useMemo(() => {
    const list = items || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item: { name: string; description?: string; restaurant_name: string }) =>
        item.name.toLowerCase().includes(q) ||
        item.restaurant_name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  if (loadingCuisine) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
          <div className="h-64 bg-white/5 animate-pulse rounded-3xl mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (cuisineError || !cuisine) {
    return <CuisineNotFound slug={slug} />;
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="relative rounded-3xl overflow-hidden mb-10 border border-white/10">
          <div className="absolute inset-0">
            <SafeImage
              src={cuisine.image_url}
              fallback={RESTAURANT_FALLBACK}
              alt={cuisine.name}
              className="w-full h-full object-cover opacity-40"
            />
          </div>
          <div className="relative z-10 bg-gradient-to-r from-black/80 via-black/60 to-transparent p-8 md:p-12">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3">{cuisine.name}</h1>
            <p className="text-gray-300 text-lg max-w-2xl mb-4">{cuisine.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-white">
                <UtensilsCrossed className="w-4 h-4 text-[var(--color-primary)]" />
                {cuisine.restaurant_count} Restaurants
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-white">
                {cuisine.item_count} Dishes
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={`Search in ${cuisine.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171717] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>

        {cartItems.length > 0 && (
          <div className="mb-8 flex justify-end">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 bg-[#FF2D3B] hover:bg-[#e02633] text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Proceed to Checkout
            </Link>
          </div>
        )}

        {loadingItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-[#171717] rounded-2xl border border-white/10">
            <p className="text-gray-400">
              {searchQuery ? `No dishes found for "${searchQuery}" in ${cuisine.name}.` : "No dishes available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item: any) => (
              <CuisineFoodCard
                key={item.menu_item_id}
                item={item}
                quantity={getQuantity(item.menu_item_id)}
                isUpdating={updatingId === item.menu_item_id}
                isFavorite={favoriteIds.has(item.menu_item_id)}
                onUpdateQuantity={handleUpdateQuantity}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
