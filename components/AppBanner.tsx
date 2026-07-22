"use client";

import { Apple, Play } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { APP_PREVIEW_IMAGE_SIZES } from "@/lib/performance/assets";

const APP_STORE_URL = "https://apps.apple.com/app/foodiq/id6470000000";
const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.foodiq.app";

export default function AppBanner() {
  return (
    <section className="mx-auto my-2 max-w-7xl px-3 py-2 max-md:my-2 max-md:px-3 max-md:py-2 md:my-12 md:px-8 md:py-16">
      <div className="relative overflow-hidden rounded-lg border border-border bg-[linear-gradient(120deg,#F8F9FA_0%,#FFFFFF_68%)] shadow-[0_18px_55px_rgba(28,28,28,0.08)] max-md:rounded-lg md:rounded-[20px]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-section opacity-80 blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center md:flex-row">
          <div className="w-full flex-1 p-3 text-center max-md:p-3 sm:p-10 md:p-16 md:text-left">
            <h2 className="mb-1 text-sm font-extrabold leading-tight tracking-[-0.045em] text-foreground max-md:mb-1 max-md:text-sm md:mb-6 md:text-5xl">
              Get the Foodiq App
            </h2>
            <p className="mx-auto mb-2.5 max-w-xl text-[10px] leading-snug text-muted max-md:mb-2.5 max-md:line-clamp-1 max-md:text-[10px] md:mx-0 md:mb-10 md:line-clamp-none md:text-lg">
              Order faster, track deliveries, and get exclusive app-only offers.
            </p>

            <div className="flex flex-wrap justify-center gap-1.5 max-md:gap-1.5 md:justify-start md:gap-4">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1.5 text-foreground shadow-card transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:gap-1.5 max-md:rounded-md max-md:px-2.5 max-md:py-1.5 md:gap-3 md:rounded-xl md:px-6 md:py-3.5 md:hover:-translate-y-0.5 md:hover:border-border"
              >
                <Apple className="h-4 w-4 max-md:h-4 max-md:w-4 md:h-8 md:w-8" aria-hidden="true" />
                <div className="flex flex-col justify-center text-left">
                  <span className="mb-0 text-[7px] font-medium leading-none max-md:text-[7px] md:mb-1 md:text-[10px]">Download on the</span>
                  <span className="text-[10px] font-bold leading-none max-md:text-[10px] md:text-lg">App Store</span>
                </div>
              </a>

              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1.5 text-foreground shadow-card transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:gap-1.5 max-md:rounded-md max-md:px-2.5 max-md:py-1.5 md:gap-3 md:rounded-xl md:px-6 md:py-3.5 md:hover:-translate-y-0.5 md:hover:border-border"
              >
                <Play className="h-4 w-4 max-md:h-4 max-md:w-4 md:h-7 md:w-7" fill="#111827" stroke="#111827" aria-hidden="true" />
                <div className="flex flex-col justify-center text-left">
                  <span className="mb-0 text-[7px] leading-none text-gray-text max-md:text-[7px] md:mb-1 md:text-[10px]">GET IT ON</span>
                  <span className="text-[10px] font-bold leading-none max-md:text-[10px] md:text-lg">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          {/* Phone mockup — desktop only */}
          <div className="hidden w-full flex-1 items-end justify-center px-10 pt-16 md:flex">
            <div className="group relative flex h-80 w-64 translate-y-2 flex-col items-center overflow-hidden rounded-t-[2.5rem] border-x-[8px] border-t-[8px] border-border bg-white shadow-2xl">
              <div className="absolute top-0 z-20 h-6 w-32 rounded-b-xl bg-[#E5E7EB]"></div>
              <div className="relative h-full w-full">
                <SafeImage
                  src="/images/catalog/food/burger.webp"
                  fallback={FOOD_FALLBACK}
                  alt="Foodiq mobile app preview showing food delivery"
                  fill
                  sizes={APP_PREVIEW_IMAGE_SIZES}
                  className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#111827]/75 via-[#111827]/30/40 to-transparent p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                    <span className="text-xl font-bold text-white">Fq</span>
                  </div>
                  <h3 className="mb-1 text-lg font-bold leading-tight text-white">Your favorite food,</h3>
                  <h3 className="text-lg font-bold leading-tight text-primary">delivered fast.</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
