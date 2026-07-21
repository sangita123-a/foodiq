"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { getBrandFoodImage, getBrandLogoImage, RESTAURANT_FALLBACK } from "@/lib/images";

const brands = [
  { 
    name: "Subway", 
    foodImage: getBrandFoodImage("Subway"), 
    logo: getBrandLogoImage("Subway"),
    bgColor: "#FFFFFF"
  },
  { 
    name: "Behrouz Biryani", 
    foodImage: getBrandFoodImage("Behrouz Biryani"), 
    logo: getBrandLogoImage("Behrouz Biryani"),
    bgColor: "#FFFFFF"
  },
  { 
    name: "Biryani By Kilo", 
    foodImage: getBrandFoodImage("Biryani By Kilo"), 
    logo: getBrandLogoImage("Biryani By Kilo"),
    bgColor: "#FFFFFF"
  },
  { 
    name: "Wow! Momo", 
    foodImage: getBrandFoodImage("Wow! Momo"), 
    logo: getBrandLogoImage("Wow! Momo"),
    bgColor: "#FFFFFF"
  },
  { 
    name: "Haldiram's", 
    foodImage: getBrandFoodImage("Haldiram's"), 
    logo: getBrandLogoImage("Haldiram's"),
    bgColor: "#FFFFFF"
  },
  { 
    name: "Barbeque Nation", 
    foodImage: getBrandFoodImage("Barbeque Nation"), 
    logo: getBrandLogoImage("Barbeque Nation"),
    bgColor: "#FFFFFF"
  },
  { 
    name: "Faasos", 
    foodImage: getBrandFoodImage("Faasos"), 
    logo: getBrandLogoImage("Faasos"),
    bgColor: "#FFFFFF"
  },
  { 
    name: "Domino's Pizza", 
    foodImage: getBrandFoodImage("Domino's Pizza"), 
    logo: getBrandLogoImage("Domino's Pizza"),
    bgColor: "#FFFFFF"
  },
];

export default function TopBrands() {
  return (
    <section className="py-20 bg-[#FAFAFA] overflow-hidden relative border-y border-[#EAEAEA] mt-8">
      <div className="mb-14 px-4 md:px-8 max-w-7xl mx-auto flex items-end justify-between">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#1C1C1C] mb-3 tracking-[-0.045em]">Top Food Brands</h2>
          <p className="text-[#686B78] text-base md:text-lg">Order from India's Most Loved Restaurants</p>
        </div>
        <div className="hidden md:flex gap-3" aria-hidden="true">
          <button type="button" tabIndex={-1} className="w-12 h-12 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:bg-white hover:text-[#111827] transition-all">
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </button>
          <button type="button" tabIndex={-1} className="w-12 h-12 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:bg-white hover:text-[#111827] transition-all">
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative w-full pause-marquee">
        {/* Left and Right Fade Masks for premium look */}
        <div className="absolute top-0 left-0 w-12 md:w-40 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-12 md:w-40 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10 pointer-events-none"></div>

        <div className="animate-marquee gap-8 px-4 py-4">
          {/* Duplicate the array internally for infinite seamless scrolling */}
          {[...brands, ...brands].map((brand, index) => (
            <div 
              key={index} 
              className="w-[200px] md:w-[220px] bg-white rounded-[20px] flex flex-col items-center p-5 cursor-pointer border border-[#ECECEC] shadow-[0_6px_22px_rgba(28,28,28,0.05)] hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,28,28,0.1)] transition-all duration-300 ease-out flex-shrink-0 group relative overflow-hidden"
            >
              {/* Premium Circular Food Image */}
              <div className="w-36 h-36 md:w-40 md:h-40 rounded-full mb-8 relative overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.14)] border-4 border-[#F8FAFC] group-hover:border-primary/30 transition-colors duration-300">
                <SafeImage 
                  src={brand.foodImage}
                  fallback={RESTAURANT_FALLBACK}
                  alt={brand.name}
                  fill
                  sizes="160px"
                  className="object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75/40 to-transparent"></div>
              </div>
              
              {/* Brand Logo Overlapping */}
              <div className="absolute top-[135px] md:top-[150px] w-14 h-14 bg-white rounded-full flex items-center justify-center p-2 shadow-xl border-4 border-white z-10 group-hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
                <SafeImage 
                  src={brand.logo}
                  fallback={RESTAURANT_FALLBACK}
                  alt={`${brand.name} logo`}
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>

              {/* Brand Name */}
              <h3 className="text-[#1C1C1C] font-bold text-center text-lg mt-2 group-hover:text-primary transition-colors">{brand.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
