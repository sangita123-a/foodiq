"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutHero() {
  return (
    <div className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      
      {/* Premium Food Background with Dark Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/catalog/cuisines/indian.webp')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 text-5xl font-black tracking-[-0.045em] text-[#1C1C1C] md:text-6xl lg:text-7xl"
        >
          About <span className="text-primary">Foodiq</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[#686B78] md:text-xl"
        >
          Connecting food lovers with the best restaurants, delivered fast and fresh straight to your door.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link 
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E23744] px-8 py-4 font-bold text-white shadow-[0_12px_30px_rgba(226, 55, 68,0.22)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#E23744] hover:shadow-[0_16px_34px_rgba(239,79,95,0.22)]"
          >
            Explore Restaurants <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>

    </div>
  );
}
