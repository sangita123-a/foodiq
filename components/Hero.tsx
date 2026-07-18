"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "./SearchBar";
import { ArrowDown } from "lucide-react";

const words = [
  "Restaurants",
  "Biryani",
  "Pizza",
  "Burger",
  "Chinese",
  "Desserts",
  "Cafe",
  "Rolls",
  "Shawarma"
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500); // 2 seconds pause + 500ms transition
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

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
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    });
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] min-h-[640px] flex flex-col items-center justify-center overflow-hidden bg-[#F8F9FA]">
      {/* Background Video — deferred until idle to improve LCP */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        {videoReady ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            poster="/icons/og-default.png"
            aria-label="Foodiq hero background showing food delivery atmosphere"
            className="w-full h-full object-cover object-center contrast-[1.02] saturate-[1.04] transform-gpu"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- static LCP poster before video hydrates
          <img
            src="/icons/og-default.png"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
        )}
        {/* Light readability overlay without softening the video */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(255,255,255,0.34)_48%,rgba(255,255,255,0.7)_100%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(255,255,255,0.3))]"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center w-full px-4 sm:px-6">
        <motion.h1 
          className="text-[#1C1C1C] font-extrabold text-center flex flex-col items-center justify-center m-0 p-0 tracking-[-0.055em] leading-none drop-shadow-[0_2px_18px_rgba(255,255,255,0.5)]"
        >
          <span className="block text-[clamp(40px,5vw,72px)]">Find the Best</span>
          <span className="block text-[var(--color-primary)] text-[clamp(46px,6vw,78px)] relative overflow-hidden w-full h-[1.1em]">
            <AnimatePresence>
              <motion.span
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute left-0 right-0 text-center"
              >
                {words[index]}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="block text-[clamp(40px,5vw,72px)]">Near You</span>
        </motion.h1>

        <motion.p 
          className="text-[#424242] text-base sm:text-lg md:text-xl text-center max-w-[700px] mt-6 mb-9 sm:mb-12 font-medium leading-relaxed"
        >
          Discover amazing restaurants and delicious food delivered straight to your doorstep.
        </motion.p>

        <motion.div className="w-full max-w-[1100px] flex justify-center">
          <SearchBar />
        </motion.div>

        <motion.button
          onClick={scrollToContent}
          animate={{ 
            y: [0, -10, 0],
            boxShadow: [
              "0 0 15px rgba(252, 128, 25, 0.35)", 
              "0 0 25px rgba(252, 128, 25, 0.6)", 
              "0 0 15px rgba(252, 128, 25, 0.35)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.1, boxShadow: "0 0 40px rgba(252, 128, 25, 0.65)" }}
          className="mt-12 sm:mt-16 flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[var(--color-primary)] cursor-pointer z-20 shrink-0"
        >
          <ArrowDown className="text-[var(--color-primary)] w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
