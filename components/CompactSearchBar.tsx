"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompactSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/restaurants");
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-[850px] h-[65px] bg-white border border-[var(--color-border)] rounded-[20px] flex items-center shadow-xl overflow-hidden relative mx-auto">
      {/* Left Section: Location */}
      <div className="flex items-center h-full px-4 border-r border-[var(--color-border)] w-[200px] shrink-0 text-[#111827] cursor-pointer hover:bg-[#F8FAFC] transition-colors">
        <MapPin className="text-[var(--color-primary)] w-4 h-4 mr-2.5 shrink-0" />
        <div className="flex flex-col flex-grow truncate justify-center">
          <span className="text-[11px] text-[var(--color-gray-text)] font-medium leading-tight">Location</span>
          <span className="font-semibold text-sm truncate leading-tight mt-0.5">Hyderabad</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-gray-text)] shrink-0 ml-1"><path d="m6 9 6 6 6-6"/></svg>
      </div>

      {/* Center Section: Search Input */}
      <div className="flex items-center h-full flex-grow px-5 text-[#111827] group shrink-0">
        <Search className="text-[var(--color-gray-text)] group-focus-within:text-[var(--color-primary)] w-4 h-4 mr-3 shrink-0 transition-colors" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants or dishes..." 
          className="w-full h-full bg-transparent outline-none text-[#111827] placeholder-[var(--color-gray-text)] text-base font-medium"
        />
      </div>

      {/* Right Section: Search Button */}
      <button 
        type="submit"
        className="h-[52px] w-[140px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold rounded-[14px] transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(226, 55, 68,0.3)] shrink-0 mr-1.5"
      >
        Search
      </button>
    </form>
  );
}
