"use client";

import { Lock, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function SecurityBadges() {
  return (
    <div className="mt-16 pt-12 border-t border-white/5 flex flex-wrap justify-center gap-6 md:gap-12 opacity-80">
      
      <div className="flex items-center gap-3 bg-[#111] px-5 py-3 rounded-2xl border border-white/5 shadow-inner">
        <Lock className="w-6 h-6 text-green-500" />
        <div>
          <h4 className="text-white font-bold text-sm">256-bit Encryption</h4>
          <p className="text-gray-500 text-xs">Bank-grade security</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-[#111] px-5 py-3 rounded-2xl border border-white/5 shadow-inner">
        <ShieldCheck className="w-6 h-6 text-blue-500" />
        <div>
          <h4 className="text-white font-bold text-sm">Secure Payments</h4>
          <p className="text-gray-500 text-xs">100% safe transactions</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-[#111] px-5 py-3 rounded-2xl border border-white/5 shadow-inner">
        <CheckCircle2 className="w-6 h-6 text-yellow-500" />
        <div>
          <h4 className="text-white font-bold text-sm">PCI-DSS Compliant</h4>
          <p className="text-gray-500 text-xs">Certified infrastructure</p>
        </div>
      </div>

    </div>
  );
}
