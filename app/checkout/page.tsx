"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeliveryAddressSection from "@/components/checkout/DeliveryAddressSection";
import DeliveryTimeSection, { DeliveryMode } from "@/components/checkout/DeliveryTimeSection";
import PromoCodeSection from "@/components/checkout/PromoCodeSection";
import DeliveryInstructionsSection from "@/components/checkout/DeliveryInstructionsSection";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { buildPlaceOrderPayload, saveCheckoutDraft } from "@/lib/checkout";
import { getActiveOffer } from "@/lib/offers";

export default function CheckoutPage() {
  const router = useRouter();
  const [activeAddress, setActiveAddress] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("Now");
  const [selectedDate, setSelectedDate] = useState("Today");
  const [selectedTime, setSelectedTime] = useState("12:00 PM - 12:30 PM");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [activeOfferCoupon, setActiveOfferCoupon] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const { data: cartData, isLoading: isLoadingCart, error: cartError } = useSWR("/api/cart");
  const { data: addressData, isLoading: isLoadingAddr, error: addrError } = useSWR("/api/addresses");

  const cartItems = cartData?.items || [];
  const totals = cartData?.totals || {
    subtotal: 0,
    deliveryCharge: 0,
    tax: 0,
    discount: 0,
    grandTotal: 0,
  };
  const addresses = addressData || [];

  useEffect(() => {
    const active = getActiveOffer();
    if (active?.couponCode) {
      setActiveOfferCoupon(active.couponCode);
    }
  }, []);

  useEffect(() => {
    if (addresses.length > 0 && !activeAddress) {
      const defaultAddr = addresses.find((a: { is_default: boolean }) => a.is_default) || addresses[0];
      setActiveAddress(defaultAddr.id);
    }
  }, [addresses, activeAddress]);

  const handleProceedToPayment = async () => {
    if (!activeAddress) {
      showToast("Please select a delivery address", "error");
      return;
    }
    if (cartItems.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderRes = await api.post(
        "/api/orders/place",
        buildPlaceOrderPayload({
          addressId: activeAddress,
          couponCode,
          instructions,
        })
      );

      const orderId = orderRes.data.data.order_id;
      const summary = orderRes.data.data.summary;
      const selectedAddr = addresses.find((a: { id: string }) => a.id === activeAddress);

      saveCheckoutDraft({
        addressId: activeAddress,
        couponCode,
        discountEstimate: summary.discount ?? discount,
        instructions,
        deliveryMode,
        selectedDate,
        selectedTime,
        contactPhone: selectedAddr?.phone_number,
        orderId,
        orderSummary: summary,
        cartItems: cartItems.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price),
        })),
        restaurantName: cartItems[0]?.restaurant_name || "Your Order",
      });

      router.push("/payment");
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to create order. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mappedCartItems = cartItems.map((item: any) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price),
  }));

  if (isLoadingCart || isLoadingAddr) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] relative pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="w-64 h-12 bg-white/5 animate-pulse rounded-lg mb-10" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-[60%] xl:w-[65%] flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl" />
              ))}
            </div>
            <div className="w-full lg:w-[40%] xl:w-[35%]">
              <div className="h-96 bg-white/5 animate-pulse rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (cartError || addrError) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-white text-xl">Failed to load checkout details</div>
      </main>
    );
  }

  const mappedAddresses = addresses.map((addr: any) => ({
    id: addr.id,
    type: addr.address_type,
    address: [addr.house_no, addr.street].filter(Boolean).join(", "),
    details: `${addr.city}, ${addr.state} ${addr.zip_code}`,
  }));

  const restaurantName = cartItems[0]?.restaurant_name || "Your Order";

  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-10 text-center md:text-left border-b border-white/5 pb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">
            Secure Checkout
          </h1>
          <p className="text-[#A1A1A1] text-lg">Complete your order details below.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[60%] xl:w-[65%]">
            <DeliveryAddressSection
              addresses={mappedAddresses}
              selectedId={activeAddress}
              onSelect={setActiveAddress}
            />

            <DeliveryTimeSection
              mode={deliveryMode}
              onModeChange={setDeliveryMode}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedTime={selectedTime}
              onTimeChange={setSelectedTime}
            />

            <PromoCodeSection
              appliedDiscount={discount}
              autoApplyCode={activeOfferCoupon}
              onApply={(amount, code) => {
                setDiscount(amount);
                setCouponCode(code);
                setFreeDelivery(code === "FREEDEL");
              }}
            />

            <DeliveryInstructionsSection instructions={instructions} onChange={setInstructions} />
          </div>

          <div className="w-full lg:w-[40%] xl:w-[35%]">
            <CheckoutSummary
              restaurantName={restaurantName}
              items={mappedCartItems}
              subtotal={totals.subtotal}
              deliveryCharge={freeDelivery ? 0 : totals.deliveryCharge}
              tax={totals.tax}
              discount={discount}
              onPlaceOrder={handleProceedToPayment}
              isSubmitting={isSubmitting}
              buttonLabel={isSubmitting ? "Processing..." : "Proceed to Payment"}
            />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
