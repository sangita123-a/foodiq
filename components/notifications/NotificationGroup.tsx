"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  title: string;
  children: ReactNode;
};

export default function NotificationGroup({ title, children }: Props) {
  return (
    <div className="mb-10 relative">
      <div className="sticky top-[90px] z-20 py-2 bg-[#0B0B0B]/90 backdrop-blur-md mb-4 border-b border-white/5">
        <h2 className="text-lg font-bold text-gray-400 tracking-wider uppercase">
          {title}
        </h2>
      </div>
      
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {children}
        </AnimatePresence>
      </div>
    </div>
  );
}
