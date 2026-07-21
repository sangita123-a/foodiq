"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RestaurantCard from "@/components/RestaurantCard";
import Link from "next/link";
import { mapRestaurantCard } from "@/lib/images";

function getCollectionsApiBase(): string {
  if (typeof window === "undefined") return "";
  try {
    const envUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").trim();
    const apiOrigin = new URL(envUrl).origin;
    if (apiOrigin !== window.location.origin) return "/backend-api";
  } catch {
    return "/backend-api";
  }
  return "";
}

async function collectionsFetcher(url: string) {
  const base = getCollectionsApiBase();
  const res = await fetch(`${base}${url}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Collections fetch failed (${res.status})`);
  const body = await res.json();
  if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
    return body.data;
  }
  return body;
}

const COLLECTIONS = [
  {
    id: "top-rated",
    title: "Top Rated Restaurants",
    description: "The absolute best rated spots in the city.",
    query: "/api/restaurants?collection=top-rated&limit=12",
  },
  {
    id: "quick-bites",
    title: "Quick Bites",
    description: "Meals that arrive fast when you're hungry now.",
    query: "/api/restaurants?collection=quick-bites&limit=12",
  },
  {
    id: "biryani",
    title: "Best Biryani Near You",
    description: "Authentic, rich, and aromatic biryanis.",
    query: "/api/restaurants?collection=best-biryani&limit=12",
    fallback: "/cuisine/biryani",
  },
  {
    id: "veg",
    title: "Pure Veg Specials",
    description: "Exquisite vegetarian delicacies for everyone.",
    query: "/api/restaurants?collection=pure-veg&limit=12",
  },
  {
    id: "budget",
    title: "Budget Meals",
    description: "Delicious food that doesn't break the bank.",
    query: "/api/restaurants?collection=budget-meals&limit=12",
  },
];

function normalizeRestaurantList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
    if (Array.isArray(obj.restaurants)) return obj.restaurants as Record<string, unknown>[];
  }
  return [];
}

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
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    collectionsFetcher(query)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const rawArray = normalizeRestaurantList(data);
  const restaurants = rawArray.map((item) =>
    mapRestaurantCard(item as Parameters<typeof mapRestaurantCard>[0])
  );
  const fetchFailed = Boolean(error) && !loading && rawArray.length === 0;

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
      {loading ? (
        <div className="food-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[280px] bg-[#F8FAFC] rounded-2xl animate-pulse border border-[#E5E7EB]" />
          ))}
        </div>
      ) : fetchFailed ? (
        <div className="text-center py-12 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] text-[#6B7280]">
          Unable to load restaurants. Please check your connection and try again.
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
          {restaurants.map((restaurant, idx) => (
            <RestaurantCard key={String(restaurant.id)} {...restaurant} delay={idx * 0.05} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[#E23744]/15 selection:text-[#1C1C1C] pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-10 text-center md:text-left border-b border-[#E5E7EB] pb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">Collections</h1>
          <p className="text-[var(--color-gray-text)] text-lg">
            Curated restaurant lists to help you discover your next meal.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <Link href="/order-online" className="text-[var(--color-primary)] font-medium hover:underline">
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
