"use client";

import Link from "next/link";
import useSWR from "swr";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import { getFoodImage, FOOD_FALLBACK } from "@/lib/images";
import { useAuthToken } from "@/hooks/useAuthToken";
import { fetchWishlist, removeFromWishlist } from "@/services/featuresApi";
import { useToast } from "@/contexts/ToastContext";

export default function WishlistPanel() {
  const authenticated = useAuthToken();
  const { showToast } = useToast();
  const { data, mutate, isLoading } = useSWR(authenticated ? "wishlist" : null, fetchWishlist);
  const items = (data || []) as Array<Record<string, unknown>>;

  const remove = async (id: string) => {
    try {
      await removeFromWishlist(id);
      mutate();
      showToast("Removed from wishlist", "success");
    } catch {
      showToast("Could not remove item", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border border-border bg-white p-6 shadow-sm md:p-8"
    >
      <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold text-foreground">
        <Heart className="h-6 w-6 text-primary" /> Wishlist
      </h2>
      <p className="mb-8 text-sm text-[#555555]">Dishes you saved for later.</p>

      {!authenticated ? (
        <p className="text-[#555555]">
          <Link href="/login" className="font-bold text-primary">
            Sign in
          </Link>{" "}
          to view your wishlist.
        </p>
      ) : isLoading ? (
        <p className="text-[#555555]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[#555555]">
          Your wishlist is empty.{" "}
          <Link href="/order-online" className="font-bold text-primary">
            Order online
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={String(item.menu_item_id || item.id)}
              className="flex gap-4 rounded-2xl border border-border p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <SafeImage
                  src={getFoodImage(String(item.image_url || ""))}
                  fallback={FOOD_FALLBACK}
                  alt={String(item.name || "Dish")}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/food/${item.menu_item_id || item.id}`}
                  className="line-clamp-1 font-bold text-foreground hover:text-primary"
                >
                  {String(item.name || "Dish")}
                </Link>
                <p className="text-xs text-[#555555]">{String(item.restaurant_name || "")}</p>
                <p className="mt-1 font-black text-primary">₹{String(item.price || "—")}</p>
                <button
                  type="button"
                  onClick={() => remove(String(item.menu_item_id || item.id))}
                  className="mt-2 text-xs font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
