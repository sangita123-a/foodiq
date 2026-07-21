"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackOrderView from "@/components/tracking/TrackOrderView";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");

  if (!id) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 flex items-center justify-center min-h-[50vh]">
        <div className="text-foreground text-xl">Missing order ID.</div>
      </div>
    );
  }

  return <TrackOrderView orderId={id} />;
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <Suspense fallback={<div className="text-foreground p-10 text-center">Loading...</div>}>
        <TrackOrderContent />
      </Suspense>
      <Footer />
    </main>
  );
}
