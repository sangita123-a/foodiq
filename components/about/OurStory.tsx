"use client";

import { motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { STORY_IMAGE_SIZES } from "@/lib/performance/assets";

export default function OurStory() {
  return (
    <div className="py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left: Image */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative rounded-3xl overflow-hidden group shadow-2xl"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
              <SafeImage 
                src="/images/catalog/restaurants/indian.webp" 
                fallback={RESTAURANT_FALLBACK}
                alt="Foodiq team serving Indian cuisine"
                fill
                sizes={STORY_IMAGE_SIZES}
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            {/* Dark gradient overlay for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-transparent to-transparent opacity-80 pointer-events-none"></div>
          </motion.div>

          {/* Right: Content */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Our Story</h2>
            <div className="w-20 h-1.5 bg-primary rounded-full mb-8"></div>
            
            <p className="text-[#6B7280] text-lg leading-relaxed mb-6">
              Foodiq was built with one simple mission — to make food ordering faster, easier, and more enjoyable for everyone.
            </p>
            <p className="text-[#6B7280] leading-relaxed">
              We connect customers with their favorite restaurants through a seamless digital experience, ensuring every meal arrives fresh, fast, and completely hassle-free. What started as a small idea has grown into a vast network of passionate food lovers and dedicated culinary partners.
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
