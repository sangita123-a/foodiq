"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CollectionsPageCard from "@/components/collections/CollectionsPageCard";
import Link from "next/link";
import { COLLECTIONS_PAGE_SECTIONS } from "@/lib/data/collectionsPageData";

function CollectionSection({
  title,
  description,
  fallback,
  restaurants,
}: {
  title: string;
  description: string;
  fallback?: string;
  restaurants: (typeof COLLECTIONS_PAGE_SECTIONS)[number]["restaurants"];
}) {
  return (
    <section className="mb-12 md:mb-14">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-gray-text">{description}</p>
        </div>
        {fallback ? (
          <Link href={fallback} className="text-sm font-medium text-primary hover:underline">
            Explore cuisine →
          </Link>
        ) : null}
      </div>

      <div className="collections-page-grid">
        {restaurants.map((restaurant, idx) => (
          <CollectionsPageCard
            key={`${title}-${restaurant.name}`}
            restaurant={restaurant}
            index={idx}
          />
        ))}
      </div>
    </section>
  );
}

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-background selection:bg-primary/10 selection:text-foreground pt-[90px]">
      <Navbar />

      <div className="container mx-auto max-w-[1280px] px-4 py-10 md:px-8 md:py-12">
        <header className="mb-10 border-b border-border pb-7 md:mb-12">
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Collections
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-text md:text-lg">
            Curated restaurant lists to help you discover your next meal.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/order-online" className="font-medium text-foreground hover:text-primary">
              Browse all restaurants →
            </Link>
            <Link href="/popular-cuisines" className="font-medium text-foreground hover:text-primary">
              Popular cuisines →
            </Link>
            <Link href="/trending-dishes" className="font-medium text-foreground hover:text-primary">
              Trending dishes →
            </Link>
          </div>
        </header>

        {COLLECTIONS_PAGE_SECTIONS.map((section) => (
          <CollectionSection
            key={section.id}
            title={section.title}
            description={section.description}
            fallback={section.fallback}
            restaurants={section.restaurants}
          />
        ))}
      </div>

      <Footer />
    </main>
  );
}
