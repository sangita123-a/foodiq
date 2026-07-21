"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartItemCard from "@/components/cart/CartItemCard";
import OrderSummary from "@/components/cart/OrderSummary";
import EmptyCart from "@/components/cart/EmptyCart";
import SuggestedItems from "@/components/cart/SuggestedItems";
import { Trash2 } from "lucide-react";
import { getFoodImage } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { clearLocalCart } from "@/lib/cart";
import { useToast } from "@/contexts/ToastContext";

export default function CartPage() {
  const { items, subtotal, updatingId, updateQuantity } = useCartActions();
  const { showToast } = useToast();

  const handleClearCart = () => {
    clearLocalCart();
    showToast("Cart cleared", "success");
  };

  const deliveryCharge = items.length > 0 ? 35 : 0;
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + deliveryCharge + tax;

  const totals = {
    subtotal,
    deliveryCharge,
    tax,
    discount: 0,
    grandTotal,
  };

  const mappedCartItems = items.map((item) => ({
    id: item.cart_item_id,
    menu_item_id: item.menu_item_id,
    name: item.name,
    restaurant: "Foodiq Kitchen",
    image: getFoodImage(item.image),
    price: item.price,
    quantity: item.quantity,
    isVeg: item.isVeg ?? true,
  }));

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background relative selection:bg-primary/15 selection:text-foreground pt-[90px]">
        <Navbar />
        <EmptyCart />
        <SuggestedItems />
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/15 selection:text-foreground pt-[90px]">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-10 border-b border-border pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-foreground mb-3">Your Shopping Cart</h1>
            <p className="text-gray-text text-lg">
              Review your items and proceed to checkout · {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearCart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-text bg-white border border-border hover:border-border hover:text-primary font-bold text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cart</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Item List */}
          <div className="w-full lg:w-[65%] xl:w-[70%] flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {mappedCartItems.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={(id, delta) => updateQuantity(item.menu_item_id, delta)}
                  onRemove={(id) => updateQuantity(item.menu_item_id, -item.quantity)}
                  isUpdating={updatingId === item.menu_item_id}
                />
              ))}
            </div>
            <SuggestedItems />
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-[35%] xl:w-[30%]">
            <OrderSummary totals={totals} />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
