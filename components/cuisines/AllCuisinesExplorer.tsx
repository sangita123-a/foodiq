"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import useSWR from "swr";
import CuisineCard, { CuisineCardData } from "@/components/cuisines/CuisineCard";
import { FOOD_FALLBACK } from "@/lib/images";

const PAGE_SIZE = 12;

const groups = [
  { label: "All", slugs: [] },
  { label: "Indian", slugs: ["indian", "north-indian", "south-indian", "biryani", "street-food"] },
  { label: "Global", slugs: ["chinese", "italian", "mexican", "seafood"] },
  { label: "Quick Bites", slugs: ["pizza", "burger", "fast-food", "bakery"] },
  { label: "Sweet & Drinks", slugs: ["desserts", "beverages", "healthy"] },
] as const;

export default function AllCuisinesExplorer() {
  const { data, isLoading } = useSWR<CuisineCardData[]>("/api/cuisines");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [sort, setSort] = useState("recommended");
  const [page, setPage] = useState(1);

  const filteredCuisines = useMemo(() => {
    const activeGroup = groups.find((item) => item.label === group);
    const normalizedQuery = query.trim().toLowerCase();
    const list = (data ?? []).filter((cuisine) => {
      const matchesGroup =
        !activeGroup?.slugs.length ||
        (activeGroup.slugs as readonly string[]).includes(cuisine.slug);
      const matchesQuery =
        !normalizedQuery ||
        cuisine.name.toLowerCase().includes(normalizedQuery) ||
        (cuisine.description || "").toLowerCase().includes(normalizedQuery);
      return matchesGroup && matchesQuery;
    });

    return [...list].sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "restaurants") {
        return (b.restaurant_count ?? 0) - (a.restaurant_count ?? 0);
      }
      return 0;
    });
  }, [data, group, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredCuisines.length / PAGE_SIZE));
  const visibleCuisines = filteredCuisines.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <section className="pb-16 md:pb-24">
      <div className="mx-auto w-[calc(100%_-_32px)] max-w-[1600px] md:w-[calc(100%_-_48px)]">
        <div className="sticky top-[78px] z-20 mb-9 rounded-2xl border border-white/[0.08] bg-[#111112]/90 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search cuisines</span>
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search cuisines..."
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-black/30 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#FC8019]/70"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {groups.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setGroup(item.label);
                    setPage(1);
                  }}
                  className={`h-10 shrink-0 rounded-xl border px-3.5 text-xs font-semibold transition-colors duration-300 ${
                    group === item.label
                      ? "border-[#FC8019] bg-[#FC8019] text-white"
                      : "border-[#E5E7EB] bg-white/[0.04] text-[#6B7280] hover:border-[#E5E7EB] hover:bg-white/[0.08]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="relative shrink-0">
              <span className="sr-only">Sort cuisines</span>
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-black/30 pl-10 pr-8 text-sm text-gray-200 outline-none transition-colors focus:border-[#FC8019]/70 lg:w-48"
              >
                <option value="recommended">Recommended</option>
                <option value="restaurants">Most restaurants</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm text-[#6B7280]">
            {isLoading
              ? "Loading cuisines..."
              : `${filteredCuisines.length} cuisine${filteredCuisines.length === 1 ? "" : "s"} found`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 justify-center gap-3 sm:gap-4 md:grid-cols-[repeat(4,minmax(0,190px))] lg:grid-cols-[repeat(5,minmax(0,190px))] 2xl:grid-cols-[repeat(6,minmax(0,190px))]">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div
                key={index}
                className="h-[232px] animate-pulse rounded-[18px] border border-white/[0.06] bg-white/[0.04]"
              />
            ))}
          </div>
        ) : visibleCuisines.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-16 text-center">
            <h2 className="text-xl font-bold text-[#111827]">No cuisines found</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Try another search or choose a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 justify-center gap-3 sm:gap-4 md:grid-cols-[repeat(4,minmax(0,190px))] lg:grid-cols-[repeat(5,minmax(0,190px))] 2xl:grid-cols-[repeat(6,minmax(0,190px))]">
            {visibleCuisines.map((cuisine, index) => (
              <CuisineCard
                key={cuisine.id ?? cuisine.slug}
                cuisine={cuisine}
                fallbackImage={FOOD_FALLBACK}
                index={index}
              />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-2"
            aria-label="Cuisine pagination"
          >
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white/[0.04] px-3 text-sm text-[#6B7280] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="px-3 text-sm text-[#6B7280]">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page === pageCount}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white/[0.04] px-3 text-sm text-[#6B7280] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
