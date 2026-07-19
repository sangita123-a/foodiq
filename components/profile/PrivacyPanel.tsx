"use client";

import { motion } from "framer-motion";
import PrivacySettings from "@/components/settings/sections/PrivacySettings";

export default function PrivacyPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-10"
    >
      <h2 className="mb-2 text-2xl font-bold text-[#222222]">Privacy</h2>
      <p className="mb-8 text-sm text-[#555555]">Control how your data is used and shared.</p>
      <PrivacySettings />
    </motion.div>
  );
}
