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

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500); // 2 seconds pause + 500ms transition
    return () => clearInterval(interval);
  }, []);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    });
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay with Blur */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center w-full px-4 pt-16">
        <motion.h1 
          className="text-white font-black text-center flex flex-col items-center justify-center m-0 p-0 tracking-[-1px] leading-none"
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
          className="text-white/90 text-lg md:text-xl text-center max-w-[700px] mt-6 mb-12 font-medium"
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
              "0 0 15px rgba(255, 45, 59, 0.4)", 
              "0 0 25px rgba(255, 45, 59, 0.7)", 
              "0 0 15px rgba(255, 45, 59, 0.4)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.1, boxShadow: "0 0 40px rgba(255, 45, 59, 0.9)" }}
          className="mt-16 flex items-center justify-center w-[90px] h-[90px] rounded-full bg-black border border-[var(--color-primary)] cursor-pointer z-20 shrink-0"
        >
          <ArrowDown className="text-white w-8 h-8" />
        </motion.button>
      </div>
    </div>
  );
}
