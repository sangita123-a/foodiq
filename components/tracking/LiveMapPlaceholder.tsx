"use client";

import { MapPin, Navigation, Store } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveMapPlaceholder() {
  return (
    <div className="bg-white rounded-3xl h-[300px] md:h-[400px] w-full border border-[#E5E7EB] relative overflow-hidden flex items-center justify-center mb-8">
      
      {/* Base Grid Background mimicking a map */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Radar Sweep Effect */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute w-[600px] h-[600px] rounded-full border border-[#FC8019]/10 border-t-[#FC8019]/40 border-r-transparent border-b-transparent border-l-transparent"
      ></motion.div>
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute w-[400px] h-[400px] rounded-full border border-[#FC8019]/10 border-t-transparent border-r-[#FC8019]/30 border-b-transparent border-l-transparent"
      ></motion.div>

      {/* Connection Line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <path d="M 20% 70% Q 50% 20% 80% 50%" fill="transparent" stroke="#FC8019" strokeWidth="4" strokeDasharray="10, 10" />
      </svg>

      {/* Restaurant Marker (Bottom Left) */}
      <div className="absolute left-[20%] top-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="bg-[#F8FAFC] p-2 rounded-full border border-[#E5E7EB] shadow-lg relative z-10">
          <Store className="w-5 h-5 text-[#6B7280]" />
        </div>
        <span className="text-[10px] font-bold text-[#6B7280] mt-1 uppercase tracking-wider">Restaurant</span>
      </div>

      {/* Delivery Marker (Middle - moving) */}
      <motion.div 
        animate={{ x: [0, 20, 0, -20, 0], y: [0, -10, 0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[50%] top-[40%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      >
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] relative z-10 border-4 border-[#F8FAFC]">
          <Navigation className="w-5 h-5 text-black fill-black -rotate-45" />
        </div>
        <span className="text-[10px] font-bold text-white mt-1 uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">Driver</span>
        {/* Pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#F8FAFC] rounded-full animate-ping -z-10"></div>
      </motion.div>

      {/* Destination Marker (Top Right) */}
      <div className="absolute left-[80%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="bg-[#FC8019] p-2.5 rounded-full shadow-[0_0_20px_rgba(252,128,25,0.5)] relative z-10 text-white border-2 border-[#F8FAFC]">
          <MapPin className="w-5 h-5 fill-white/20" />
        </div>
        <span className="text-[10px] font-bold text-[#FC8019] mt-1 uppercase tracking-wider">Home</span>
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
        Live Map Placeholder
      </div>

    </div>
  );
}
