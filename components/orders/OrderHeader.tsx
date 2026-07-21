"use client";

import { Package } from "lucide-react";

export default function OrderHeader() {
  return (
    <div className="mb-8 text-center md:text-left border-b border-border pb-8">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 flex items-center justify-center md:justify-start gap-4">
        <Package className="w-10 h-10 md:w-12 md:h-12 text-primary" />
        My Orders
      </h1>
      <p className="text-[#A1A1A1] text-lg">
        View and manage all your previous and current food orders.
      </p>
    </div>
  );
}
