"use client";

import { motion } from "framer-motion";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { CONTACT_HERO_IMAGE } from "@/lib/data/sectionImages";
import { HERO_BACKGROUND_SIZES } from "@/lib/performance/assets";

export default function ContactHero() {
  const { settings } = useSiteSettings();
  const company = settings.company_name || settings.app_name || "Foodiq";

  return (
    <div className="relative flex h-[22vh] min-h-[140px] items-center justify-center overflow-hidden max-md:h-[22vh] max-md:min-h-[140px] md:h-[50vh] md:min-h-[400px]">
      <div className="absolute inset-0 z-0">
        <SafeImage
          src={CONTACT_HERO_IMAGE}
          fallback={RESTAURANT_FALLBACK}
          decorative
          fill
          sizes={HERO_BACKGROUND_SIZES}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white" />
      </div>

      <div className="container relative z-10 mx-auto mt-2 px-3 text-center max-md:mt-2 max-md:px-3 md:mt-10 md:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-1 text-lg font-black text-foreground max-md:mb-1 max-md:text-lg md:mb-6 md:text-5xl lg:text-7xl"
        >
          Contact <span className="text-primary">{company}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto max-w-3xl text-[11px] leading-snug text-gray-text max-md:line-clamp-2 max-md:text-[11px] md:text-lg lg:text-xl"
        >
          We&apos;re here to help. Reach out anytime for support, feedback, partnerships, or business inquiries.
        </motion.p>
      </div>
    </div>
  );
}
