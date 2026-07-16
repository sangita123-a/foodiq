"use client";

import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function AppearanceSettings() {
  const { data, mutate } = useSWR("/api/settings");
  const { showToast } = useToast();
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [accent, setAccent] = useState("#FF2D3B");
  const accents = ["#FF2D3B", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

  useEffect(() => {
    if (data) {
      setTheme((data.theme as any) || "dark");
      setAccent(data.accent_color || "#FF2D3B");
    }
  }, [data]);

  const save = async (nextTheme?: string, nextAccent?: string) => {
    try {
      await api.put("/api/settings", {
        theme: nextTheme ?? theme,
        accent_color: nextAccent ?? accent,
      });
      mutate();
      if (typeof document !== "undefined" && (nextAccent || accent)) {
        document.documentElement.style.setProperty("--color-primary", nextAccent ?? accent);
      }
      showToast("Appearance saved", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#171717] rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl"
    >
      <h2 className="text-2xl font-bold text-white mb-8">Appearance</h2>

      <form
        id="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="mb-10 pb-8 border-b border-white/5">
          <h3 className="text-lg font-bold text-white mb-6">Theme</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                { id: "dark", label: "Dark Mode", icon: Moon },
                { id: "light", label: "Light Mode", icon: Sun },
                { id: "system", label: "System Default", icon: Monitor },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  save(opt.id, accent);
                }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-colors ${
                  theme === opt.id
                    ? "border-primary bg-primary/5"
                    : "border-white/10 hover:border-white/30 bg-[#111]"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center ${
                    opt.id === "light" ? "bg-white" : "bg-[#0B0B0B]"
                  }`}
                >
                  <opt.icon className={`w-5 h-5 ${theme === opt.id ? "text-primary" : "text-gray-400"}`} />
                </div>
                <span className={`font-bold ${theme === opt.id ? "text-primary" : "text-gray-400"}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-6">Accent Color</h3>
          <div className="flex flex-wrap items-center gap-4">
            {accents.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setAccent(color);
                  save(theme, color);
                }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                style={{ backgroundColor: color }}
              >
                {accent === color && <Check className="w-6 h-6 text-white absolute" />}
              </button>
            ))}
          </div>
        </div>
      </form>
    </motion.div>
  );
}
