"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { fetchSearchSuggest } from "@/services/featuresApi";
import { useFeatureFlag } from "@/lib/featureFlags";
import {
  HERO_CITIES,
  getStoredCity,
  setStoredCity,
  type HeroCity,
} from "@/lib/heroLocation";
import {
  mapApiSuggestion,
  normalizeSearchQuery,
  resolveHeroSearchTarget,
  searchHeroCatalog,
  type HeroSearchResult,
} from "@/lib/heroSearch";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<HeroCity>(() => getStoredCity());
  const [cityOpen, setCityOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<HeroSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const smartSearch = useFeatureFlag("smart_search", true);

  useEffect(() => {
    setCity(getStoredCity());
    const onCity = (event: Event) => {
      const detail = (event as CustomEvent<HeroCity>).detail;
      if (detail && HERO_CITIES.includes(detail)) setCity(detail);
    };
    window.addEventListener("foodiq:city-updated", onCity);
    return () => window.removeEventListener("foodiq:city-updated", onCity);
  }, []);

  const localResults = useMemo(() => {
    const q = normalizeSearchQuery(query);
    if (q.length < 1) return [];
    return searchHeroCatalog(query, city);
  }, [query, city]);

  useEffect(() => {
    const q = normalizeSearchQuery(query);
    if (q.length < 1) {
      setSuggestions([]);
      setNoResults(false);
      setOpen(false);
      return;
    }

    setSuggestions(localResults);
    setNoResults(localResults.length === 0);
    setOpen(true);

    if (!smartSearch || q.length < 2) return;

    const t = setTimeout(() => {
      startTransition(() => {
        void fetchSearchSuggest(query.trim(), 8).then((rows) => {
          const mapped = rows
            .map((row) => mapApiSuggestion(row, city))
            .filter((row): row is HeroSearchResult => row !== null);

          if (mapped.length > 0) {
            const merged = new Map<string, HeroSearchResult>();
            [...localResults, ...mapped].forEach((item) => {
              merged.set(`${item.type}:${item.id}`, item);
            });
            const next = Array.from(merged.values()).slice(0, 10);
            setSuggestions(next);
            setNoResults(next.length === 0);
            setOpen(true);
          }
        });
      });
    }, 180);

    return () => clearTimeout(t);
  }, [query, city, smartSearch, localResults]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setCityOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectCity = useCallback((next: HeroCity) => {
    setCity(next);
    setStoredCity(next);
    setCityOpen(false);
    if (normalizeSearchQuery(query).length > 0) {
      setOpen(true);
    }
  }, [query]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      setOpen(false);
      router.push(`/restaurants?city=${encodeURIComponent(city)}`);
      return;
    }

    const results = suggestions.length ? suggestions : searchHeroCatalog(trimmed, city);
    if (results.length === 0) {
      setNoResults(true);
      setOpen(true);
      return;
    }

    setOpen(false);
    router.push(resolveHeroSearchTarget(trimmed, city, results));
  };

  const goSuggestion = (s: HeroSearchResult) => {
    setOpen(false);
    router.push(s.href);
  };

  const showDropdown = open && normalizeSearchQuery(query).length > 0;

  return (
    <div ref={wrapRef} className="relative w-full max-w-[900px]">
      <form
        onSubmit={handleSearch}
        className="w-full h-[52px] sm:h-[60px] md:h-[66px] bg-white/95 backdrop-blur-md border border-[#ECECEC] rounded-[14px] sm:rounded-[18px] flex items-center shadow-[0_18px_50px_rgba(28,28,28,0.14)] overflow-hidden relative transition-shadow focus-within:border-[#E23744]/40 focus-within:shadow-[0_20px_55px_rgba(226,55,68,0.16)]"
      >
        <div ref={cityRef} className="relative hidden sm:block h-full shrink-0">
          <button
            type="button"
            onClick={() => setCityOpen((v) => !v)}
            className="flex items-center h-full px-4 border-r border-[#ECECEC] w-[210px] text-[#1C1C1C] cursor-pointer hover:bg-[#F8F9FA] rounded-l-[18px] transition-colors text-left"
            aria-expanded={cityOpen}
            aria-haspopup="listbox"
          >
            <MapPin className="text-[var(--color-primary)] w-4 h-4 mr-2.5 shrink-0" />
            <div className="flex flex-col flex-grow truncate justify-center min-w-0">
              <span className="text-[11px] text-[var(--color-gray-text)] font-medium leading-tight">
                Location
              </span>
              <span className="font-semibold text-sm truncate leading-tight mt-0.5">{city}</span>
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
              className={`text-[var(--color-gray-text)] shrink-0 ml-1 transition-transform ${cityOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {cityOpen ? (
            <ul
              role="listbox"
              className="absolute left-0 top-[calc(100%+6px)] z-[60] w-[210px] bg-white border border-[#E5E7EB] rounded-2xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
            >
              {HERO_CITIES.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={city === c}
                    onClick={() => selectCity(c)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-[#F8F9FA] ${
                      city === c ? "text-[var(--color-primary)] bg-[#FFF5F6]" : "text-[#111827]"
                    }`}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex min-w-0 items-center h-full flex-grow px-4 sm:px-5 text-[#1C1C1C] group">
          <Search className="text-[var(--color-gray-text)] group-focus-within:text-[var(--color-primary)] w-4 h-4 mr-3 shrink-0 transition-colors" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (normalizeSearchQuery(query).length > 0) setOpen(true);
            }}
            placeholder="Search restaurants or dishes..."
            className="w-full min-w-0 h-full bg-transparent outline-none text-[#1C1C1C] placeholder:text-[#686B78] text-sm sm:text-[16px] font-medium"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="hero-search-suggestions"
          />
        </div>

        <button
          type="submit"
          className="h-[40px] sm:h-[46px] md:h-[52px] w-[68px] sm:w-[86px] md:w-[158px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all active:translate-y-0 shadow-[0_7px_18px_rgba(226,55,68,0.28)] shrink-0 mr-1 touch-target"
        >
          <span className="hidden sm:inline">Search</span>
          <span className="sm:hidden">Go</span>
        </button>
      </form>

      {showDropdown ? (
        <ul
          id="hero-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-[#E5E7EB] rounded-2xl shadow-lg overflow-hidden max-h-72 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            suggestions.map((s) => (
              <li key={`${s.type}-${s.id}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => goSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-[#F8F9FA] flex items-center justify-between gap-3"
                >
                  <span className="font-semibold text-sm text-[#111827] truncate">{s.name}</span>
                  <span className="text-[10px] font-bold uppercase text-[#9CA3AF] shrink-0">
                    {s.type}
                    {s.subtitle ? ` · ${s.subtitle}` : ""}
                  </span>
                </button>
              </li>
            ))
          ) : noResults ? (
            <li className="px-4 py-4 text-sm font-medium text-[#6B7280] text-center">
              No matching restaurants or dishes found.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
