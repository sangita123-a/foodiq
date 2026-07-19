"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/contexts/ToastContext";
import {
  mockCompleteRazorpay,
  retryOrderPayment,
  verifyRazorpayPayment,
} from "@/services/paymentApi";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { RefreshCw } from "lucide-react";

export default function PaymentRetryClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 0);
  const method = params.get("method") || "razorpay";

  if (!orderId || !amount) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] pt-[90px] flex flex-col items-center justify-center gap-4">
        <Navbar />
        <p className="text-[#6B7280]">Missing order details.</p>
        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="bg-[#E23744] text-white font-bold px-5 py-2 rounded-xl"
        >
          Go to Checkout
        </button>
      </main>
    );
  }

  const handleRetry = async () => {
    if (!orderId || !amount) return;
    setLoading(true);
    try {
      const rz = await retryOrderPayment(orderId, amount, method);
      if (rz.mock) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("Online payments are temporarily unavailable. Please try again later.");
        }
        const verified = await mockCompleteRazorpay(rz.razorpay_order_id);
        showToast("Payment successful", "success");
        router.push(`/order-success?orderId=${verified.order_id || orderId}&eta=30`);
        return;
      }
      await openRazorpayCheckout({
        key: rz.key_id,
        amountPaise: rz.amount_paise,
        currency: rz.currency,
        orderId: rz.razorpay_order_id,
        description: "Retry Foodiq payment",
        preferredMethod: rz.prefill_method,
        onSuccess: async (response) => {
          const verified = await verifyRazorpayPayment(response);
          showToast("Payment successful", "success");
          router.push(`/order-success?orderId=${verified.order_id || orderId}&eta=30`);
        },
        onDismiss: () => {
          setLoading(false);
          showToast("Payment cancelled", "error");
        },
        onError: (msg) => {
          setLoading(false);
          showToast(msg, "error");
        },
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || "Retry failed", "error");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pt-[90px]">
      <Navbar />
      <div className="container mx-auto px-4 max-w-lg py-16">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 text-center">
          <h1 className="text-3xl font-black text-[#111827] mb-3">Retry Payment</h1>
          <p className="text-[#6B7280] mb-2">
            Complete payment for order #{orderId.slice(0, 8)}
          </p>
          <p className="text-2xl font-black text-[#E23744] mb-8">
            ₹{amount.toLocaleString("en-IN")}
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-[#E23744] hover:bg-[#C81E34] text-white font-bold px-6 py-3 rounded-xl disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Processing..." : "Pay with Razorpay"}
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
