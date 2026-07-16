"use client";

import useSWR from "swr";
import RestaurantCard from "@/components/RestaurantCard";
import { mapRestaurantCard } from "@/lib/images";

type SimilarRestaurantsProps = {
  currentRestaurantId: string;
};

export default function SimilarRestaurants({ currentRestaurantId }: SimilarRestaurantsProps) {
  const { data, isLoading } = useSWR("/api/restaurants?limit=8&sort=popular");

  const similar = (data || [])
    .filter((r: { id: string }) => String(r.id) !== String(currentRestaurantId))
    .slice(0, 4)
    .map(mapRestaurantCard) as ReturnType<typeof mapRestaurantCard>[];

  if (!isLoading && similar.length === 0) return null;

  return (
    <section className="container mx-auto px-4 md:px-8 py-16 border-t border-white/10">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Similar Restaurants</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[280px] bg-white/5 rounded-2xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {similar.map((restaurant, idx) => (
            <RestaurantCard key={restaurant.id} {...restaurant} delay={idx * 0.05} />
          ))}
        </div>
      )}
    </section>
  );
}
