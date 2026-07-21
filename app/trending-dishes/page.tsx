import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrendingDishesPage from "@/components/TrendingDishesPage";
import FloatingCart from "@/components/FloatingCart";

export default function TrendingDishesRoute() {
  return (
    <main className="min-h-screen bg-white relative selection:bg-[#E23744]/15 selection:text-[#1C1C1C] pt-[90px]">
      <Navbar />
      <FloatingCart />
      <TrendingDishesPage />
      <Footer />
    </main>
  );
}
