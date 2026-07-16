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
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2070')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B]/90 via-[#0B0B0B]/80 to-[#0B0B0B]"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6"
        >
          About <span className="text-primary">Foodiq</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
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
            className="inline-flex items-center gap-2 bg-primary hover:bg-[#e02633] text-white px-8 py-4 rounded-xl font-black transition-colors shadow-[0_0_30px_rgba(255,45,59,0.4)] hover:-translate-y-1"
          >
            Explore Restaurants <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>

    </div>
  );
}
