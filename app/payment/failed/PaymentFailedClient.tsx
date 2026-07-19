"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, RefreshCw, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics/events";

export default function PaymentFailedPage() {
  const router = useRouter();
  const params = useSearchParams();
  const reason = params.get("reason") || "Payment could not be completed";
  const orderRef = params.get("order");

  useEffect(() => {
    trackEvent(AnalyticsEvents.paymentFailed, {
      reason: reason.slice(0, 100),
      has_order_ref: Boolean(orderRef),
    });
  }, [reason, orderRef]);

  const friendly = useMemo(() => {
    if (reason === "cancelled") {
      return "You closed the payment window before completing payment. Your cart is still available.";
    }
    if (reason === "verification_failed") {
      return "We could not verify the payment signature on the server. No order was created and you were not charged.";
    }
    return reason;
  }, [reason]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pt-[90px]">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-16 max-w-xl">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 md:p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-[#111827] mb-3">Payment Failed</h1>
          <p className="text-[#6B7280] mb-2 leading-relaxed">{friendly}</p>
          {orderRef && (
            <p className="text-xs text-[#9CA3AF] mb-8 font-mono break-all">Ref: {orderRef}</p>
          )}
          {!orderRef && <div className="mb-8" />}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="inline-flex items-center justify-center gap-2 bg-[#E23744] hover:bg-[#C81E34] text-white font-bold px-6 py-3 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Payment
            </button>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 border border-[#E5E7EB] text-[#111827] font-bold px-6 py-3 rounded-xl hover:bg-[#F8FAFC]"
            >
              <ShoppingBag className="w-4 h-4" />
              Back to Cart
            </Link>
          </div>

          <p className="mt-8 text-xs text-[#9CA3AF]">
            {process.env.NODE_ENV !== "production"
              ? "Tip: In Razorpay Test Mode use card 4111 1111 1111 1111 or UPI success@razorpay"
              : "If you were charged, the amount is typically reversed within a few business days. Contact support if you need help."}
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
