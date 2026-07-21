"use client";

import { motion } from "framer-motion";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { HERO_BACKGROUND_SIZES } from "@/lib/performance/assets";

export default function ContactHero() {
  const { settings } = useSiteSettings();
  const company = settings.company_name || settings.app_name || "Foodiq";

  return (
    <div className="relative flex h-[50vh] min-h-[400px] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <SafeImage
          src="/images/catalog/restaurants/indian.webp"
          fallback={RESTAURANT_FALLBACK}
          decorative
          fill
          sizes={HERO_BACKGROUND_SIZES}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white" />
      </div>

      <div className="container relative z-10 mx-auto mt-10 px-4 text-center md:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-5xl font-black text-[#1C1C1C] md:text-6xl lg:text-7xl"
        >
          Contact <span className="text-[#E23744]">{company}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto max-w-3xl text-lg leading-relaxed text-[#696969] md:text-xl"
        >
          We&apos;re here to help. Reach out anytime for support, feedback, partnerships, or business inquiries.
        </motion.p>
      </div>
    </div>
  );
}
