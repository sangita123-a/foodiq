"use client";

import { Palette, Image as ImageIcon, Sparkles } from "lucide-react";
import { SettingsState } from "../types";
import { motion } from "framer-motion";

interface BrandingSettingsProps {
  data: SettingsState["branding"];
  onChange: (data: Partial<SettingsState["branding"]>) => void;
}

export default function BrandingSettings({ data, onChange }: BrandingSettingsProps) {
  
  const presetColors = [
    "#e02633", // Foodiq Red
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#f97316", // Orange
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-2">
          <Palette className="w-6 h-6 text-primary" /> Branding
        </h2>
        <p className="text-gray-400 text-sm mb-6">Customize how your restaurant appears to customers on Foodiq.</p>
      </div>

      {/* Theme Color */}
      <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" /> Restaurant Theme Color
        </h3>
        <p className="text-sm text-gray-400 mb-6">This color will be used for buttons, links, and highlights on your restaurant's menu page.</p>
        
        <div className="flex flex-wrap items-center gap-4">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onChange({ themeColor: color })}
              className={`w-12 h-12 rounded-full transition-all flex items-center justify-center ${data.themeColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
              style={{ backgroundColor: color }}
            >
              {data.themeColor === color && <motion.div layoutId="color-check" className="w-3 h-3 bg-white rounded-full" />}
            </button>
          ))}
          
          <div className="flex items-center gap-2 ml-4 border-l border-white/10 pl-4">
            <span className="text-sm font-bold text-gray-400">Custom Hex:</span>
            <input 
              type="text" 
              value={data.themeColor}
              onChange={(e) => onChange({ themeColor: e.target.value })}
              className="w-24 bg-[#171717] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors text-sm font-mono"
            />
          </div>
        </div>
        
        {/* Preview */}
        <div className="mt-8 p-6 bg-[#171717] rounded-2xl border border-white/5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Live Preview</p>
          <div className="flex items-center gap-4">
            <button 
              className="px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-lg"
              style={{ backgroundColor: data.themeColor, boxShadow: `0 4px 20px ${data.themeColor}40` }}
            >
              Order Now
            </button>
            <span style={{ color: data.themeColor }} className="font-bold">Highlighted Text</span>
          </div>
        </div>
      </div>

      {/* Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
          <h3 className="text-white font-bold mb-2">Primary Banner</h3>
          <p className="text-xs text-gray-400 mb-4">Displayed at the top of your menu.</p>
          
          <div className="h-32 w-full bg-[#171717] rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden">
            {data.primaryBanner ? (
              <img src={data.primaryBanner} alt="Primary" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
            ) : null}
            <div className="relative z-10 flex flex-col items-center">
              <ImageIcon className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Replace Image</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
          <h3 className="text-white font-bold mb-2">Promotional Banner</h3>
          <p className="text-xs text-gray-400 mb-4">Displayed below the featured dishes.</p>
          
          <div className="h-32 w-full bg-[#171717] rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden">
            {data.promoBanner ? (
              <img src={data.promoBanner} alt="Promo" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
            ) : null}
            <div className="relative z-10 flex flex-col items-center">
              <ImageIcon className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Upload Image</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
