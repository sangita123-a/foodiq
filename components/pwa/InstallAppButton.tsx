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
      className="hidden md:inline-flex h-9 items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3.5 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/15"
      aria-label="Install Foodiq app"
    >
      <Download className="h-4 w-4" />
      Install App
    </button>
  );
}
