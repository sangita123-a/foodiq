"use client";

import { ChevronDown, Clock, MapPin, Search, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { fetchSearchSuggest } from "@/services/featuresApi";
import { useFeatureFlag } from "@/lib/featureFlags";
import {
  filterLocations,
  getDefaultLocation,
  getStoredLocation,
  resolveCityKey,
  setStoredLocation,
  type HeroLocation,
} from "@/lib/heroLocation";
import {
  getHeroEmptySuggestions,
  mapApiSuggestion,
  normalizeSearchQuery,
  preloadHeroSearchCatalog,
  pushRecentSearch,
  resolveHeroSearchTarget,
  searchHeroCatalog,
  searchHeroCatalogAsync,
  type HeroSearchResult,
} from "@/lib/heroSearch";

export default function SearchBar() {
  const router = useRouter();
  const locationListId = useId();
  const searchListId = useId();

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<HeroLocation>(() =>
    typeof window === "undefined" ? getDefaultLocation() : getStoredLocation()
  );
  const [locationDraft, setLocationDraft] = useState(() =>
    typeof window === "undefined" ? getDefaultLocation() : getStoredLocation()
  );
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationHighlight, setLocationHighlight] = useState(0);
  const [suggestions, setSuggestions] = useState<HeroSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [noResults, setNoResults] = useState(false);
  const [, startTransition] = useTransition();

  const wrapRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const smartSearch = useFeatureFlag("smart_search", true);

  const cityKey = resolveCityKey(location || "Hyderabad");
  const filteredLocations = filterLocations(locationDraft);

  useEffect(() => {
    const onLocation = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.trim()) {
        setLocation(detail.trim());
        setLocationDraft(detail.trim());
      }
    };
    window.addEventListener("foodiq:location-updated", onLocation);
    return () => window.removeEventListener("foodiq:location-updated", onLocation);
  }, []);

  useEffect(() => {
    const q = normalizeSearchQuery(query);
    if (q.length < 1) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    let cancelled = false;
    let apiTimer: ReturnType<typeof setTimeout> | undefined;

    const runLocalSearch = async () => {
      const syncResults = searchHeroCatalog(query, cityKey);
      if (syncResults.length > 0) {
        if (!cancelled) {
          setSuggestions(syncResults);
          setNoResults(false);
          setOpen(true);
          setHighlight(0);
        }
        return syncResults;
      }

      const asyncResults = await searchHeroCatalogAsync(query, cityKey);
      if (!cancelled) {
        setSuggestions(asyncResults);
        setNoResults(asyncResults.length === 0);
        setOpen(true);
        setHighlight(0);
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
                  await Promise.all(rows.map((row) => mapApiSuggestion(row, cityKey)))
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
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(debounceId);
      if (apiTimer) clearTimeout(apiTimer);
    };
  }, [query, cityKey, smartSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setLocationOpen(false);
        setLocationDraft(location || "");
      }
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setLocationOpen(false);
        setLocationDraft(location || "");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [location]);

  const selectLocation = useCallback((next: HeroLocation) => {
    const trimmed = next.trim();
    if (!trimmed) return;
    setLocation(trimmed);
    setLocationDraft(trimmed);
    setStoredLocation(trimmed);
    setLocationOpen(false);
    setLocationHighlight(0);
    searchInputRef.current?.focus();
  }, []);

  const commitCustomLocation = useCallback(() => {
    const trimmed = locationDraft.trim();
    if (!trimmed) {
      setLocationDraft(location);
      setLocationOpen(false);
      return;
    }
    selectLocation(trimmed);
  }, [locationDraft, location, selectLocation]);

  const showEmptySuggestions = () => {
    preloadHeroSearchCatalog();
    const empty = getHeroEmptySuggestions(cityKey);
    setSuggestions(empty);
    setNoResults(false);
    setOpen(empty.length > 0);
    setHighlight(0);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim().replace(/\s+/g, " ");
    const activeCity = resolveCityKey(location || cityKey);

    if (!trimmed) {
      setOpen(false);
      router.push(`/order-online?city=${encodeURIComponent(activeCity)}`);
      return;
    }

    pushRecentSearch(trimmed);

    const results =
      suggestions.filter(
        (s) =>
          s.type === "restaurant" ||
          s.type === "dish" ||
          s.type === "category" ||
          s.type === "collection" ||
          s.type === "cuisine"
      ).length > 0
        ? suggestions
        : searchHeroCatalog(trimmed, activeCity);

    if (results.length === 0) {
      void searchHeroCatalogAsync(trimmed, activeCity).then((asyncResults) => {
        setOpen(false);
        if (asyncResults.length === 0) {
          router.push(
            `/search?q=${encodeURIComponent(trimmed)}&city=${encodeURIComponent(activeCity)}`
          );
          return;
        }
        router.push(resolveHeroSearchTarget(trimmed, activeCity, asyncResults));
      });
      return;
    }

    setOpen(false);
    router.push(resolveHeroSearchTarget(trimmed, activeCity, results));
  };

  const goSuggestion = (s: HeroSearchResult) => {
    setOpen(false);
    if (
      s.type === "popular" ||
      s.type === "recent" ||
      s.type === "trending" ||
      s.type === "cuisine"
    ) {
      setQuery(s.name);
      pushRecentSearch(s.name);
    } else {
      pushRecentSearch(s.name);
    }
    router.push(s.href);
  };

  const onLocationKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!locationOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setLocationOpen(true);
      setLocationHighlight(0);
      return;
    }
    if (!locationOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setLocationHighlight((i) =>
        filteredLocations.length === 0 ? 0 : (i + 1) % filteredLocations.length
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setLocationHighlight((i) =>
        filteredLocations.length === 0
          ? 0
          : (i - 1 + filteredLocations.length) % filteredLocations.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredLocations[locationHighlight]) {
        selectLocation(filteredLocations[locationHighlight].label);
      } else {
        commitCustomLocation();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setLocationOpen(false);
      setLocationDraft(location);
    }
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "ArrowDown" && normalizeSearchQuery(query).length === 0) {
        showEmptySuggestions();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && suggestions[highlight]) {
      e.preventDefault();
      goSuggestion(suggestions[highlight]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const showDropdown = open && suggestions.length > 0;
  const showNoResults =
    open && noResults && normalizeSearchQuery(query).length > 0;

  const suggestionIcon = (type: HeroSearchResult["type"]) => {
    if (type === "recent") return <Clock className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />;
    if (type === "trending" || type === "popular")
      return <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />;
    return <Search className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />;
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-[1100px]">
      <form
        onSubmit={handleSearch}
        className="flex w-full flex-col gap-3 md:flex-row md:items-start md:gap-3"
      >
        {/* Location box */}
        <div className="relative w-full shrink-0 md:w-[300px]">
          <div
            className={`flex h-12 items-center rounded-xl border border-border bg-white px-3 shadow-[0_2px_16px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] focus-within:border-[#D4D4D4] focus-within:shadow-[0_8px_28px_rgba(0,0,0,0.12)] md:h-[66px] md:rounded-[16px] md:px-4 ${
              locationOpen ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <MapPin
              className="mr-2.5 h-4 w-4 shrink-0 text-[var(--color-primary)] md:h-[18px] md:w-[18px]"
              aria-hidden="true"
            />
            <label htmlFor="hero-location-input" className="sr-only">
              Select Location
            </label>
            <input
              ref={locationInputRef}
              id="hero-location-input"
              type="text"
              role="combobox"
              value={locationDraft}
              placeholder="Select Location"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={locationOpen}
              aria-controls={locationListId}
              aria-haspopup="listbox"
              onChange={(e) => {
                setLocationDraft(e.target.value);
                setLocationOpen(true);
                setLocationHighlight(0);
              }}
              onFocus={() => {
                setLocationOpen(true);
                setLocationHighlight(0);
              }}
              onKeyDown={onLocationKeyDown}
              onBlur={() => {
                // Delay so option click can commit first
                window.setTimeout(() => {
                  if (!wrapRef.current?.contains(document.activeElement)) {
                    setLocationDraft(location);
                  }
                }, 120);
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted md:text-[15px]"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label="Toggle location list"
              onClick={() => {
                setLocationOpen((v) => !v);
                locationInputRef.current?.focus();
              }}
              className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-gray-text)] transition-colors hover:bg-section"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${locationOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
          </div>

          {location ? (
            <p className="mt-1.5 truncate px-1 text-left text-[11px] font-medium text-white/90 drop-shadow md:text-xs">
              Delivering to {location}
            </p>
          ) : null}

          {locationOpen ? (
            <ul
              id={locationListId}
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] max-h-64 overflow-y-auto rounded-2xl border border-border bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
            >
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc, idx) => (
                  <li key={loc.label}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={location === loc.label || locationHighlight === idx}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectLocation(loc.label)}
                      className={`flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-section ${
                        locationHighlight === idx || location === loc.label
                          ? "bg-section text-[var(--color-primary)]"
                          : "text-foreground"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      <span className="truncate">{loc.label}</span>
                    </button>
                  </li>
                ))
              ) : (
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={commitCustomLocation}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-section"
                  >
                    Use &quot;{locationDraft.trim()}&quot;
                  </button>
                </li>
              )}
            </ul>
          ) : null}
        </div>

        {/* Search box + button */}
        <div className="relative flex w-full min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start">
          <div
            className={`flex h-12 w-full min-w-0 flex-1 items-center rounded-xl border border-border bg-white px-3 shadow-[0_2px_16px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] focus-within:border-[#D4D4D4] focus-within:shadow-[0_8px_28px_rgba(0,0,0,0.12)] md:h-[66px] md:rounded-[16px] md:px-5 ${
              open ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <Search
              className="mr-2.5 h-4 w-4 shrink-0 text-[var(--color-gray-text)] transition-colors group-focus-within:text-[var(--color-primary)] md:mr-3 md:h-[18px] md:w-[18px]"
              aria-hidden="true"
            />
            <label htmlFor="hero-search-input" className="sr-only">
              Search for restaurants, dishes or cuisines
            </label>
            <input
              ref={searchInputRef}
              id="hero-search-input"
              type="search"
              role="combobox"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                preloadHeroSearchCatalog();
                if (normalizeSearchQuery(query).length > 0) {
                  setOpen(true);
                } else {
                  showEmptySuggestions();
                }
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search for restaurants, dishes or cuisines"
              className="w-full min-w-0 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted md:text-base"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={searchListId}
              aria-expanded={showDropdown || showNoResults}
            />
          </div>

          <button
            type="submit"
            className="flex h-12 w-full shrink-0 touch-target items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all hover:bg-primary-hover active:translate-y-px sm:h-12 sm:w-[140px] md:h-[66px] md:w-[158px] md:rounded-[16px] md:text-base"
          >
            Search
          </button>

          {showDropdown || showNoResults ? (
            <ul
              id={searchListId}
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-border bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)] sm:right-[152px] md:right-[170px]"
            >
              {showNoResults ? (
                <li className="px-4 py-4 text-center text-sm font-medium text-gray-text">
                  No matching restaurants, dishes or cuisines found.
                </li>
              ) : (
                suggestions.map((s, idx) => (
                  <li key={`${s.type}-${s.id}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={highlight === idx}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => goSuggestion(s)}
                      className={`touch-target flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-section ${
                        highlight === idx ? "bg-section" : ""
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {suggestionIcon(s.type)}
                        <span className="truncate text-sm font-semibold text-foreground">
                          {s.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-bold uppercase text-[#9CA3AF]">
                        {s.subtitle || s.type}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      </form>
    </div>
  );
}
