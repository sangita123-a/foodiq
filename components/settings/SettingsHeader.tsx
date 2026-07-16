"use client";

import { Settings } from "lucide-react";

export default function SettingsHeader() {
  return (
    <div className="mb-10 text-center md:text-left border-b border-white/5 pb-8">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 flex items-center justify-center md:justify-start gap-4">
        <Settings className="w-10 h-10 md:w-12 md:h-12 text-[#FF2D3B]" />
        Account Settings
      </h1>
      <p className="text-[#A1A1A1] text-lg">
        Manage your account, privacy, security, and preferences.
      </p>
    </div>
  );
}
