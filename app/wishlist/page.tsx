"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useSWR from "swr";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { fetchWishlist, removeFromWishlist } from "@/services/featuresApi";
import { getFoodImage } from "@/lib/images";
import SafeImage from "@/components/ui/SafeImage";
import { useToast } from "@/contexts/ToastContext";

export default function WishlistPage() {
  const authenticated = useAuthToken();
  const { showToast } = useToast();
  const { data, mutate, isLoading } = useSWR(
    authenticated ? "wishlist" : null,
    fetchWishlist
  );
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
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-black text-[#111827] flex items-center gap-2">
          <Heart className="w-7 h-7 text-[#FC8019]" /> Wishlist
        </h1>
        <p className="text-sm text-[#6B7280] mt-1 mb-8">
          Dishes you saved for later. Separate from favorites restaurants.
        </p>

        {!authenticated ? (
          <p className="text-[#6B7280]">
            <Link href="/login" className="text-[#FC8019] font-bold">
              Sign in
            </Link>{" "}
            to view your wishlist.
          </p>
        ) : isLoading ? (
          <p className="text-[#6B7280]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-[#6B7280]">
            Your wishlist is empty.{" "}
            <Link href="/restaurants" className="text-[#FC8019] font-bold">
              Browse restaurants
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <div
                key={String(item.wishlist_id || item.id)}
                className="border border-[#E5E7EB] rounded-2xl overflow-hidden bg-white"
              >
                <div className="relative h-40 bg-[#F8F9FA]">
                  <SafeImage
                    src={getFoodImage(String(item.image_url || ""))}
                    fallback={getFoodImage("")}
                    alt={String(item.name)}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <p className="font-bold text-[#111827]">{String(item.name)}</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {String(item.restaurant_name || "")}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-[#111827]">
                      ₹{String(item.discount_price || item.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void remove(String(item.id))}
                      className="text-xs font-bold text-[#FC8019]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
