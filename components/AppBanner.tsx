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
    <section className="py-12 px-3 md:px-8 max-w-7xl mx-auto my-8 md:my-12 md:py-16">
      <div className="bg-[linear-gradient(120deg,#F8F9FA_0%,#FFFFFF_68%)] border border-border rounded-[20px] overflow-hidden relative shadow-[0_18px_55px_rgba(28,28,28,0.08)]">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-section rounded-full blur-3xl opacity-80"></div>
        </div>

        <div className="flex flex-col md:flex-row items-center relative z-10">
          <div className="p-6 sm:p-10 md:p-16 flex-1 text-center md:text-left w-full">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.045em] text-foreground mb-4 md:mb-6 leading-tight">
              Get the Foodiq App
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-10 max-w-xl mx-auto md:mx-0">
              Order your favorite meals even faster, track deliveries in real-time, and get exclusive app-only offers. Download now!
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white text-foreground border border-border px-6 py-3.5 rounded-xl shadow-card hover:border-border hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Apple className="w-8 h-8" aria-hidden="true" />
                <div className="text-left flex flex-col justify-center">
                  <span className="text-[10px] leading-none mb-1 font-medium">Download on the</span>
                  <span className="text-lg leading-none font-bold">App Store</span>
                </div>
              </a>

              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white text-foreground border border-border px-6 py-3.5 rounded-xl shadow-card hover:border-border hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Play className="w-7 h-7" fill="#111827" stroke="#111827" aria-hidden="true" />
                <div className="text-left flex flex-col justify-center">
                  <span className="text-[10px] leading-none mb-1 text-gray-text">GET IT ON</span>
                  <span className="text-lg leading-none font-bold">Google Play</span>
                </div>
              </a>
            </div>
          </div>
          
          <div className="flex-1 w-full flex justify-center items-end pt-10 md:pt-16 px-10">
            {/* Phone Mockup - purely CSS/div based representation since we might not have a phone image */}
            <div className="relative w-64 h-80 bg-white rounded-t-[2.5rem] border-t-[8px] border-x-[8px] border-border flex flex-col items-center overflow-hidden shadow-2xl translate-y-2 group">
              {/* Notch */}
              <div className="w-32 h-6 bg-[#E5E7EB] absolute top-0 rounded-b-xl z-20"></div>
              
              <div className="relative w-full h-full">
                <SafeImage
                  src="/images/catalog/food/burger.webp"
                  fallback={FOOD_FALLBACK}
                  alt="Foodiq mobile app preview showing food delivery"
                  fill
                  sizes={APP_PREVIEW_IMAGE_SIZES}
                  className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75 via-[#111827]/30/40 to-transparent flex flex-col justify-end p-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                    <span className="text-white font-bold text-xl">Fq</span>
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight mb-1">Your favorite food,</h3>
                  <h3 className="text-white font-bold text-lg leading-tight text-primary">delivered fast.</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
