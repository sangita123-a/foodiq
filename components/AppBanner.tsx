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
    <section className="mx-auto my-3 max-w-7xl px-3 py-2 sm:my-4 sm:px-4 md:my-12 md:px-8 md:py-16">
      <div className="relative overflow-hidden rounded-xl border border-border bg-[linear-gradient(120deg,#F8F9FA_0%,#FFFFFF_68%)] shadow-[0_18px_55px_rgba(28,28,28,0.08)] sm:rounded-2xl md:rounded-[20px]">
        {/* Background decorative blob */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-section opacity-80 blur-3xl"></div>
        </div>

        {/* ── Mobile layout (below md): vertical stack ── */}
        <div className="relative z-10 flex flex-col items-center md:hidden">
          {/* Text + buttons */}
          <div className="w-full px-5 pb-4 pt-6 text-center sm:px-8 sm:pb-5 sm:pt-7">
            <h2 className="mb-2 text-[28px] font-extrabold leading-tight tracking-[-0.04em] text-foreground sm:mb-3 sm:text-[32px]">
              Get the Foodiq App
            </h2>
            <p className="mx-auto mb-4 max-w-xs text-[15px] leading-snug text-muted sm:mb-5 sm:text-[16px]">
              Order faster, track deliveries, and get exclusive app-only offers.
            </p>

            {/* Buttons: side-by-side on ≥380px, stacked below */}
            <div className="flex flex-col items-center gap-3 [&>*]:w-full xs:flex-row xs:justify-center xs:[&>*]:w-auto min-[380px]:flex-row min-[380px]:justify-center min-[380px]:[&>*]:w-auto">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-border bg-white px-5 py-0 text-foreground shadow-card transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Apple className="h-5 w-5 shrink-0" aria-hidden="true" />
                <div className="flex flex-col justify-center text-left">
                  <span className="text-[9px] font-medium leading-none">Download on the</span>
                  <span className="text-[13px] font-bold leading-none">App Store</span>
                </div>
              </a>

              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-border bg-white px-5 py-0 text-foreground shadow-card transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Play className="h-5 w-5 shrink-0" fill="#111827" stroke="#111827" aria-hidden="true" />
                <div className="flex flex-col justify-center text-left">
                  <span className="text-[9px] leading-none text-gray-text">GET IT ON</span>
                  <span className="text-[13px] font-bold leading-none">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          {/* Phone mockup — mobile */}
          <div className="flex w-full justify-center pb-0 pt-5 sm:pt-6">
            <div className="group relative flex h-[168px] w-[140px] translate-y-2 flex-col items-center overflow-hidden rounded-t-[2rem] border-x-[6px] border-t-[6px] border-border bg-white shadow-2xl sm:h-[190px] sm:w-[158px]">
              <div className="absolute top-0 z-20 h-4 w-24 rounded-b-lg bg-[#E5E7EB]"></div>
              <div className="relative h-full w-full">
                <SafeImage
                  src="/images/catalog/food/burger.webp"
                  fallback={FOOD_FALLBACK}
                  alt="Foodiq mobile app preview showing food delivery"
                  fill
                  sizes="(max-width: 768px) 160px, 256px"
                  className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#111827]/75 via-[#111827]/40 to-transparent p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                    <span className="text-sm font-bold text-white">Fq</span>
                  </div>
                  <h3 className="mb-0.5 text-sm font-bold leading-tight text-white">Your favorite food,</h3>
                  <h3 className="text-sm font-bold leading-tight text-primary">delivered fast.</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop layout (md and above): unchanged ── */}
        <div className="relative z-10 hidden md:flex md:flex-row md:items-center">
          <div className="w-full flex-1 p-16 text-left">
            <h2 className="mb-6 text-5xl font-extrabold leading-tight tracking-[-0.045em] text-foreground">
              Get the Foodiq App
            </h2>
            <p className="mx-0 mb-10 max-w-xl text-lg leading-snug text-muted">
              Order faster, track deliveries, and get exclusive app-only offers.
            </p>

            <div className="flex flex-wrap justify-start gap-4">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border bg-white px-6 py-3.5 text-foreground shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Apple className="h-8 w-8" aria-hidden="true" />
                <div className="flex flex-col justify-center text-left">
                  <span className="mb-1 text-[10px] font-medium leading-none">Download on the</span>
                  <span className="text-lg font-bold leading-none">App Store</span>
                </div>
              </a>

              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border bg-white px-6 py-3.5 text-foreground shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Play className="h-7 w-7" fill="#111827" stroke="#111827" aria-hidden="true" />
                <div className="flex flex-col justify-center text-left">
                  <span className="mb-1 text-[10px] leading-none text-gray-text">GET IT ON</span>
                  <span className="text-lg font-bold leading-none">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          {/* Phone mockup — desktop */}
          <div className="flex w-full flex-1 items-end justify-center px-10 pt-16">
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
