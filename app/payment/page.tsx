"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentMethodsSection, { PaymentMethod } from "@/components/checkout/PaymentMethodsSection";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { clearCheckoutDraft, getCheckoutDraft } from "@/lib/checkout";

export default function PaymentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutDraft, setCheckoutDraft] = useState<ReturnType<typeof getCheckoutDraft>>(null);

  useEffect(() => {
    const draft = getCheckoutDraft();
    if (!draft?.orderId || !draft.orderSummary) {
      router.replace("/checkout");
      return;
    }
    setCheckoutDraft(draft);
  }, [router]);

  const handlePay = async (simulateFailure = false) => {
    if (!checkoutDraft?.orderId || !checkoutDraft.orderSummary) {
      showToast("Order details missing. Please return to checkout.", "error");
      router.push("/checkout");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = checkoutDraft.orderId;
      const amount = checkoutDraft.orderSummary.grand_total;
      const etaMinutes = checkoutDraft.orderSummary.estimated_delivery_minutes || 30;

      const methodMap: Record<string, string> = {
        UPI: "upi",
        "Credit Card": "credit_card",
        "Debit Card": "debit_card",
        "Net Banking": "net_banking",
        Wallet: "wallet",
        "Cash on Delivery": "cod",
      };

      const paymentRes = await api.post("/api/payments/create", {
        order_id: orderId,
        amount,
        method: methodMap[paymentMethod] || "upi",
      });

      const paymentId = paymentRes.data.data.payment_id;

      if (simulateFailure) {
        await api.post("/api/payments/verify", {
          payment_id: paymentId,
          transaction_id: `txn_fail_${Date.now()}`,
          status: "failed",
        });
        showToast("Payment failed. Please try again or choose another method.", "error");
        return;
      }

      await api.post("/api/payments/verify", {
        payment_id: paymentId,
        transaction_id: `txn_${Date.now()}`,
        status: "completed",
      });

      clearCheckoutDraft();
      showToast("Payment successful! Your order is confirmed.", "success");
      router.push(`/order-success?orderId=${orderId}&eta=${etaMinutes}`);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Payment failed. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!checkoutDraft) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center text-white">Loading payment...</div>
      </main>
    );
  }

  const summary = checkoutDraft.orderSummary!;

  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-10 text-center md:text-left border-b border-white/5 pb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">Payment</h1>
          <p className="text-[#A1A1A1] text-lg">Choose your payment method to complete the order.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[60%] xl:w-[65%]">
            <PaymentMethodsSection selectedMethod={paymentMethod} onSelect={setPaymentMethod} />
          </div>

          <div className="w-full lg:w-[40%] xl:w-[35%]">
            <CheckoutSummary
              restaurantName={checkoutDraft.restaurantName || "Your Order"}
              items={checkoutDraft.cartItems || []}
              subtotal={summary.subtotal}
              deliveryCharge={summary.delivery_charge}
              tax={summary.tax}
              discount={summary.discount}
              onPlaceOrder={() => handlePay(false)}
              isSubmitting={isSubmitting}
              buttonLabel={isSubmitting ? "Processing..." : "Pay & Place Order"}
            />
            <button
              type="button"
              onClick={() => handlePay(true)}
              disabled={isSubmitting}
              className="w-full mt-3 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Simulate Payment Failure (Test)
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
