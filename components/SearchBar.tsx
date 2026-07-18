"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { fetchSearchSuggest } from "@/services/featuresApi";
import { useFeatureFlag } from "@/lib/featureFlags";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ type: string; id: string; name: string; subtitle?: string }>
  >([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const smartSearch = useFeatureFlag("smart_search", true);

  useEffect(() => {
    if (!smartSearch || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(() => {
        void fetchSearchSuggest(query.trim()).then((rows) => {
          setSuggestions(rows);
          setOpen(true);
        });
      });
    }, 220);
    return () => clearTimeout(t);
  }, [query, smartSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setOpen(false);
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/restaurants");
    }
  };

  const goSuggestion = (s: { type: string; id: string; name: string; subtitle?: string }) => {
    setOpen(false);
    if (s.type === "cuisine") {
      router.push(`/restaurants?category=${encodeURIComponent(s.subtitle || s.name)}`);
    } else if (s.type === "restaurant") {
      router.push(`/restaurants/${s.id}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(s.name)}`);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-[900px]">
      <form
        onSubmit={handleSearch}
        className="w-full h-[60px] sm:h-[66px] bg-white/95 backdrop-blur-md border border-[#ECECEC] rounded-[18px] flex items-center shadow-[0_18px_50px_rgba(28,28,28,0.14)] overflow-hidden relative transition-shadow focus-within:border-[#FC8019]/40 focus-within:shadow-[0_20px_55px_rgba(252,128,25,0.16)]"
      >
        <div className="hidden sm:flex items-center h-full px-4 border-r border-[#ECECEC] w-[210px] shrink-0 text-[#1C1C1C] cursor-pointer hover:bg-[#F8F9FA] rounded-l-[18px] transition-colors">
          <MapPin className="text-[var(--color-primary)] w-4 h-4 mr-2.5 shrink-0" />
          <div className="flex flex-col flex-grow truncate justify-center">
            <span className="text-[11px] text-[var(--color-gray-text)] font-medium leading-tight">
              Location
            </span>
            <span className="font-semibold text-sm truncate leading-tight mt-0.5">
              Hyderabad
            </span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--color-gray-text)] shrink-0 ml-1"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <div className="flex min-w-0 items-center h-full flex-grow px-4 sm:px-5 text-[#1C1C1C] group">
          <Search className="text-[var(--color-gray-text)] group-focus-within:text-[var(--color-primary)] w-4 h-4 mr-3 shrink-0 transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length && setOpen(true)}
            placeholder="Search restaurants or dishes..."
            className="w-full min-w-0 h-full bg-transparent outline-none text-[#1C1C1C] placeholder:text-[#686B78] text-sm sm:text-[16px] font-medium"
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          className="h-[50px] sm:h-[56px] w-[92px] sm:w-[170px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[0_7px_18px_rgba(252,128,25,0.28)] shrink-0 mr-1"
        >
          Search
        </button>
      </form>

      {open && suggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-[#E5E7EB] rounded-2xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={`${s.type}-${s.id}`}>
              <button
                type="button"
                onClick={() => goSuggestion(s)}
                className="w-full text-left px-4 py-3 hover:bg-[#F8F9FA] flex items-center justify-between gap-3"
              >
                <span className="font-semibold text-sm text-[#111827] truncate">
                  {s.name}
                </span>
                <span className="text-[10px] font-bold uppercase text-[#9CA3AF] shrink-0">
                  {s.type.replace("_", " ")}
                  {s.subtitle ? ` · ${s.subtitle}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
