"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { fetchSearchSuggest } from "@/services/featuresApi";
import { useFeatureFlag } from "@/lib/featureFlags";
import {
  HERO_CITIES,
  getDefaultCity,
  getStoredCity,
  setStoredCity,
  type HeroCity,
} from "@/lib/heroLocation";
import {
  mapApiSuggestion,
  normalizeSearchQuery,
  preloadHeroSearchCatalog,
  resolveHeroSearchTarget,
  searchHeroCatalog,
  searchHeroCatalogAsync,
  type HeroSearchResult,
} from "@/lib/heroSearch";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<HeroCity>(getDefaultCity);
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

    return () => {
      window.removeEventListener("foodiq:city-updated", onCity);
    };
  }, []);

  useEffect(() => {
    const q = normalizeSearchQuery(query);
    if (q.length < 1) {
      setSuggestions([]);
      setNoResults(false);
      setOpen(false);
      return;
    }

    let cancelled = false;
    let apiTimer: ReturnType<typeof setTimeout> | undefined;

    const runLocalSearch = async () => {
      const syncResults = searchHeroCatalog(query, city);
      if (syncResults.length > 0) {
        if (!cancelled) {
          setSuggestions(syncResults);
          setNoResults(syncResults.length === 0);
          setOpen(true);
        }
        return syncResults;
      }

      const asyncResults = await searchHeroCatalogAsync(query, city);
      if (!cancelled) {
        setSuggestions(asyncResults);
        setNoResults(asyncResults.length === 0);
        setOpen(true);
      }
      return asyncResults;
    };

    const debounceId = setTimeout(() => {
      void runLocalSearch();

      if (smartSearch && q.length >= 2) {
        apiTimer = setTimeout(() => {
          startTransition(() => {
            void runLocalSearch().then((localResults) => {
              void fetchSearchSuggest(query.trim(), 8).then(async (rows) => {
                const mapped = (
                  await Promise.all(rows.map((row) => mapApiSuggestion(row, city)))
                ).filter((row): row is HeroSearchResult => row !== null);

                if (mapped.length > 0) {
                  const merged = new Map<string, HeroSearchResult>();
                  [...localResults, ...mapped].forEach((item) => {
                    merged.set(`${item.type}:${item.id}`, item);
                  });
                  const next = Array.from(merged.values()).slice(0, 10);
                  if (!cancelled) {
                    setSuggestions(next);
                    setNoResults(next.length === 0);
                    setOpen(true);
                  }
                }
              });
            });
          });
        }, 180);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(debounceId);
      if (apiTimer) clearTimeout(apiTimer);
    };
  }, [query, city, smartSearch]);

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
      router.push(`/order-online?city=${encodeURIComponent(city)}`);
      return;
    }

    const results =
      suggestions.length > 0
        ? suggestions
        : searchHeroCatalog(trimmed, city);
    if (results.length === 0) {
      void searchHeroCatalogAsync(trimmed, city).then((asyncResults) => {
        if (asyncResults.length === 0) {
          setNoResults(true);
          setOpen(true);
          return;
        }
        setOpen(false);
        router.push(resolveHeroSearchTarget(trimmed, city, asyncResults));
      });
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
        className="flex h-12 w-full items-center overflow-hidden rounded-xl border border-border bg-white/95 shadow-card backdrop-blur-md transition-shadow focus-within:border-[#D4D4D4] focus-within:shadow-[0_8px_28px_rgba(0,0,0,0.1)] max-md:h-12 max-md:rounded-xl md:h-[66px] md:rounded-[18px]"
      >
        <div ref={cityRef} className="relative hidden sm:block h-full shrink-0">
          <button
            type="button"
            onClick={() => setCityOpen((v) => !v)}
            className="flex items-center h-full px-4 border-r border-border w-[210px] text-foreground cursor-pointer hover:bg-section rounded-l-[18px] transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-expanded={cityOpen}
            aria-haspopup="listbox"
            aria-label={`Select delivery city, currently ${city}`}
          >
            <MapPin className="text-[var(--color-primary)] w-4 h-4 mr-2.5 shrink-0" aria-hidden="true" />
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
              className="absolute left-0 top-[calc(100%+6px)] z-[60] w-[210px] bg-white border border-border rounded-2xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
            >
              {HERO_CITIES.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={city === c}
                    onClick={() => selectCity(c)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-section ${
                      city === c ? "text-[var(--color-primary)] bg-section" : "text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex min-w-0 items-center h-full flex-grow px-4 sm:px-5 text-foreground group">
          <Search className="text-[var(--color-gray-text)] group-focus-within:text-[var(--color-primary)] w-4 h-4 mr-3 shrink-0 transition-colors" aria-hidden="true" />
          <label htmlFor="hero-search-input" className="sr-only">
            Search restaurants or dishes
          </label>
          <input
            id="hero-search-input"
            type="search"
            role="combobox"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              preloadHeroSearchCatalog();
              if (normalizeSearchQuery(query).length > 0) setOpen(true);
            }}
            placeholder="Search restaurants or dishes..."
            className="w-full min-w-0 h-full bg-transparent outline-none text-foreground placeholder:text-muted text-base sm:text-[16px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            autoComplete="off"
            aria-autocomplete="list"
            {...(showDropdown
              ? { "aria-controls": "hero-search-suggestions", "aria-expanded": true }
              : { "aria-expanded": false })}
          />
        </div>

        <button
          type="submit"
          className="mr-1 flex h-9 w-[52px] shrink-0 touch-target items-center justify-center rounded-lg bg-primary text-xs font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all active:translate-y-0 hover:bg-primary-hover max-md:h-9 max-md:w-[52px] md:h-[52px] md:w-[158px] md:rounded-xl md:text-sm"
        >
          <span className="hidden md:inline">Search</span>
          <span className="md:hidden">Go</span>
        </button>
      </form>

      {showDropdown ? (
        <ul
          id="hero-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-border rounded-2xl shadow-lg overflow-hidden max-h-72 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            suggestions.map((s) => (
              <li key={`${s.type}-${s.id}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => goSuggestion(s)}
                  className="touch-target w-full text-left px-4 py-3 hover:bg-section flex items-center justify-between gap-3"
                >
                  <span className="font-semibold text-sm text-foreground truncate">{s.name}</span>
                  <span className="text-[10px] font-bold uppercase text-[#9CA3AF] shrink-0">
                    {s.type}
                    {s.subtitle ? ` · ${s.subtitle}` : ""}
                  </span>
                </button>
              </li>
            ))
          ) : noResults ? (
            <li className="px-4 py-4 text-sm font-medium text-gray-text text-center">
              No matching restaurants or dishes found.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
