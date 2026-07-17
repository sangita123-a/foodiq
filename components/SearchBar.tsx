"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
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
    <form onSubmit={handleSearch} className="w-full max-w-[900px] h-[60px] sm:h-[66px] bg-white/95 backdrop-blur-md border border-[#ECECEC] rounded-[18px] flex items-center shadow-[0_18px_50px_rgba(28,28,28,0.14)] overflow-hidden relative transition-shadow focus-within:border-[#FC8019]/40 focus-within:shadow-[0_20px_55px_rgba(252,128,25,0.16)]">
      {/* Left Section: Location */}
      <div className="hidden sm:flex items-center h-full px-4 border-r border-[#ECECEC] w-[210px] shrink-0 text-[#1C1C1C] cursor-pointer hover:bg-[#F8F9FA] rounded-l-[18px] transition-colors">
        <MapPin className="text-[var(--color-primary)] w-4 h-4 mr-2.5 shrink-0" />
        <div className="flex flex-col flex-grow truncate justify-center">
          <span className="text-[11px] text-[var(--color-gray-text)] font-medium leading-tight">Location</span>
          <span className="font-semibold text-sm truncate leading-tight mt-0.5">Hyderabad</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-gray-text)] shrink-0 ml-1"><path d="m6 9 6 6 6-6"/></svg>
      </div>

      {/* Center Section: Search Input */}
      <div className="flex min-w-0 items-center h-full flex-grow px-4 sm:px-5 text-[#1C1C1C] group">
        <Search className="text-[var(--color-gray-text)] group-focus-within:text-[var(--color-primary)] w-4 h-4 mr-3 shrink-0 transition-colors" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants or dishes..." 
          className="w-full min-w-0 h-full bg-transparent outline-none text-[#1C1C1C] placeholder:text-[#686B78] text-sm sm:text-[16px] font-medium"
        />
      </div>

      {/* Right Section: Search Button */}
      <button 
        type="submit"
        className="h-[50px] sm:h-[56px] w-[92px] sm:w-[170px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[0_7px_18px_rgba(252,128,25,0.28)] shrink-0 mr-1"
      >
        Search
      </button>
    </form>
  );
}
