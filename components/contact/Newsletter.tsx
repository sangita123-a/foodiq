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
          className="bg-white rounded-[40px] p-10 md:p-16 border border-[#E8E8E8] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        >
          <div className="flex-1 relative z-10 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black text-[#1C1C1C] mb-4">
              Stay Updated with Foodiq
            </h2>
            <p className="text-[#696969]">
              Subscribe to our newsletter for exclusive offers, new restaurant additions, and the latest food trends.
            </p>
          </div>

          <div className="w-full md:w-auto relative z-10">
            <form className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto md:mx-0">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                required
                className="flex-1 bg-white text-[#1C1C1C] border border-[#E8E8E8] rounded-xl px-6 py-3.5 focus:outline-none focus:border-[#D4D4D4] transition-colors min-w-[250px]"
              />
              <button 
                type="submit"
                className="bg-[#E23744] hover:bg-[#C81E32] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.08)] whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
            <p className="text-[#9C9C9C] text-xs mt-3 text-center md:text-left">
              By subscribing, you agree to our Privacy Policy. No spam, ever.
            </p>
          </div>

        </motion.div>

      </div>
    </div>
  );
}
