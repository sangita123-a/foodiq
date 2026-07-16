"use client";

import { MapPin } from "lucide-react";

export default function MapSection() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-20">
      <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden border border-white/5 relative bg-[#111] group">
        
        {/* Mock Map Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-700"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2074')" }}
        ></div>
        
        {/* Dark overlay to simulate dark mode maps */}
        <div className="absolute inset-0 bg-[#0B0B0B]/60 pointer-events-none"></div>

        {/* Map Marker Pin */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,45,59,0.8)]">
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 bg-[#171717] px-6 py-3 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md">
            <p className="text-white font-bold text-sm">Foodiq Headquarters</p>
          </div>
        </div>

        {/* Overlay instructions for devs */}
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg pointer-events-none">
          <p className="text-gray-400 text-xs font-mono">Map placeholder ready for Google Maps API integration.</p>
        </div>

      </div>
    </div>
  );
}
