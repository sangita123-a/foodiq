"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function AboutCTA() {
  return (
    <div className="py-24 px-4 md:px-8">
      <div className="container mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-[#E23744] to-[#C81E34] rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_20px_60px_rgba(226, 55, 68,0.25)]"
        >
          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F8FAFC] rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight">
              Ready to Order Your Favorite Meal?
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/"
                className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 px-10 py-5 rounded-2xl font-black text-lg transition-colors shadow-2xl hover:-translate-y-1"
              >
                Order Now
              </Link>
              <Link 
                href="/"
                className="w-full sm:w-auto bg-black/20 hover:bg-black/30 backdrop-blur-sm border border-white/30 text-white px-10 py-5 rounded-2xl font-black text-lg transition-colors hover:-translate-y-1"
              >
                Browse Restaurants
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
