import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PopularCuisines from "@/components/PopularCuisines";
import FloatingCart from "@/components/FloatingCart";

export default function PopularCuisinesPage() {
  return (
    <main className="min-h-screen bg-black relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <FloatingCart />
      <div className="container mx-auto px-4 md:px-8 pt-12">
        <div className="mb-4 border-b border-white/5 pb-8">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3">Popular Cuisines</h1>
          <p className="text-gray-400 text-lg">
            Explore every cuisine category and order your favorite dishes.
          </p>
        </div>
      </div>
      <PopularCuisines />
      <Footer />
    </main>
  );
}
