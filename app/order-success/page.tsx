"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderSuccess from "@/components/checkout/OrderSuccess";
import { clearActiveOffer } from "@/lib/offers";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const eta = searchParams.get("eta") || "30";

  useEffect(() => {
    if (orderId) {
      clearActiveOffer();
    }
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        <p className="text-xl mb-4">No order found.</p>
        <a href="/restaurants" className="text-[var(--color-primary)] hover:underline">
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
      <OrderSuccess orderId={orderId} etaMinutes={parseInt(eta, 10) || 30} asPage />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] relative pt-[90px]">
      <Navbar />
      <Suspense fallback={<div className="text-white text-center py-20">Loading...</div>}>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </main>
  );
}
