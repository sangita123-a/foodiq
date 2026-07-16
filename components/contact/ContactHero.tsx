"use client";

import { motion } from "framer-motion";

export default function ContactHero() {
  return (
    <div className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
      
      {/* Premium Background with Dark Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=2070')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B]/90 via-[#0B0B0B]/80 to-[#0B0B0B]"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 text-center mt-10">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6"
        >
          Contact <span className="text-primary">Foodiq</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
        >
          We're here to help. Reach out to us anytime for support, feedback, partnerships, or business inquiries.
        </motion.p>
      </div>

    </div>
  );
}
