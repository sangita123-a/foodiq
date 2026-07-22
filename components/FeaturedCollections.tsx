"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { FEATURED_COLLECTIONS } from "@/lib/data/collectionsData";

export default function FeaturedCollections() {
  return (
    <section className="w-full overflow-hidden bg-white py-5 max-md:py-5 md:py-12" id="featured-collections">
      <div className="container mx-auto max-w-[1440px] px-3 md:px-8">
        <div className="mb-3 max-md:mb-3 md:mb-8">
          <h2 className="text-base font-black tracking-tight text-foreground max-md:text-base md:text-3xl">
            ✨ Featured Collections
          </h2>
          <p className="mt-0.5 text-[11px] font-medium text-gray-text max-md:line-clamp-1 md:mt-1 md:text-base">
            Handpicked experiences curated just for you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 max-md:grid-cols-2 max-md:gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-3 md:justify-items-center">
          {FEATURED_COLLECTIONS.map((collection) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className="group/card relative block h-[92px] w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-white shadow-card transition-all duration-300 max-md:h-[92px] md:aspect-auto md:h-[200px] md:w-[280px] md:rounded-2xl md:justify-self-center md:hover:-translate-y-1.5 md:hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
            >
              <SafeImage
                src={collection.coverImage}
                fallback={RESTAURANT_FALLBACK}
                decorative
                fill
                sizes="280px"
                className="block object-cover object-center transition-transform duration-500 ease-out group-hover/card:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/50 to-black/15 transition-all duration-300 group-hover/card:from-black/92 group-hover/card:via-black/60" />

              <div className="absolute inset-0 z-10 flex flex-col justify-end p-2.5 max-md:p-2.5 md:p-4">
                <span className="mb-0.5 text-sm leading-none max-md:hidden md:mb-1 md:inline md:text-lg">{collection.emoji}</span>
                <span className="mb-0.5 w-fit rounded-full border border-white/20 bg-black/35 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm md:mb-1.5 md:px-2.5 md:text-[10px]">
                  {collection.itemCount}
                </span>
                <h3 className="line-clamp-1 text-xs font-black leading-tight text-white md:text-lg">
                  {collection.title}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[9px] font-medium text-white/80 max-md:hidden md:mt-1 md:line-clamp-2 md:inline md:text-xs">
                  {collection.description}
                </p>
                <span className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-bold text-white max-md:hidden md:mt-2.5 md:gap-1 md:text-xs md:group-hover/card:gap-2 md:group-hover/card:text-primary">
                  Explore
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/card:translate-x-1 md:h-3.5 md:w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
