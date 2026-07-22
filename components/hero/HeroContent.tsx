"use client";

import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

const SearchBar = dynamic(() => import("@/components/SearchBar"), {
  loading: () => (
    <div
      className="h-12 sm:h-[60px] md:h-[66px] w-full max-w-4xl rounded-[14px] sm:rounded-[18px] bg-white/15 animate-pulse"
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
    <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center text-center">
      <h1 className="m-0 flex flex-col items-center justify-center p-0 text-center font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
        <span className="block text-[30px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold">
          Find the Best
        </span>
        <span className="relative my-1 block h-[1.25em] w-full max-w-[500px] overflow-hidden text-[30px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary">
          <span
            key={index}
            className={`absolute inset-0 flex items-center justify-center text-center ${
              prefersReduced ? "" : "hero-word-animate"
            }`}
          >
            {words[index]}
          </span>
        </span>
        <span className="block text-[30px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold">
          Near You
        </span>
      </h1>

      <p className="mt-4 sm:mt-6 max-w-2xl text-center text-sm sm:text-base md:text-lg lg:text-xl font-medium text-white/95 leading-relaxed drop-shadow">
        Discover amazing restaurants and delicious food delivered straight to your doorstep.
      </p>

      <div className="mt-6 sm:mt-10 md:mt-12 w-full max-w-4xl flex justify-center">
        <SearchBar />
      </div>

      <button
        type="button"
        onClick={scrollToContent}
        aria-label="Scroll down to explore categories and dishes"
        className={`mt-8 sm:mt-12 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white hover:text-primary hover:shadow-lg ${
          prefersReduced ? "" : "hero-scroll-bounce"
        }`}
      >
        <ArrowDown className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
