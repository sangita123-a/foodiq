"use client";

import Link from "next/link";
import { Star, Clock } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { getRestaurantCoverImage, RESTAURANT_FALLBACK } from "@/lib/images";
import type { CollectionsPageRestaurant } from "@/lib/data/collectionsPageData";

type Props = {
  restaurant: CollectionsPageRestaurant;
  index: number;
};

export default function CollectionsPageCard({ restaurant, index }: Props) {
  const imageUrl = getRestaurantCoverImage(restaurant.id, restaurant.image);

  return (
    <article
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link href={`/restaurant/${restaurant.id}`} className="relative block h-[88px] w-full shrink-0 overflow-hidden bg-section">
        <SafeImage
          src={imageUrl}
          fallback={RESTAURANT_FALLBACK}
          alt={restaurant.name}
          fill
          sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 180px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-5">
          <span className="inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-foreground">
            {restaurant.rating}
            <Star className="h-2.5 w-2.5 fill-[var(--color-star)] text-[var(--color-star)]" />
          </span>
          <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-white">
            <Clock className="h-2.5 w-2.5" />
            {restaurant.time}
          </span>
        </div>
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-2.5">
        <Link href={`/restaurant/${restaurant.id}`} className="min-w-0">
          <h3 className="line-clamp-1 text-[13px] font-bold leading-tight text-foreground">
            {restaurant.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-text">{restaurant.cuisine}</p>
        </Link>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-primary">{restaurant.priceForTwo}</span>
          <Link
            href={`/restaurant/${restaurant.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary bg-primary px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-95"
          >
            Add
          </Link>
        </div>
      </div>
    </article>
  );
}
