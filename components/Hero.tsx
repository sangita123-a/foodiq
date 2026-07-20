"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

const words = [
  "Restaurants",
  "Pizza",
  "Burgers",
  "Biryani",
  "Momos",
  "Cafes",
  "Desserts",
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setVideoReady(true);
      return;
    }

    const enable = () => setVideoReady(true);
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(enable, 1200);
    }

    return () => {
      if (idleId != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const scrollToContent = () => {
    const nextSection = document.getElementById("food-category-nav") || document.querySelector("main > div");
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
    <section className="relative flex min-h-[540px] sm:min-h-[600px] md:min-h-[660px] lg:min-h-[700px] w-full flex-col items-center justify-center overflow-hidden bg-[#0F172A] px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20">
      {/* Background Video / Image — Crystal clear & sharp with clean contrast overlay */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        {videoReady ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            poster="/icons/og-default.png"
            aria-label="Foodiq hero background showing food delivery atmosphere"
            className="h-full w-full object-cover object-center transform-gpu scale-[1.01]"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/icons/og-default.png"
            alt="Foodiq online food delivery"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-center"
          />
        )}
        {/* Subtle dark gradient overlay for text clarity — NO heavy white or grey blurry wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none" />
      </div>

      {/* Hero Central Content */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center text-center">
        {/* Main Heading */}
        <motion.h1 className="m-0 flex flex-col items-center justify-center p-0 text-center font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
          <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold">
            Find the Best
          </span>
          <span className="relative my-1 block h-[1.25em] w-full max-w-[500px] overflow-hidden text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#E23744]">
            <AnimatePresence mode="wait">
              <motion.span
                key={index}
                initial={prefersReduced ? false : { y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={prefersReduced ? undefined : { y: -28, opacity: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.35, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-center"
              >
                {words[index]}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold">
            Near You
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p className="mt-4 sm:mt-6 max-w-2xl text-center text-sm sm:text-base md:text-lg lg:text-xl font-medium text-white/95 leading-relaxed drop-shadow">
          Discover amazing restaurants and delicious food delivered straight to your doorstep.
        </motion.p>

        {/* Unified Search Bar */}
        <motion.div className="mt-8 sm:mt-10 md:mt-12 w-full max-w-4xl flex justify-center px-2">
          <SearchBar />
        </motion.div>

        {/* Scroll Indicator Button */}
        <motion.button
          type="button"
          onClick={scrollToContent}
          aria-label="Scroll down to explore categories and dishes"
          animate={
            prefersReduced
              ? undefined
              : {
                  y: [0, 8, 0],
                }
          }
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="mt-8 sm:mt-12 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white hover:text-[#E23744] hover:shadow-lg"
        >
          <ArrowDown className="h-5 w-5" />
        </motion.button>
      </div>
    </section>
  );
}
