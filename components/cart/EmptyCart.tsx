"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

export default function EmptyCart() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="w-48 h-48 mb-8 relative">
        <div className="absolute inset-0 bg-section rounded-full blur-3xl"></div>
        <SafeImage 
          src={FOOD_FALLBACK}
          fallback={FOOD_FALLBACK}
          alt="Empty Cart Illustration"
          className="w-full h-full object-cover rounded-full relative z-10 opacity-70 drop-shadow-2xl"
        />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">Your cart is empty</h2>
      <p className="text-gray-text max-w-md mb-8">
        Looks like you haven't added anything to your cart yet. Discover delicious food around you and satisfy your cravings!
      </p>
      
      <Link href="/" className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        Explore Restaurants
      </Link>
    </motion.div>
  );
}
