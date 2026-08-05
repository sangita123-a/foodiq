"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
};

/**
 * Debounced search input shared across admin list pages (orders,
 * restaurants, customers, support...). Consolidates what used to be
 * byte-identical OrderSearchBar / RestaurantSearchBar components.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  debounceMs = 400,
  className = "",
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className={`relative flex-1 min-w-[220px] ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        type="search"
        className="w-full bg-white border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-[#9CA3AF] hover:bg-section hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
