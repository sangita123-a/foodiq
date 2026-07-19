"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { FEATURED_COLLECTIONS } from "@/lib/data/collectionsData";

const CARD_WIDTH = 280;
const CARD_HEIGHT = 200;

export default function FeaturedCollections() {
  return (
    <section className="w-full overflow-hidden bg-white py-10 md:py-12" id="featured-collections">
      <div className="container mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] md:text-3xl">
            ✨ Featured Collections
          </h2>
          <p className="mt-1 text-sm font-medium text-[#666666] md:text-base">
            Handpicked collections curated specially for you.
          </p>
        </div>

        <div className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_COLLECTIONS.map((collection) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className="group/card relative block shrink-0 cursor-pointer overflow-hidden rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(226,55,68,0.2)]"
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            >
              <SafeImage
                src={collection.coverImage}
                fallback={RESTAURANT_FALLBACK}
                decorative
                fill
                sizes="280px"
                className="block object-cover object-center transition-transform duration-500 ease-out group-hover/card:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10 transition-all duration-300 group-hover/card:from-black/90 group-hover/card:via-black/55" />

              <div className="absolute inset-0 z-10 flex flex-col justify-end p-4">
                <span className="mb-1.5 w-fit rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                  {collection.itemCount}
                </span>
                <h3 className="text-base font-black leading-tight text-white md:text-lg">
                  {collection.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-[11px] font-medium text-white/75 md:text-xs">
                  {collection.description}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-white transition-all duration-300 group-hover/card:gap-2 group-hover/card:text-[#FFB4BA]">
                  Explore
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/card:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
