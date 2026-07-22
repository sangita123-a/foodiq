import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ClientFloatingCart from "@/components/performance/ClientFloatingCart";
import InternalSeoLinks from "@/components/seo/InternalSeoLinks";
import Footer from "@/components/Footer";
import {
  getContextualInternalLinks,
  getInternalLinksNavLabel,
} from "@/lib/seo/internal-links";
import { publicMetadata } from "@/lib/seo/pages";
import FoodiqLiveHubSection from "@/components/home/FoodiqLiveHubSection";

export const metadata: Metadata = publicMetadata("home");

function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div
      className={`mx-auto my-8 max-w-7xl animate-pulse rounded-2xl bg-section ${height}`}
      aria-hidden
    />
  );
}

const FoodCategoryNav = dynamic(() => import("@/components/home/FoodCategoryNav"), {
  loading: () => <SectionSkeleton height="h-48" />,
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
const PopularCuisines = dynamic(() => import("@/components/PopularCuisines"), {
  loading: () => <SectionSkeleton height="h-48" />,
});
const FeaturedCollections = dynamic(() => import("@/components/FeaturedCollections"), {
  loading: () => <SectionSkeleton />,
});
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

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-white text-foreground relative selection:bg-primary/15 selection:text-foreground"
    >
      <InternalSeoLinks
        links={getContextualInternalLinks("home")}
        label={getInternalLinksNavLabel("home")}
      />
      <Navbar />
      <Hero />
      <ClientFloatingCart />

      <div className="relative z-10 bg-white pt-4 sm:pt-6 cvw-defer-section overflow-x-hidden max-md:overflow-x-hidden">
        <FoodiqLiveHubSection />
        <FoodCategoryNav />
        <TrendingDishes />
        <BestOffers />
        <TopBrands />
        <FeaturedRestaurant />
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
