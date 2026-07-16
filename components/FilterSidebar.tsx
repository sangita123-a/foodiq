"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCuisines = searchParams.get("category")?.split(",") || [];
  const currentRating = searchParams.get("rating") || "";
  const currentTime = searchParams.get("delivery_time") || "";
  const currentPrice = searchParams.get("price_range") || "";

  const updateFilter = (key: string, value: string, toggle: boolean = false) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (toggle) {
      if (params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    } else {
      if (params.get(key) === value) {
         params.delete(key);
      } else {
         params.set(key, value);
      }
    }
    router.push(`/restaurants?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.push("/restaurants", { scroll: false });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full md:w-[280px] shrink-0 bg-[#121212] border border-[var(--color-border)] rounded-2xl p-6 h-fit sticky top-[110px]"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-white">Filters</h3>
        <button onClick={clearFilters} className="text-[var(--color-primary)] text-sm font-medium hover:underline">Clear all</button>
      </div>

      {/* Cuisine Filter */}
      <div className="mb-8">
        <h4 className="text-white font-semibold mb-4 text-lg">Cuisine</h4>
        <div className="flex flex-col gap-3">
          {["Indian", "Italian", "Chinese", "Fast Food", "Dessert"].map((cuisine) => {
            const isChecked = currentCuisines.includes(cuisine);
            return (
              <label key={cuisine} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); updateFilter("category", cuisine, true); }}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-white/30 group-hover:border-[var(--color-primary)]'}`}>
                  {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={`transition-colors ${isChecked ? 'text-white' : 'text-[var(--color-gray-text)] group-hover:text-white'}`}>{cuisine}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-white/10 mb-8"></div>

      {/* Rating Filter */}
      <div className="mb-8">
        <h4 className="text-white font-semibold mb-4 text-lg">Rating</h4>
        <div className="flex flex-col gap-3">
          {["4.5", "4.0", "3.5"].map((rating) => {
             const isSelected = currentRating === rating;
             return (
              <label key={rating} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); updateFilter("rating", rating); }}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--color-primary)]' : 'border-white/30'}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>}
                </div>
                <span className={`transition-colors ${isSelected ? 'text-white' : 'text-[var(--color-gray-text)] group-hover:text-white'}`}>⭐ {rating}+</span>
              </label>
             );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-white/10 mb-8"></div>

      {/* Delivery Time */}
      <div className="mb-8">
        <h4 className="text-white font-semibold mb-4 text-lg">Delivery Time</h4>
        <div className="flex flex-col gap-3">
          {[
            { label: "Under 30 min", value: "30" }, 
            { label: "Under 45 min", value: "45" }
          ].map((time) => {
             const isSelected = currentTime === time.value;
             return (
              <label key={time.value} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); updateFilter("delivery_time", time.value); }}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--color-primary)]' : 'border-white/30'}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>}
                </div>
                <span className={`transition-colors ${isSelected ? 'text-white' : 'text-[var(--color-gray-text)] group-hover:text-white'}`}>{time.label}</span>
              </label>
             );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-white/10 mb-8"></div>

      {/* Price Filter */}
      <div>
        <h4 className="text-white font-semibold mb-4 text-lg">Price</h4>
        <div className="flex items-center gap-2">
          {["₹", "₹₹", "₹₹₹"].map((price, idx) => {
            const val = (idx + 1).toString();
            const isSelected = currentPrice === val;
            return (
              <button 
                key={price} 
                onClick={() => updateFilter("price_range", val)}
                className={`flex-1 py-2 rounded-lg border transition-colors ${isSelected ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-white/20 text-[var(--color-gray-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
              >
                {price}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
