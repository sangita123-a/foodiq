"use client";

import { motion } from "framer-motion";

export default function Newsletter() {
  return (
    <div className="px-3 py-4 max-md:px-3 max-md:py-4 md:px-8 md:py-24">
      <div className="container mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative flex flex-col items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-card max-md:gap-4 max-md:rounded-2xl max-md:p-4 md:flex-row md:gap-10 md:rounded-[40px] md:p-16"
        >
          <div className="relative z-10 flex-1 text-center md:text-left">
            <h2 className="mb-1 text-base font-black text-foreground max-md:text-base md:mb-4 md:text-4xl">
              Stay Updated with Foodiq
            </h2>
            <p className="text-[11px] text-gray-text max-md:line-clamp-2 max-md:text-[11px] md:text-base">
              Subscribe to our newsletter for exclusive offers, new restaurant additions, and the latest food trends.
            </p>
          </div>

          <div className="relative z-10 w-full md:w-auto">
            <form className="mx-auto flex w-full max-w-lg flex-col gap-2 sm:flex-row md:mx-0 md:gap-3">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                required
                className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 text-foreground transition-colors focus:border-border-hover focus:outline-none max-md:h-[42px] max-md:rounded-lg max-md:py-0 md:min-w-[250px] md:rounded-xl md:px-6 md:py-3.5"
              />
              <button 
                type="submit"
                className="whitespace-nowrap rounded-lg bg-primary px-4 font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-primary-hover max-md:h-[42px] max-md:py-0 max-md:text-xs md:rounded-xl md:px-8 md:py-3.5"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-muted max-md:mt-1.5 max-md:text-[10px] md:mt-3 md:text-left md:text-xs">
              By subscribing, you agree to our Privacy Policy. No spam, ever.
            </p>
          </div>

        </motion.div>

      </div>
    </div>
  );
}
