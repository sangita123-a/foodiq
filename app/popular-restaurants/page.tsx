import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BestFoodOptions from "@/components/BestFoodOptions";
import FloatingCart from "@/components/FloatingCart";

export default function PopularRestaurantsPage() {
  return (
    <main className="min-h-screen bg-white relative selection:bg-[#E23744]/20 selection:text-[#1A1A1A] pt-[90px]">
      <Navbar />
      <FloatingCart />
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="mb-4 border-b border-[#ECECEC] pb-6">
          <h1 className="text-3xl md:text-5xl font-black text-[#1A1A1A] mb-3">Best Food Options</h1>
          <p className="text-[#666666] text-lg font-medium">
            Explore delicious food categories and top-rated dishes near you.
          </p>
        </div>
      </div>
      <BestFoodOptions />
      <Footer />
    </main>
  );
}
