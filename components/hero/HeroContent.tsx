"use client";

import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

const SearchBar = dynamic(() => import("@/components/SearchBar"), {
  loading: () => (
    <div
      className="h-12 w-full max-w-4xl animate-pulse rounded-xl bg-white/15 max-md:h-12 md:h-[66px] md:rounded-[18px]"
      aria-hidden
    />
  ),
});

const words = [
  "Restaurants",
  "Pizza",
  "Burgers",
  "Biryani",
  "Momos",
  "Cafes",
  "Desserts",
];

export default function HeroContent() {
  const [index, setIndex] = useState(0);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const scrollToContent = () => {
    const nextSection =
      document.getElementById("food-category-nav") ||
      document.querySelector("main > div");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({
        top: 600,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center px-1 text-center max-md:px-0">
      <h1 className="m-0 flex max-w-full flex-col items-center justify-center p-0 text-center font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-md max-md:text-[26px] md:text-6xl lg:text-7xl">
        <span className="block max-md:line-clamp-1">Find the Best</span>
        <span className="relative block h-[1.12em] w-full max-w-[500px] overflow-hidden text-primary max-md:my-0 md:my-1">
          <span
            key={index}
            className={`absolute inset-0 flex items-center justify-center text-center ${
              prefersReduced ? "" : "hero-word-animate"
            }`}
          >
            {words[index]}
          </span>
        </span>
        <span className="block max-md:line-clamp-1">Near You</span>
      </h1>

      <p className="mt-1.5 max-w-2xl text-center text-[10px] font-medium leading-snug text-white/95 drop-shadow max-md:line-clamp-2 max-md:px-1 md:mt-6 md:text-lg lg:text-xl">
        Discover amazing restaurants and delicious food delivered straight to your doorstep.
      </p>

      <div className="mt-2 flex w-full max-w-[1100px] justify-center max-md:mt-1.5 md:mt-12">
        <SearchBar />
      </div>

      <button
        type="button"
        onClick={scrollToContent}
        aria-label="Scroll down to explore categories and dishes"
        className={`mt-6 hidden h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white hover:text-primary hover:shadow-lg md:mt-12 md:flex ${
          prefersReduced ? "" : "hero-scroll-bounce"
        }`}
      >
        <ArrowDown className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
