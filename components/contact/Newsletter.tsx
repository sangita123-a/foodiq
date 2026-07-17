"use client";

import { motion } from "framer-motion";

export default function Newsletter() {
  return (
    <div className="py-24 px-4 md:px-8">
      <div className="container mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-[#F8FAFC] to-[#F8FAFC] rounded-[40px] p-10 md:p-16 border border-[#E5E7EB] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10"
        >
          {/* Subtle red glow on the left */}
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>

          <div className="flex-1 relative z-10 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Stay Updated with Foodiq
            </h2>
            <p className="text-[#6B7280]">
              Subscribe to our newsletter for exclusive offers, new restaurant additions, and the latest food trends.
            </p>
          </div>

          <div className="w-full md:w-auto relative z-10">
            <form className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto md:mx-0">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                required
                className="flex-1 bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-6 py-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors min-w-[250px]"
              />
              <button 
                type="submit"
                className="bg-primary hover:bg-[#E76F0B] text-white font-black px-8 py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(252,128,25,0.3)] whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
            <p className="text-[#9CA3AF] text-xs mt-3 text-center md:text-left">
              By subscribing, you agree to our Privacy Policy. No spam, ever.
            </p>
          </div>

        </motion.div>

      </div>
    </div>
  );
}
