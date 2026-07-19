import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/ui/SafeImage";
import LiveCricketView from "@/components/cricket/LiveCricketView";

export const metadata: Metadata = {
  title: "Live Cricket Stadium Experience - FoodIQ",
  description: "Watch India vs Australia ICC match live with real-time score updates and order match day food combos delivered in 30 mins.",
};

export default function LiveCricketPage() {
  return (
    <main className="min-h-screen bg-[#F8F8F8] text-[#1A1A1A]">
      <Navbar />
      <LiveCricketView />
      <Footer />
    </main>
  );
}
