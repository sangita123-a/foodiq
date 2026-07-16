"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import Cookies from "js-cookie";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/ui/SafeImage";
import OfferFoodCard from "@/components/offers/OfferFoodCard";
import OfferNotFound from "@/components/offers/OfferNotFound";
import { Tag, Calendar, Store, ArrowLeft, ShoppingCart } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { setActiveOffer } from "@/lib/offers";
import { OFFER_FALLBACK } from "@/lib/images";

type Props = {
  offerId: string;
};

export default function OfferDetailView({ offerId }: Props) {
  const { showToast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get("token"));
  }, []);

  const { data: offer, isLoading: loadingOffer, error: offerError } = useSWR(
    offerId ? `/api/offers/${offerId}` : null
  );
  const { data: items, isLoading: loadingItems } = useSWR(
    offerId ? `/api/offers/${offerId}/items` : null
  );
  const { data: cartData, mutate: mutateCart } = useSWR(isLoggedIn ? "/api/cart" : null);

  const cartItems = cartData?.items || [];

  useEffect(() => {
    if (offer?.coupon_code) {
      setActiveOffer({
        slug: offerId,
        couponCode: offer.coupon_code,
        title: offer.title,
      });
    }
  }, [offer, offerId]);

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

  if (loadingOffer) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
          <div className="h-64 bg-white/5 animate-pulse rounded-3xl mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (offerError || !offer) {
    return <OfferNotFound offerId={offerId} />;
  }

  const validityText = offer.valid_until
    ? `Valid till ${new Date(offer.valid_until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    : "No expiry";

  const restaurants = offer.restaurants || [];
  const foodItems = items || [];

  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
        <Link
          href="/offers"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          All Offers
        </Link>

        <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${offer.color_gradient || "from-rose-500 to-red-600"} mb-10`}>
          <div className="absolute inset-0">
            <SafeImage
              src={offer.banner_url || OFFER_FALLBACK}
              fallback={OFFER_FALLBACK}
              alt={offer.title}
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          <div className="relative z-10 p-8 md:p-12">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3">{offer.title}</h1>
            {offer.subtitle && (
              <p className="text-white/90 text-lg md:text-xl font-medium mb-6">{offer.subtitle}</p>
            )}
            <div className="flex flex-wrap gap-4">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2">
                <Tag className="w-4 h-4 text-white mr-2" />
                <span className="text-white font-bold">{offer.coupon_code}</span>
              </div>
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                {validityText}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#171717] rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">About this offer</h2>
              <p className="text-gray-400 leading-relaxed">{offer.description}</p>
            </div>

            {offer.terms && (
              <div className="bg-[#171717] rounded-2xl p-6 border border-white/5">
                <h2 className="text-xl font-bold text-white mb-3">Terms & Conditions</h2>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{offer.terms}</p>
              </div>
            )}
          </div>

          <div className="bg-[#171717] rounded-2xl p-6 border border-white/5 h-fit">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-[var(--color-primary)]" />
              Participating Restaurants
            </h2>
            {restaurants.length === 0 ? (
              <p className="text-gray-500 text-sm">All partner restaurants</p>
            ) : (
              <ul className="space-y-3">
                {restaurants.map((r: { id: string; name: string; rating: number }) => (
                  <li key={r.id}>
                    <Link
                      href={`/restaurant/${r.id}`}
                      className="flex items-center justify-between text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      <span>{r.name}</span>
                      <span className="text-yellow-400">★ {r.rating}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {cartItems.length > 0 && (
              <Link
                href="/checkout"
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#FF2D3B] hover:bg-[#e02633] text-white py-3 rounded-xl font-bold transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Proceed to Checkout
              </Link>
            )}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Foods under this offer</h2>
          <p className="text-gray-400 mb-8">Add items to your cart — your offer coupon applies automatically at checkout.</p>

          {loadingItems ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-white/5 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : foodItems.length === 0 ? (
            <div className="text-center py-16 bg-[#171717] rounded-2xl border border-white/10">
              <p className="text-gray-400">No items available for this offer right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {foodItems.map((item: any) => (
                <OfferFoodCard
                  key={item.menu_item_id}
                  item={item}
                  quantity={getQuantity(item.menu_item_id)}
                  isUpdating={updatingId === item.menu_item_id}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
