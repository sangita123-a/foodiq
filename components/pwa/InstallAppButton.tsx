"use client";

import { Download } from "lucide-react";
import { usePwaInstall } from "@/components/pwa/PwaProvider";

export default function InstallAppButton() {
  const { canInstall, isInstalled, installApp } = usePwaInstall();

  if (isInstalled || !canInstall) return null;

  return (
    <button
      type="button"
      onClick={() => {
        void installApp();
      }}
      className="hidden md:inline-flex h-10 items-center gap-2 rounded-xl border border-[#E23744]/20 bg-[#E23744]/10 px-4 text-sm font-semibold text-[#E23744] transition-all hover:-translate-y-0.5 hover:bg-[#E23744]/15"
      aria-label="Install Foodiq app"
    >
      <Download className="h-4 w-4" />
      Install App
    </button>
  );
}
