"use client";

import { motion } from "framer-motion";
import { ChevronRight, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";

export default function PopularCuisines() {
  const { data } = useSWR("/api/cuisines");
  const cuisines = data || [];

  return (
    <section className="bg-black w-full py-[100px] overflow-hidden border-t border-white/5">
      <div className="w-[90%] max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 text-center md:text-left"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="text-3xl md:text-4xl">🍽️</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                Popular Cuisines Around You
              </h2>
            </div>
            <Link
              href="/popular-cuisines"
              className="hidden sm:inline-flex px-5 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              View All
            </Link>
          </div>
          <p className="text-gray-400 text-lg md:text-xl font-light">
            Discover delicious cuisines loved by food lovers near your location.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {cuisines.map((cuisine: any, index: number) => {
            const href = cuisine.slug ? `/cuisine/${cuisine.slug}` : null;
            const restaurantCount = cuisine.restaurant_count ?? 0;

            const card = (
              <motion.div
                key={cuisine.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
                className="bg-[#171717] rounded-[22px] overflow-hidden flex flex-col border border-white/5 shadow-lg hover:shadow-[0_15px_30px_rgba(255,45,59,0.15)] hover:-translate-y-2 transition-all duration-300 group h-full"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <SafeImage
                    src={cuisine.image_url}
                    fallback={RESTAURANT_FALLBACK}
                    alt={cuisine.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-transparent"></div>

                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 border border-white/10">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
                    {restaurantCount > 0 ? `${restaurantCount}` : "150+"} Locations
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                    {cuisine.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 flex-1 leading-relaxed">
                    {cuisine.description || "Discover delicious food from this category."}
                  </p>

                  <span className="w-full bg-white/5 border border-white/10 group-hover:bg-[#FF2D3B] group-hover:border-[#FF2D3B] text-white py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                    Explore {cuisine.name}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover/btn:text-white transition-colors group-hover/btn:translate-x-1 duration-300" />
                  </span>
                </div>
              </motion.div>
            );

            return href ? (
              <Link key={cuisine.id} href={href} className="block h-full">
                {card}
              </Link>
            ) : (
              <div key={cuisine.id}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
