"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mutate as globalMutate } from "swr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeliveryAddressSection from "@/components/checkout/DeliveryAddressSection";
import DeliveryTimeSection, { DeliveryMode } from "@/components/checkout/DeliveryTimeSection";
import PromoCodeSection from "@/components/checkout/PromoCodeSection";
import WalletCheckoutSection from "@/components/checkout/WalletCheckoutSection";
import DeliveryInstructionsSection from "@/components/checkout/DeliveryInstructionsSection";
import PaymentMethodsSection, {
  PaymentMethod,
  mapPaymentMethodToApi,
  isOnlinePaymentMethod,
} from "@/components/checkout/PaymentMethodsSection";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import {
  buildPlaceOrderPayload,
  buildScheduledFor,
  clearCheckoutDraft,
} from "@/lib/checkout";
import { clearActiveOffer, getActiveOffer } from "@/lib/offers";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  markRazorpayFailed,
  mockCompleteRazorpay,
  placeCodOrder,
} from "@/services/paymentApi";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useCartActions } from "@/hooks/useCartActions";
import { clearLocalCart } from "@/lib/cart";

type CartItem = {
  id?: string;
  cart_item_id?: string;
  name: string;
  quantity: number;
  price: string | number;
  discount_price?: string | number | null;
  restaurant_name?: string;
};

type AddressRow = {
  id: string;
  is_default?: boolean;
  address_type?: string;
  house_no?: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone_number?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCoupon = searchParams.get("coupon");
  const [activeAddress, setActiveAddress] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("Now");
  const [selectedDate, setSelectedDate] = useState("Today");
  const [selectedTime, setSelectedTime] = useState("12:00 PM - 12:30 PM");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);
  const [activeOfferCoupon] = useState<string | null>(
    () => getActiveOffer()?.couponCode || null
  );
  const autoApplyCoupon = activeOfferCoupon || urlCoupon;
  const [instructions, setInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash on Delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"idle" | "creating" | "checkout" | "verifying">(
    "idle"
  );
  const { showToast } = useToast();
  const hasToken = useAuthToken();
  const { items: actionCartItems, subtotal: actionSubtotal } = useCartActions();

  const { data: cartData, isLoading: isLoadingCart, error: cartError, mutate: mutateCart } = useSWR(
    hasToken ? "/api/cart" : null
  );
  const { data: addressData, isLoading: isLoadingAddr, error: addrError, mutate: mutateAddresses } = useSWR(
    hasToken ? "/api/addresses" : null
  );

  const cartItems: CartItem[] = (cartData?.items?.length ? cartData.items : actionCartItems).map((i: any) => ({
    id: i.cart_item_id || i.id || i.menu_item_id,
    cart_item_id: i.cart_item_id || i.id || i.menu_item_id,
    name: i.name,
    quantity: i.quantity,
    price: i.price,
    restaurant_name: i.restaurant_name || "Foodiq Partner",
  }));

  const subtotal = cartData?.totals?.subtotal ? Number(cartData.totals.subtotal) : actionSubtotal;
  const deliveryCharge = cartItems.length > 0 ? 35 : 0;
  const tax = Math.round(subtotal * 0.05);
  const effectiveDelivery = freeDelivery ? 0 : deliveryCharge;
  const preWalletTotal = Math.max(0, subtotal + effectiveDelivery + tax - discount);
  const grandTotal = Math.max(0, preWalletTotal - walletAmount);

  const totals = {
    subtotal,
    deliveryCharge: effectiveDelivery,
    tax,
    discount,
    grandTotal,
    preWalletTotal,
    walletAmount,
  };

  const addresses: AddressRow[] = addressData || [];
  const selectedAddressId =
    activeAddress ||
    addresses.find((a) => a.is_default)?.id ||
    addresses[0]?.id ||
    "";

  const finishSuccess = async (orderId: string, etaMinutes = 30) => {
    void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
      trackEvent(AnalyticsEvents.purchase, {
        transaction_id: orderId,
        value: Number(totals.grandTotal) || 0,
        currency: "INR",
        items: cartItems.length,
        payment_method: mapPaymentMethodToApi(paymentMethod),
      });
      trackEvent(AnalyticsEvents.paymentSuccess, {
        transaction_id: orderId,
        payment_method: mapPaymentMethodToApi(paymentMethod),
      });
    });
    clearCheckoutDraft();
    clearActiveOffer();
    clearLocalCart();
    await Promise.all([mutateCart(), globalMutate("/api/cart"), globalMutate("/api/orders")]);
    showToast("Order confirmed!", "success");
    router.push(`/order-success?orderId=${orderId}&eta=${etaMinutes}`);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    if (!selectedAddressId) {
      showToast("Please select a delivery address", "error");
      return;
    }
    if (!paymentMethod) {
      showToast("Please select a payment method", "error");
      return;
    }
    if (deliveryMode === "Schedule" && (!selectedDate || !selectedTime)) {
      showToast("Please select a delivery date and time", "error");
      return;
    }

    void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
      trackEvent(AnalyticsEvents.beginCheckout, {
        value: Number(totals.grandTotal) || 0,
        currency: "INR",
        items: cartItems.length,
        payment_method: mapPaymentMethodToApi(paymentMethod),
      });
    });

    const payload = buildPlaceOrderPayload({
      addressId: selectedAddressId,
      couponCode,
      instructions,
      deliveryMode,
      scheduledFor: buildScheduledFor(deliveryMode, selectedDate, selectedTime),
      paymentMethod: mapPaymentMethodToApi(paymentMethod),
      walletAmount: walletAmount > 0 ? walletAmount : undefined,
    });

    setIsSubmitting(true);
    try {
      if (!isOnlinePaymentMethod(paymentMethod)) {
        setPaymentStep("creating");
        const data = await placeCodOrder(payload);
        await finishSuccess(data.order_id, data.summary?.estimated_delivery_minutes || 30);
        return;
      }

      setPaymentStep("creating");
      const rz = await createRazorpayOrder(payload);

      if (rz.wallet_only && rz.order_id) {
        await finishSuccess(rz.order_id, 30);
        return;
      }

      const razorpayOrderId = rz.razorpay_order_id;
      if (!razorpayOrderId) {
        throw new Error("Payment session could not be created");
      }

      if (rz.mock) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("Online payments are temporarily unavailable. Please try again later.");
        }
        setPaymentStep("verifying");
        const verified = await mockCompleteRazorpay(razorpayOrderId);
        await finishSuccess(
          verified.order_id,
          verified.summary?.estimated_delivery_minutes || 30
        );
        return;
      }

      setPaymentStep("checkout");
      await openRazorpayCheckout({
        key: rz.key_id!,
        amountPaise: rz.amount_paise!,
        currency: rz.currency!,
        orderId: razorpayOrderId,
        description: `Foodiq order · ${mapPaymentMethodToApi(paymentMethod)}`,
        prefill: rz.prefill,
        preferredMethod: rz.prefill_method,
        onSuccess: async (response) => {
          try {
            setPaymentStep("verifying");
            setIsSubmitting(true);
            const verified = await verifyRazorpayPayment(response);
            await finishSuccess(
              verified.order_id,
              verified.summary?.estimated_delivery_minutes || 30
            );
          } catch (err: unknown) {
            const message =
              err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
              trackEvent(AnalyticsEvents.paymentFailed, {
                reason: "verification_failed",
                razorpay_order_id: razorpayOrderId,
              });
            });
            showToast(message || "Payment verification failed", "error");
            router.push(
              `/payment/failed?order=${encodeURIComponent(razorpayOrderId)}&reason=${encodeURIComponent(message || "verification_failed")}`
            );
          } finally {
            setIsSubmitting(false);
            setPaymentStep("idle");
          }
        },
        onDismiss: async () => {
          void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
            trackEvent(AnalyticsEvents.paymentFailed, {
              reason: "cancelled",
              razorpay_order_id: razorpayOrderId,
            });
          });
          await markRazorpayFailed(razorpayOrderId, "Checkout dismissed");
          setIsSubmitting(false);
          setPaymentStep("idle");
          showToast("Payment cancelled. You can try again.", "error");
          router.push(
            `/payment/failed?order=${encodeURIComponent(razorpayOrderId)}&reason=cancelled`
          );
        },
        onError: async (message) => {
          void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
            trackEvent(AnalyticsEvents.paymentFailed, {
              reason: message.slice(0, 100),
              razorpay_order_id: razorpayOrderId,
            });
          });
          await markRazorpayFailed(razorpayOrderId, message);
          setIsSubmitting(false);
          setPaymentStep("idle");
          showToast(message, "error");
          router.push(
            `/payment/failed?order=${encodeURIComponent(razorpayOrderId)}&reason=${encodeURIComponent(message)}`
          );
        },
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || "Failed to place order. Please try again.", "error");
      setIsSubmitting(false);
      setPaymentStep("idle");
    } finally {
      // Keep submitting true while Razorpay modal is open (non-mock).
      if (!isOnlinePaymentMethod(paymentMethod)) {
        setIsSubmitting(false);
        setPaymentStep("idle");
      }
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await api.delete(`/api/addresses/${addressId}`);
      if (activeAddress === addressId) setActiveAddress("");
      await mutateAddresses();
      showToast("Address deleted", "success");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || "Failed to delete address", "error");
    }
  };

  const handleEditAddress = (addressId: string) => {
    router.push(`/saved-addresses?edit=${addressId}`);
  };

  const mappedCartItems = cartItems.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.discount_price
      ? parseFloat(String(item.discount_price))
      : parseFloat(String(item.price)),
  }));

  const buttonLabel = (() => {
    if (paymentStep === "creating") return "Preparing payment...";
    if (paymentStep === "checkout") return "Complete payment in Razorpay...";
    if (paymentStep === "verifying") return "Verifying payment...";
    if (isSubmitting) return "Processing...";
    if (isOnlinePaymentMethod(paymentMethod)) return "Pay Securely";
    return "Place Order";
  })();

  if (isLoadingCart || isLoadingAddr) {
    return (
      <main className="min-h-screen bg-background relative pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="w-64 h-12 bg-section animate-pulse rounded-lg mb-10" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-[60%] xl:w-[65%] flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-section animate-pulse rounded-2xl" />
              ))}
            </div>
            <div className="w-full lg:w-[40%] xl:w-[35%]">
              <div className="h-96 bg-section animate-pulse rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (cartError || addrError) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-foreground text-xl">Failed to load checkout details</div>
      </main>
    );
  }

  if (!isLoadingCart && cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-foreground text-xl">Your cart is empty</div>
        <button
          type="button"
          onClick={() => router.push("/order-online")}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Browse restaurants
        </button>
      </main>
    );
  }

  const mappedAddresses = addresses.map((addr) => ({
    id: addr.id,
    type: (addr.address_type as "Home" | "Work" | "Other") || "Home",
    address: [addr.house_no, addr.street].filter(Boolean).join(", "),
    details: `${addr.city}, ${addr.state} ${addr.zip_code}`,
  }));

  const restaurantName = cartItems[0]?.restaurant_name || "Your Order";

  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/15 selection:text-foreground pt-[72px] sm:pt-[80px] md:pt-[90px] overflow-x-hidden">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 md:px-8 py-6 sm:py-8 md:py-12 pb-28 lg:pb-12">
        <div className="mb-6 sm:mb-10 text-center md:text-left border-b border-border pb-6 sm:pb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-2 sm:mb-3">
            Secure Checkout
          </h1>
          <p className="text-gray-text text-sm sm:text-base md:text-lg">
            Complete your order details and pay securely.
          </p>
        </div>

        {(paymentStep === "verifying" || paymentStep === "creating") && (
          <div className="mb-6 rounded-xl border border-border bg-section px-4 py-3 text-sm font-bold text-foreground">
            {paymentStep === "creating"
              ? "Creating secure payment session..."
              : "Verifying payment signature on server..."}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[60%] xl:w-[65%]">
            <DeliveryAddressSection
              addresses={mappedAddresses}
              selectedId={selectedAddressId}
              onSelect={setActiveAddress}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
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
              autoApplyCode={autoApplyCoupon}
              cartTotal={totals.subtotal}
              onApply={(amount, code, freeDel) => {
                setDiscount(amount);
                setCouponCode(code);
                setFreeDelivery(Boolean(freeDel) || code === "FREEDEL");
                setWalletAmount(0);
              }}
            />

            <WalletCheckoutSection
              grandTotal={totals.preWalletTotal}
              walletAmount={walletAmount}
              onWalletChange={setWalletAmount}
            />

            <PaymentMethodsSection selectedMethod={paymentMethod} onSelect={setPaymentMethod} />

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
              onPlaceOrder={handlePlaceOrder}
              isSubmitting={isSubmitting}
              buttonLabel={buttonLabel}
              estimatedDeliveryMinutes={30}
            />
          </div>
        </div>

        {/* Mobile sticky checkout bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-md px-4 py-3 safe-bottom shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-sm font-bold text-muted">Total</span>
            <span className="text-xl font-black text-foreground">₹{totals.grandTotal}</span>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting || cartItems.length === 0}
            className="w-full touch-target min-h-[48px] rounded-xl bg-primary font-semibold text-white text-sm shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-primary-hover disabled:opacity-50"
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
