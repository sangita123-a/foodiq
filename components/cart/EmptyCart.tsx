"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyCart() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="w-48 h-48 mb-8 relative">
        <div className="absolute inset-0 bg-[#FF2D3B]/20 rounded-full blur-3xl"></div>
        <img 
          src="https://illustrations.popsy.co/amber/surreal-hourglass.svg" 
          alt="Empty Cart Illustration"
          className="w-full h-full object-contain relative z-10 opacity-70 drop-shadow-2xl"
        />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-4">Your cart is empty</h2>
      <p className="text-[#A1A1A1] max-w-md mb-8">
        Looks like you haven't added anything to your cart yet. Discover delicious food around you and satisfy your cravings!
      </p>
      
      <Link href="/" className="bg-[#FF2D3B] hover:bg-[#e02633] text-white px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,45,59,0.4)] hover:-translate-y-1 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        Explore Restaurants
      </Link>
    </motion.div>
  );
}
