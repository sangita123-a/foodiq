"use client";

import { useState } from "react";
import { Store, Upload, Image as ImageIcon } from "lucide-react";
import { SettingsState } from "../types";

interface RestaurantProfileProps {
  data: SettingsState["profile"];
  onChange: (data: Partial<SettingsState["profile"]>) => void;
}

export default function RestaurantProfile({ data, onChange }: RestaurantProfileProps) {
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-2">
          <Store className="w-6 h-6 text-primary" /> Restaurant Profile
        </h2>
        <p className="text-gray-400 text-sm mb-6">Manage your public restaurant identity.</p>
      </div>

      {/* Image Uploads */}
      <div className="space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cover Image</label>
          <div className="h-48 w-full bg-[#111] rounded-3xl border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group relative overflow-hidden">
            {data.cover ? (
              <img src={data.cover} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
            ) : null}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#171717] border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">Upload Cover Photo</span>
              <span className="text-xs mt-1">1200 x 400px recommended</span>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-3xl bg-[#111] border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group relative overflow-hidden shrink-0">
            {data.logo ? (
              <img src={data.logo} alt="Logo" className="absolute inset-0 w-full h-full object-cover" />
            ) : null}
            {!data.logo && (
              <div className="flex flex-col items-center">
                <Upload className="w-6 h-6 mb-2 group-hover:text-primary transition-colors" />
                <span className="text-xs font-bold group-hover:text-primary transition-colors">Logo</span>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-white font-bold mb-1">Restaurant Logo</h4>
            <p className="text-gray-400 text-sm mb-3">Upload a square image, ideally 500x500px.</p>
            <button className="px-4 py-2 bg-[#111] hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold transition-colors">
              Browse Image
            </button>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-white/5"></div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Restaurant Name</label>
          <input 
            type="text" 
            value={data.restaurantName}
            onChange={(e) => onChange({ restaurantName: e.target.value })}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Owner Name</label>
          <input 
            type="text" 
            value={data.ownerName}
            onChange={(e) => onChange({ ownerName: e.target.value })}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
          <input 
            type="email" 
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
          <input 
            type="tel" 
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cuisine Type</label>
          <input 
            type="text" 
            value={data.cuisineType}
            onChange={(e) => onChange({ cuisineType: e.target.value })}
            placeholder="e.g. North Indian, Chinese, Fast Food"
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Restaurant Description</label>
          <textarea 
            rows={4}
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm resize-none custom-scrollbar"
          />
        </div>
      </div>
    </div>
  );
}
