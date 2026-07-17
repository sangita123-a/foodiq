import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PopularRestaurants from "@/components/PopularRestaurants";
import FloatingCart from "@/components/FloatingCart";

export default function PopularRestaurantsPage() {
  return (
    <main className="min-h-screen bg-white relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <FloatingCart />
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-4 border-b border-[#E5E7EB] pb-8">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3">Popular Restaurants</h1>
          <p className="text-[#6B7280] text-lg">
            Handpicked restaurants with the best ratings and fastest delivery near you.
          </p>
        </div>
      </div>
      <PopularRestaurants />
      <Footer />
    </main>
  );
}
