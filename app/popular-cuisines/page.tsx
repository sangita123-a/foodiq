import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import AllCuisinesExplorer from "@/components/cuisines/AllCuisinesExplorer";

export default function PopularCuisinesPage() {
  return (
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(226, 55, 68,0.09),transparent_28%),#FFFFFF] pt-[90px] selection:bg-[var(--color-primary)] selection:text-white">
      <Navbar />
      <FloatingCart />
      <header className="mx-auto w-[calc(100%_-_32px)] max-w-[1600px] pb-8 pt-12 md:w-[calc(100%_-_48px)] md:pb-10 md:pt-16">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#E23744]">
            Find your next favorite
          </p>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
            All Cuisines
          </h1>
          <p className="mt-3 text-base leading-7 text-[#6B7280] md:text-lg">
            Explore every cuisine available near you, compare local restaurant
            choices and jump straight to the dishes you love.
          </p>
        </div>
      </header>
      <AllCuisinesExplorer />
      <Footer />
    </main>
  );
}
