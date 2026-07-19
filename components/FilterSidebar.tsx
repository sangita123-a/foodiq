"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

const FILTER_CUISINES = [
  { label: "Indian", slug: "indian" },
  { label: "Italian", slug: "italian" },
  { label: "Chinese", slug: "chinese" },
  { label: "Fast Food", slug: "fast-food" },
  { label: "Desserts", slug: "desserts" },
  { label: "Burger", slug: "burger" },
  { label: "Biryani", slug: "biryani" },
  { label: "Pizza", slug: "pizza" },
];

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCuisines = searchParams.get("category")?.split(",").filter(Boolean) || [];
  const currentRating = searchParams.get("rating") || "";
  const currentTime = searchParams.get("delivery_time") || "";
  const currentPrice = searchParams.get("price_range") || "";
  const isVeg = searchParams.get("is_veg") === "true";
  const offersOnly = searchParams.get("offers_only") === "true";
  const sort = searchParams.get("sort") || "";

  const updateFilter = (key: string, value: string, toggle: boolean = false) => {
    const params = new URLSearchParams(searchParams.toString());

    if (toggle) {
      const existing = params.get(key)?.split(",").filter(Boolean) || [];
      const next = existing.includes(value)
        ? existing.filter((entry) => entry !== value)
        : [...existing, value];
      if (next.length === 0) params.delete(key);
      else params.set(key, next.join(","));
    } else if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    params.delete("page");
    router.push(`/order-online?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.push("/order-online", { scroll: false });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full md:w-[280px] shrink-0 bg-white border border-[var(--color-border)] rounded-2xl p-6 h-fit sticky top-[110px]"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-[#111827]">Filters</h3>
        <button onClick={clearFilters} className="text-[var(--color-primary)] text-sm font-medium hover:underline">
          Clear all
        </button>
      </div>

      <div className="mb-8">
        <h4 className="text-[#111827] font-semibold mb-4 text-lg">Cuisine</h4>
        <div className="flex flex-col gap-3">
          {FILTER_CUISINES.map(({ label, slug }) => {
            const isChecked = currentCuisines.includes(slug);
            return (
              <label
                key={slug}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={(e) => {
                  e.preventDefault();
                  updateFilter("category", slug, true);
                }}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isChecked
                      ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                      : "border-[#D1D5DB] group-hover:border-[var(--color-primary)]"
                  }`}
                >
                  {isChecked && (
                    <svg className="w-3 h-3 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  className={`transition-colors ${
                    isChecked ? "text-[#111827]" : "text-[var(--color-gray-text)] group-hover:text-[#111827]"
                  }`}
                >
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-[#E5E7EB] mb-8" />

      <div className="mb-8">
        <h4 className="text-[#111827] font-semibold mb-4 text-lg">Rating</h4>
        <div className="flex flex-col gap-3">
          {["4.5", "4.0", "3.5"].map((rating) => {
            const isSelected = currentRating === rating;
            return (
              <label
                key={rating}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={(e) => {
                  e.preventDefault();
                  updateFilter("rating", rating);
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-[var(--color-primary)]" : "border-[#D1D5DB]"
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
                </div>
                <span
                  className={`transition-colors ${
                    isSelected ? "text-[#111827]" : "text-[var(--color-gray-text)] group-hover:text-[#111827]"
                  }`}
                >
                  ⭐ {rating}+
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-[#E5E7EB] mb-8" />

      <div className="mb-8">
        <h4 className="text-[#111827] font-semibold mb-4 text-lg">Delivery Time</h4>
        <div className="flex flex-col gap-3">
          {[
            { label: "Under 30 min", value: "30" },
            { label: "Under 45 min", value: "45" },
          ].map((time) => {
            const isSelected = currentTime === time.value;
            return (
              <label
                key={time.value}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={(e) => {
                  e.preventDefault();
                  updateFilter("delivery_time", time.value);
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-[var(--color-primary)]" : "border-[#D1D5DB]"
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
                </div>
                <span
                  className={`transition-colors ${
                    isSelected ? "text-[#111827]" : "text-[var(--color-gray-text)] group-hover:text-[#111827]"
                  }`}
                >
                  {time.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-[#111827] font-semibold mb-4 text-lg">More</h4>
        <div className="flex flex-col gap-3">
          <label
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(e) => {
              e.preventDefault();
              updateFilter("is_veg", "true");
            }}
          >
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                isVeg
                  ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                  : "border-[#D1D5DB]"
              }`}
            >
              {isVeg && (
                <svg className="w-3 h-3 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={isVeg ? "text-[#111827]" : "text-[var(--color-gray-text)]"}>
              Pure veg
            </span>
          </label>
          <label
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(e) => {
              e.preventDefault();
              updateFilter("offers_only", "true");
            }}
          >
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                offersOnly
                  ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                  : "border-[#D1D5DB]"
              }`}
            >
              {offersOnly && (
                <svg className="w-3 h-3 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={offersOnly ? "text-[#111827]" : "text-[var(--color-gray-text)]"}>
              Offers only
            </span>
          </label>
        </div>
      </div>

      <div className="h-px w-full bg-[#E5E7EB] mb-8" />

      <div className="mb-8">
        <h4 className="text-[#111827] font-semibold mb-4 text-lg">Sort</h4>
        <div className="flex flex-col gap-2">
          {[
            { label: "Rating", value: "rating" },
            { label: "Delivery time", value: "delivery_time" },
            { label: "Price: low to high", value: "price_low" },
            { label: "Newest", value: "newest" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateFilter("sort", opt.value)}
              className={`text-left text-sm py-1.5 ${
                sort === opt.value
                  ? "text-[var(--color-primary)] font-bold"
                  : "text-[var(--color-gray-text)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[#111827] font-semibold mb-4 text-lg">Price</h4>
        <div className="flex items-center gap-2">
          {["₹", "₹₹", "₹₹₹"].map((price, idx) => {
            const val = (idx + 1).toString();
            const isSelected = currentPrice === val;
            return (
              <button
                key={price}
                onClick={() => updateFilter("price_range", val)}
                className={`flex-1 py-2 rounded-lg border transition-colors ${
                  isSelected
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-[#E5E7EB] text-[var(--color-gray-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                }`}
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
