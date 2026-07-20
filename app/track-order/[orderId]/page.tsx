"use client";

import { use } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackOrderView from "@/components/tracking/TrackOrderView";

export default function TrackOrderByIdPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <TrackOrderView orderId={orderId} />
      <Footer />
    </main>
  );
}
