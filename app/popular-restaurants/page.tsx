import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import FoodCategoryNav from "@/components/home/FoodCategoryNav";

export default function PopularRestaurantsPage() {
  return (
    <main className="relative min-h-screen bg-white pt-[90px] selection:bg-[#E23744]/20 selection:text-[#1A1A1A]">
      <Navbar />
      <FloatingCart />
      <FoodCategoryNav />
      <Footer />
    </main>
  );
}
