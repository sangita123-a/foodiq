"use client";

import { motion } from "framer-motion";
import { Star, Clock, Utensils, IndianRupee, MapPin, CheckCircle2 } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { getPriceForTwo, getRestaurantImage, RESTAURANT_FALLBACK } from "@/lib/images";

export default function FeaturedRestaurant() {
  const { data, isLoading } = useSWR('/api/restaurants?rating=4.5&limit=1');
  const restaurant = data?.[0];

  if (isLoading) {
    return (
      <section className="bg-[#F8F9FA] w-full py-[100px] overflow-hidden">
        <div className="w-[90%] max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 xl:gap-16 items-center">
            <div className="w-full lg:w-[55%] aspect-[4/3] bg-[#ECECEC] animate-pulse rounded-[20px]"></div>
            <div className="w-full lg:w-[45%] flex flex-col gap-4">
              <div className="w-32 h-6 bg-[#E5E7EB] animate-pulse rounded-full"></div>
              <div className="w-3/4 h-12 bg-[#E5E7EB] animate-pulse rounded"></div>
              <div className="w-full h-8 bg-[#E5E7EB] animate-pulse rounded mt-4"></div>
              <div className="w-full h-24 bg-[#E5E7EB] animate-pulse rounded mt-4"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!restaurant) return null;

  return (
    <section className="bg-[#F8F9FA] w-full py-[100px] overflow-hidden border-y border-[#ECECEC]">
      <div className="w-[90%] max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 xl:gap-16 items-center">
          
          {/* Left Side - Image (55%) */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-[55%] relative group rounded-[20px] overflow-hidden border border-[#ECECEC] shadow-[0_20px_50px_rgba(28,28,28,0.12)]"
          >
            <div className="aspect-[4/3] w-full relative">
              <SafeImage
                src={getRestaurantImage(restaurant.image_url)}
                fallback={RESTAURANT_FALLBACK}
                alt={restaurant.name}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
              />
              {/* Dark overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75/80 via-[#111827]/30/20 to-transparent pointer-events-none"></div>
            </div>
          </motion.div>

          {/* Right Side - Content (45%) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full lg:w-[45%] flex flex-col"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider mb-6 w-fit">
              <Star className="w-3.5 h-3.5 fill-yellow-500" />
              FEATURED THIS WEEK
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-6 tracking-[-0.045em] leading-tight">
              {restaurant.name}
            </h2>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3 text-sm font-medium text-[#686B78] mb-8">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>{restaurant.rating} Rating</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                <Clock className="w-4 h-4 text-primary" />
                <span>30 min Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                <Utensils className="w-4 h-4 text-[#6B7280]" />
                <span className="line-clamp-1 max-w-[120px]">{restaurant.description || "Multi Cuisine"}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                <IndianRupee className="w-4 h-4 text-green-400" />
                <span>{getPriceForTwo(restaurant.price_range).replace("₹", "")}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="line-clamp-1 max-w-[100px]">{restaurant.address || "Hyderabad"}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-[#686B78] text-base md:text-lg leading-relaxed mb-10">
              {restaurant.description || "Experience authentic Dum Biryani prepared with premium ingredients, rich spices, and traditional cooking methods. Loved by thousands of food enthusiasts across the city."}
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Link href={`/restaurant/${restaurant.id}`} className="bg-[#FC8019] hover:bg-[var(--color-primary-hover)] text-white px-8 py-3.5 rounded-xl font-semibold shadow-[0_8px_20px_rgba(252,128,25,0.22)] transition-all duration-300 hover:shadow-[0_12px_26px_rgba(252,128,25,0.3)] hover:-translate-y-1">
                Explore Menu
              </Link>
              <Link href={`/restaurant/${restaurant.id}`} className="bg-white border border-[#FC8019] text-[#FC8019] hover:bg-[#FC8019] hover:text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1">
                View Restaurant
              </Link>
            </div>

            {/* Extra Info */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-[#6B7280]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Pure Hygiene</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>1000+ Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Open Now</span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
