"use client";

import Image from "next/image";
import { Apple, Play } from "lucide-react";

export default function AppBanner() {
  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto my-12">
      <div className="bg-[linear-gradient(120deg,#F8F9FA_0%,#FFFFFF_68%)] border border-[#ECECEC] rounded-[20px] overflow-hidden relative shadow-[0_18px_55px_rgba(28,28,28,0.08)]">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="flex flex-col md:flex-row items-center relative z-10">
          <div className="p-10 md:p-16 flex-1 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-[-0.045em] text-[#1C1C1C] mb-6 leading-tight">
              Get the Foodiq App
            </h2>
            <p className="text-[#686B78] text-lg leading-relaxed mb-10 max-w-xl mx-auto md:mx-0">
              Order your favorite meals even faster, track deliveries in real-time, and get exclusive app-only offers. Download now!
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              {/* App Store Button */}
              <button className="flex items-center gap-3 bg-white text-[#1C1C1C] border border-[#ECECEC] px-6 py-3.5 rounded-xl shadow-sm hover:border-[#FC8019]/30 hover:-translate-y-0.5 transition-all duration-300">
                <Apple className="w-8 h-8" />
                <div className="text-left flex flex-col justify-center">
                  <span className="text-[10px] leading-none mb-1 font-medium">Download on the</span>
                  <span className="text-lg leading-none font-bold">App Store</span>
                </div>
              </button>
              
              {/* Google Play Button */}
              <button className="flex items-center gap-3 bg-white text-[#1C1C1C] border border-[#ECECEC] px-6 py-3.5 rounded-xl shadow-sm hover:border-[#FC8019]/30 hover:-translate-y-0.5 transition-all duration-300">
                <Play className="w-7 h-7 fill-[#111827]" />
                <div className="text-left flex flex-col justify-center">
                  <span className="text-[10px] leading-none mb-1 text-[#6B7280]">GET IT ON</span>
                  <span className="text-lg leading-none font-bold">Google Play</span>
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full flex justify-center items-end pt-10 md:pt-16 px-10">
            {/* Phone Mockup - purely CSS/div based representation since we might not have a phone image */}
            <div className="relative w-64 h-80 bg-white rounded-t-[2.5rem] border-t-[8px] border-x-[8px] border-[#E5E7EB] flex flex-col items-center overflow-hidden shadow-2xl translate-y-2 group">
              {/* Notch */}
              <div className="w-32 h-6 bg-[#E5E7EB] absolute top-0 rounded-b-xl z-20"></div>
              
              <div className="w-full h-full relative">
                <Image 
                  src="/images/catalog/food/burger.webp"
                  alt="App Preview"
                  fill
                  sizes="256px"
                  className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75 via-[#111827]/30/40 to-transparent flex flex-col justify-end p-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
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
