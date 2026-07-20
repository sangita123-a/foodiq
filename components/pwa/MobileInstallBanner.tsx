"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/components/pwa/PwaProvider";

const DISMISS_KEY = "foodiq_pwa_install_dismissed";

export default function MobileInstallBanner() {
  const { canInstall, isInstalled, isMobile, installApp } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!isMobile || isInstalled || !canInstall || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#ECECEC] bg-white/95 p-4 shadow-[0_-12px_40px_rgba(28,28,28,0.12)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E23744] text-lg font-extrabold text-white">
          F
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#1C1C1C]">Install Foodiq</p>
          <p className="mt-0.5 text-xs leading-5 text-[#686B78]">
            Add Foodiq to your home screen for faster ordering and offline access.
          </p>
          <button
            type="button"
            onClick={() => {
              void installApp();
            }}
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#E23744] px-4 text-xs font-semibold text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Install App
          </button>
        </div>
        <button
          type="button"
          aria-label="Dismiss install banner"
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          className="rounded-lg p-1 text-[#686B78] hover:bg-[#F8F9FA]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
