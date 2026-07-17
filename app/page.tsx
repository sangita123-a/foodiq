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
    <main className="min-h-screen bg-white text-[#1C1C1C] relative selection:bg-[#FC8019]/20 selection:text-[#1C1C1C]">
      <Navbar />
      <Hero />
      <ScrollButton />
      <FloatingCart />
      
      <div className="relative z-10 bg-white pt-4 sm:pt-6">
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
