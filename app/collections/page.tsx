"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RestaurantCard from "@/components/RestaurantCard";
import useSWR from "swr";
import Link from "next/link";
import { mapRestaurantCard } from "@/lib/images";

const COLLECTIONS = [
  {
    id: "top-rated",
    title: "Top Rated Restaurants",
    description: "The absolute best rated spots in the city.",
    query: "/api/restaurants?sort=popular&limit=8",
  },
  {
    id: "quick-bites",
    title: "Quick Bites",
    description: "Meals that arrive fast when you're hungry now.",
    query: "/api/restaurants?limit=8",
  },
  {
    id: "biryani",
    title: "Best Biryani Near You",
    description: "Authentic, rich, and aromatic biryanis.",
    query: "/api/restaurants?cuisine=biryani&limit=8",
    fallback: "/cuisine/biryani",
  },
  {
    id: "veg",
    title: "Pure Veg Specials",
    description: "Exquisite vegetarian delicacies for everyone.",
    query: "/api/restaurants?is_veg=true&limit=8",
  },
  {
    id: "budget",
    title: "Budget Meals",
    description: "Delicious food that doesn't break the bank.",
    query: "/api/restaurants?sort=price_low&limit=8",
  },
];

function CollectionSection({
  title,
  description,
  query,
  fallback,
}: {
  title: string;
  description: string;
  query: string;
  fallback?: string;
}) {
  const { data, isLoading } = useSWR(query);
  const rawArray = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
      ? (data as any).data
      : Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray((data as any)?.restaurants)
          ? (data as any).restaurants
          : [];
  const restaurants = rawArray.map(mapRestaurantCard);

  return (
    <section className="mb-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2">{title}</h2>
          <p className="text-[var(--color-gray-text)]">{description}</p>
        </div>
        {fallback && (
          <Link href={fallback} className="text-primary text-sm font-medium hover:underline">
            Explore cuisine →
          </Link>
        )}
      </div>
      {isLoading ? (
        <div className="food-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[280px] bg-[#F8FAFC] rounded-2xl animate-pulse border border-[#E5E7EB]" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-12 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] text-[#6B7280]">
          No restaurants in this collection yet.
          {fallback && (
            <div className="mt-4">
              <Link href={fallback} className="text-primary hover:underline">
                Browse related cuisine dishes
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="food-grid">
          {restaurants.map((restaurant: any, idx: number) => (
            <RestaurantCard key={restaurant.id} {...restaurant} delay={idx * 0.05} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-10 text-center md:text-left border-b border-[#E5E7EB] pb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">Collections</h1>
          <p className="text-[var(--color-gray-text)] text-lg">
            Curated restaurant lists to help you discover your next meal.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <Link href="/restaurants" className="text-[var(--color-primary)] font-medium hover:underline">
              Browse all restaurants →
            </Link>
            <Link href="/popular-cuisines" className="text-[var(--color-primary)] font-medium hover:underline">
              Popular cuisines →
            </Link>
            <Link href="/trending-dishes" className="text-[var(--color-primary)] font-medium hover:underline">
              Trending dishes →
            </Link>
          </div>
        </div>

        {COLLECTIONS.map((c) => (
          <CollectionSection
            key={c.id}
            title={c.title}
            description={c.description}
            query={c.query}
            fallback={c.fallback}
          />
        ))}
      </div>

      <Footer />
    </main>
  );
}
