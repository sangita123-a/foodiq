"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackOrderView from "@/components/tracking/TrackOrderView";
import TrackOrderModal from "@/components/support/TrackOrderModal";
import { useRouter } from "next/navigation";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams?.get("id");

  if (!id) {
    return (
      <div className="container mx-auto flex min-h-[50vh] max-w-7xl items-start justify-center px-4 py-12 md:px-8">
        <TrackOrderModal
          open
          variant="page"
          onClose={() => router.push("/help-support")}
        />
      </div>
    );
  }

  return <TrackOrderView orderId={id} />;
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <Suspense fallback={<div className="p-10 text-center text-foreground">Loading...</div>}>
        <TrackOrderContent />
      </Suspense>
      <Footer />
    </main>
  );
}
