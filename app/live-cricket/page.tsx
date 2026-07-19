import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiveCricketView from "@/components/cricket/LiveCricketView";

export default function LiveCricketPage() {
  return (
    <main className="min-h-screen bg-[#F8F8F8] text-[#1A1A1A]">
      <Navbar />
      <LiveCricketView />
      <Footer />
    </main>
  );
}
