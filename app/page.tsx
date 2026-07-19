import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("home");

function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div
      className={`mx-auto my-8 max-w-7xl animate-pulse rounded-2xl bg-[#F8F9FA] ${height}`}
      aria-hidden
    />
  );
}

const ScrollButton = dynamic(() => import("@/components/ScrollButton"));
const FloatingCart = dynamic(() => import("@/components/FloatingCart"));
const PopularRestaurants = dynamic(() => import("@/components/PopularRestaurants"), {
  loading: () => <SectionSkeleton height="h-80" />,
});
const TrendingDishes = dynamic(() => import("@/components/TrendingDishes"), {
  loading: () => <SectionSkeleton />,
});
const BestOffers = dynamic(() => import("@/components/BestOffers"), {
  loading: () => <SectionSkeleton />,
});
const TopBrands = dynamic(() => import("@/components/TopBrands"), {
  loading: () => <SectionSkeleton height="h-40" />,
});
const FeaturedRestaurant = dynamic(() => import("@/components/FeaturedRestaurant"), {
  loading: () => <SectionSkeleton height="h-72" />,
});
const LiveDeals = dynamic(() => import("@/components/LiveDeals"), {
  loading: () => <SectionSkeleton />,
});
const PopularCuisines = dynamic(() => import("@/components/PopularCuisines"), {
  loading: () => <SectionSkeleton height="h-48" />,
});
const FeaturedCollections = dynamic(() => import("@/components/FeaturedCollections"), {
  loading: () => <SectionSkeleton />,
});
const PersonalizedHomeRails = dynamic(
  () => import("@/components/home/PersonalizedHomeRails"),
  { loading: () => <SectionSkeleton height="h-48" /> }
);
const LovedByFoodLovers = dynamic(() => import("@/components/LovedByFoodLovers"), {
  loading: () => <SectionSkeleton />,
});
const Features = dynamic(() => import("@/components/Features"), {
  loading: () => <SectionSkeleton height="h-56" />,
});
const Reviews = dynamic(() => import("@/components/Reviews"), {
  loading: () => <SectionSkeleton />,
});
const AppBanner = dynamic(() => import("@/components/AppBanner"), {
  loading: () => <SectionSkeleton height="h-48" />,
});
const FAQ = dynamic(() => import("@/components/FAQ"), {
  loading: () => <SectionSkeleton height="h-72" />,
});
const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => <SectionSkeleton height="h-40" />,
});

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#1C1C1C] relative selection:bg-[#E23744]/20 selection:text-[#1C1C1C]">
      <Navbar />
      <Hero />
      <ScrollButton />
      <FloatingCart />

      <div className="relative z-10 bg-white pt-4 sm:pt-6">
        <PersonalizedHomeRails />
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
