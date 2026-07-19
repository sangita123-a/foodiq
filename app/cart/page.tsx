"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartItemCard, { CartItemType } from "@/components/cart/CartItemCard";
import OrderSummary from "@/components/cart/OrderSummary";
import EmptyCart from "@/components/cart/EmptyCart";
import SuggestedItems from "@/components/cart/SuggestedItems";
import useSWR, { mutate as globalMutate } from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { Trash2 } from "lucide-react";
import { getFoodImage } from "@/lib/images";
import { useAuthToken } from "@/hooks/useAuthToken";

export default function CartPage() {
  const authenticated = useAuthToken();
  const { data, mutate, isLoading, error } = useSWR(authenticated ? '/api/cart' : null);
  const cartObj = (data as any)?.data || data;
  const cartItems = cartObj?.items || [];
  const totals = cartObj?.totals || { subtotal: 0, deliveryCharge: 0, tax: 0, discount: 0, grandTotal: 0 };
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();

  const handleUpdateQuantity = async (id: string, delta: number) => {
    const item = cartItems.find((i: any) => i.cart_item_id === id || i.id === id);
    if (!item || isUpdating) return;
    const currentQty = item.quantity;
    const newQty = currentQty + delta;
    
    if (newQty < 1) {
      await handleRemoveItem(id);
      return;
    }

    try {
      setIsUpdating(true);
      await api.put(`/api/cart/update/${id}`, { quantity: newQty });
      mutate();
      globalMutate("/api/cart");
      void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
        trackEvent(delta > 0 ? AnalyticsEvents.addToCart : AnalyticsEvents.removeFromCart, {
          item_id: item.menu_item_id || id,
          quantity: Math.abs(delta),
        });
      });
    } catch (error) {
      console.error("Failed to update cart", error);
      showToast("Failed to update quantity", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      setIsUpdating(true);
      const item = cartItems.find((i: any) => i.cart_item_id === id || i.id === id);
      await api.delete(`/api/cart/remove/${id}`);
      mutate();
      globalMutate("/api/cart");
      showToast("Item removed from cart", "success");
      void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
        trackEvent(AnalyticsEvents.removeFromCart, {
          item_id: item?.menu_item_id || id,
          quantity: item?.quantity || 1,
        });
      });
    } catch (error) {
      console.error("Failed to remove item", error);
      showToast("Failed to remove item", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCart = async () => {
    try {
      setIsUpdating(true);
      await api.delete('/api/cart/clear');
      mutate();
      globalMutate("/api/cart");
      showToast("Cart cleared", "success");
    } catch (error) {
      console.error("Failed to clear cart", error);
      showToast("Failed to clear cart", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const mappedCartItems = cartItems.map((item: any) => ({
    id: item.cart_item_id,
    name: item.name,
    restaurant: item.restaurant_name || "Foodiq Kitchen",
    image: getFoodImage(item.image_url),
    price: item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price),
    quantity: item.quantity,
    isVeg: item.is_vegetarian || false,
  }));

  if (authenticated && isLoading) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="mb-10 border-b border-[#E5E7EB] pb-8">
            <div className="w-64 h-12 bg-[#F8FAFC] animate-pulse rounded-lg mb-3"></div>
            <div className="w-96 h-6 bg-[#F8FAFC] animate-pulse rounded-lg"></div>
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-[65%] xl:w-[70%] flex flex-col gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-[#F8FAFC] animate-pulse rounded-2xl border border-[#E5E7EB]"></div>
              ))}
            </div>
            <div className="w-full lg:w-[35%] xl:w-[30%]">
              <div className="h-80 bg-[#F8FAFC] animate-pulse rounded-2xl border border-[#E5E7EB]"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (authenticated && error) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-white text-xl">Failed to load cart</div>
        <button onClick={() => mutate()} className="px-6 py-2 bg-primary text-white rounded-lg">Retry</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12">
        
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-[#E5E7EB] pb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#111827] mb-3">
              🛒 Your Cart
            </h1>
            <p className="text-[#6B7280] text-lg">
              Review your selected items before checkout.
            </p>
          </div>
          {mappedCartItems.length > 0 && (
            <button 
              type="button"
              onClick={handleClearCart}
              disabled={isUpdating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] hover:border-[#E5E7EB] transition-all font-medium disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          )}
        </div>

        {mappedCartItems.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Column: Cart Items (70%) */}
            <div className="w-full lg:w-[65%] xl:w-[70%]">
              <div className="flex flex-col gap-6">
                {mappedCartItems.map((item: any) => (
                  <CartItemCard 
                    key={item.id} 
                    item={item} 
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
              
              <SuggestedItems />
            </div>

            {/* Right Column: Order Summary (30%) */}
            <div className="w-full lg:w-[35%] xl:w-[30%]">
              <OrderSummary subtotal={totals.subtotal} taxes={totals.tax} delivery={totals.deliveryCharge} />
            </div>
            
          </div>
        ) : (
          <EmptyCart />
        )}

      </div>

      <Footer />
    </main>
  );
}
