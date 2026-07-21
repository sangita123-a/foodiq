"use client";

import { motion } from "framer-motion";

export default function MenuHeader() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 flex items-center gap-3">
        🍽️ Menu Management
      </h1>
      <p className="text-gray-text">
        Manage your restaurant's dishes, categories, pricing, and availability.
      </p>
    </motion.div>
  );
}
