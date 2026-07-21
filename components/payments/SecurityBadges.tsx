"use client";

import { Lock, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function SecurityBadges() {
  return (
    <div className="mt-16 flex flex-wrap justify-center gap-6 border-t border-border pt-12 md:gap-12">
      
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-5 py-3 shadow-[0_6px_18px_rgba(28,28,28,0.05)]">
        <Lock className="w-6 h-6 text-green-500" />
        <div>
          <h4 className="text-sm font-bold text-foreground">256-bit Encryption</h4>
          <p className="text-xs text-muted">Bank-grade security</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-5 py-3 shadow-[0_6px_18px_rgba(28,28,28,0.05)]">
        <ShieldCheck className="w-6 h-6 text-blue-500" />
        <div>
          <h4 className="text-sm font-bold text-foreground">Secure Payments</h4>
          <p className="text-xs text-muted">100% safe transactions</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-5 py-3 shadow-[0_6px_18px_rgba(28,28,28,0.05)]">
        <CheckCircle2 className="w-6 h-6 text-yellow-500" />
        <div>
          <h4 className="text-sm font-bold text-foreground">PCI-DSS Compliant</h4>
          <p className="text-xs text-muted">Certified infrastructure</p>
        </div>
      </div>

    </div>
  );
}
