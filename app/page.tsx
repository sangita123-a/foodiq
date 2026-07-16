import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ScrollButton from "@/components/ScrollButton";
import FloatingCart from "@/components/FloatingCart";
import PopularRestaurants from "@/components/PopularRestaurants";
import TrendingDishes from "@/components/TrendingDishes";
import BestOffers from "@/components/BestOffers";
import TopBrands from "@/components/TopBrands";
import FeaturedRestaurant from "@/components/FeaturedRestaurant";
import LiveDeals from "@/components/LiveDeals";
import PopularCuisines from "@/components/PopularCuisines";
import FeaturedCollections from "@/components/FeaturedCollections";
import LovedByFoodLovers from "@/components/LovedByFoodLovers";
import Features from "@/components/Features";
import Reviews from "@/components/Reviews";
import AppBanner from "@/components/AppBanner";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black relative selection:bg-[var(--color-primary)] selection:text-white">
      <Navbar />
      <Hero />
      <ScrollButton />
      <FloatingCart />
      
      <div className="relative z-10 bg-black pt-8">
        <PopularRestaurants />
        <TrendingDishes />
        <BestOffers />
        <TopBrands />
        <FeaturedRestaurant />
        <LiveDeals />
        <PopularCuisines />
        <FeaturedCollections />
        <LovedByFoodLovers />
        <Features />
        <Reviews />
        <AppBanner />
        <FAQ />
      </div>
      
      <Footer />
    </main>
  );
}
