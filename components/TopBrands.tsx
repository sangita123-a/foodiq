"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { getBrandFoodImage, RESTAURANT_FALLBACK } from "@/lib/images";

const brands = [
  { 
    name: "Subway", 
    foodImage: getBrandFoodImage("Subway"), 
    logo: "https://logo.clearbit.com/subway.com",
    bgColor: "#171717"
  },
  { 
    name: "Behrouz Biryani", 
    foodImage: getBrandFoodImage("Behrouz Biryani"), 
    logo: "https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/g1uompslbfswsnhm8pys",
    bgColor: "#171717"
  },
  { 
    name: "Biryani By Kilo", 
    foodImage: getBrandFoodImage("Biryani By Kilo"), 
    logo: "https://logo.clearbit.com/biryanibykilo.com",
    bgColor: "#171717"
  },
  { 
    name: "Wow! Momo", 
    foodImage: getBrandFoodImage("Wow! Momo"), 
    logo: "https://logo.clearbit.com/wowmomo.com",
    bgColor: "#171717"
  },
  { 
    name: "Haldiram's", 
    foodImage: getBrandFoodImage("Haldiram's"), 
    logo: "https://logo.clearbit.com/haldirams.com",
    bgColor: "#171717"
  },
  { 
    name: "Barbeque Nation", 
    foodImage: getBrandFoodImage("Barbeque Nation"), 
    logo: "https://logo.clearbit.com/barbequenation.com",
    bgColor: "#171717"
  },
  { 
    name: "Faasos", 
    foodImage: getBrandFoodImage("Faasos"), 
    logo: "https://logo.clearbit.com/faasos.com",
    bgColor: "#171717"
  },
  { 
    name: "Domino's Pizza", 
    foodImage: getBrandFoodImage("Domino's Pizza"), 
    logo: "https://logo.clearbit.com/dominos.co.in",
    bgColor: "#171717"
  },
];

export default function TopBrands() {
  return (
    <section className="py-20 bg-[#0B0B0B] overflow-hidden relative border-y border-white/5 mt-8">
      <div className="mb-14 px-4 md:px-8 max-w-7xl mx-auto flex items-end justify-between">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">Top Food Brands</h2>
          <p className="text-gray-400 text-lg md:text-xl font-light">Order from India's Most Loved Restaurants</p>
        </div>
        <div className="hidden md:flex gap-3">
          <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="relative w-full pause-marquee">
        {/* Left and Right Fade Masks for premium look */}
        <div className="absolute top-0 left-0 w-12 md:w-40 h-full bg-gradient-to-r from-[#0B0B0B] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-12 md:w-40 h-full bg-gradient-to-l from-[#0B0B0B] to-transparent z-10 pointer-events-none"></div>

        <div className="animate-marquee gap-8 px-4 py-4">
          {/* Duplicate the array internally for infinite seamless scrolling */}
          {[...brands, ...brands].map((brand, index) => (
            <div 
              key={index} 
              className="w-[200px] md:w-[220px] bg-[#171717] rounded-[22px] flex flex-col items-center p-5 cursor-pointer border border-white/5 hover:border-primary/50 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,45,59,0.3)] transition-all duration-300 ease-out flex-shrink-0 group relative overflow-hidden backdrop-blur-md"
            >
              {/* Premium Circular Food Image */}
              <div className="w-36 h-36 md:w-40 md:h-40 rounded-full mb-8 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-4 border-[#222] group-hover:border-primary/30 transition-colors duration-300">
                <SafeImage 
                  src={brand.foodImage}
                  fallback={RESTAURANT_FALLBACK}
                  alt={brand.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              
              {/* Brand Logo Overlapping */}
              <div className="absolute top-[135px] md:top-[150px] w-14 h-14 bg-white rounded-full flex items-center justify-center p-2 shadow-xl border-4 border-[#171717] z-10 group-hover:-translate-y-1 transition-transform duration-300">
                <img 
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200";
                  }}
                />
              </div>

              {/* Brand Name */}
              <h3 className="text-white font-bold text-center text-lg mt-2 group-hover:text-primary transition-colors">{brand.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
