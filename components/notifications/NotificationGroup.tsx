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
      <div className="sticky top-[90px] z-20 py-2 bg-[#FFFFFF]/90 backdrop-blur-md mb-4 border-b border-[#E5E7EB]">
        <h2 className="text-lg font-bold text-[#6B7280] tracking-wider uppercase">
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
