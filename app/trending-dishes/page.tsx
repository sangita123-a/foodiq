import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrendingDishesPage from "@/components/TrendingDishesPage";
import FloatingCart from "@/components/FloatingCart";

export default function TrendingDishesRoute() {
  return (
    <main className="min-h-screen bg-white relative selection:bg-primary/15 selection:text-foreground pt-[90px]">
      <Navbar />
      <FloatingCart />
      <TrendingDishesPage />
      <Footer />
    </main>
  );
}
