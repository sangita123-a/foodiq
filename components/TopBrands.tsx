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

function BrandCard({
  brand,
  compact = false,
}: {
  brand: (typeof brands)[number];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="mb-2 flex w-[108px] shrink-0 flex-col items-center rounded-xl border border-border bg-white p-2.5 shadow-[0_2px_10px_rgba(28,28,28,0.05)] md:mb-3 md:w-[130px] md:rounded-2xl md:p-3">
        <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-[#F8FAFC] shadow-[0_4px_14px_rgba(15,23,42,0.12)] md:mb-3 md:h-20 md:w-20 md:shadow-[0_6px_18px_rgba(15,23,42,0.12)]">
          <SafeImage 
            src={brand.foodImage}
            fallback={RESTAURANT_FALLBACK}
            alt={brand.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="relative -mt-6 mb-1.5 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white p-1 shadow-md md:-mt-7 md:mb-2 md:h-12 md:w-12 md:p-1.5">
          <SafeImage 
            src={brand.logo}
            fallback={RESTAURANT_FALLBACK}
            alt={`${brand.name} logo`}
            fill
            sizes="48px"
            className="object-contain p-0.5"
          />
        </div>
        <h3 className="line-clamp-2 text-center text-[10px] font-bold leading-tight text-foreground md:text-xs">{brand.name}</h3>
      </div>
    );
  }

  return (
    <div className="w-[200px] md:w-[220px] bg-white rounded-[20px] flex flex-col items-center p-5 cursor-pointer border border-border shadow-[0_6px_22px_rgba(28,28,28,0.05)] hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,28,28,0.1)] transition-all duration-300 ease-out flex-shrink-0 group relative overflow-hidden">
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

      <h3 className="text-foreground font-bold text-center text-lg mt-2 group-hover:text-primary transition-colors">{brand.name}</h3>
    </div>
  );
}

export default function TopBrands() {
  return (
    <section className="relative mt-4 overflow-hidden border-y border-border bg-section py-6 md:mt-8 md:py-20">
      <div className="mx-auto mb-5 flex max-w-7xl items-end justify-between px-3 md:mb-14 md:px-8">
        <div>
          <h2 className="mb-1 text-xl font-bold tracking-[-0.045em] text-foreground md:mb-3 md:text-5xl">Top Food Brands</h2>
          <p className="text-xs text-muted md:text-lg">Order from India&apos;s Most Loved Restaurants</p>
        </div>
        <div className="hidden md:flex gap-3" aria-hidden="true">
          <button type="button" tabIndex={-1} className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-gray-text hover:bg-white hover:text-foreground transition-all">
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </button>
          <button type="button" tabIndex={-1} className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-gray-text hover:bg-white hover:text-foreground transition-all">
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="scroll-row px-3 pb-1 md:hidden">
        {brands.map((brand) => (
          <BrandCard key={brand.name} brand={brand} compact />
        ))}
      </div>

      {/* Desktop/Tablet: marquee */}
      <div className="relative w-full pause-marquee hidden md:block">
        <div className="absolute top-0 left-0 w-12 md:w-40 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-12 md:w-40 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10 pointer-events-none"></div>

        <div className="animate-marquee gap-8 px-4 py-4">
          {[...brands, ...brands].map((brand, index) => (
            <BrandCard key={index} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}
