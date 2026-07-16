"use client";

import { useState } from "react";
import { Users, Copy, CheckCircle2 } from "lucide-react";

export default function ReferBanner() {
  const [copied, setCopied] = useState(false);
  const referralCode = "SANGITA500";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-[#FF2D3B] to-[#b31420] rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-[0_20px_50px_rgba(255,45,59,0.3)] mt-12">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
        
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Refer & Earn 500 Points!</h2>
          <p className="text-white/80 text-lg max-w-md mx-auto md:mx-0">
            Invite your friends to Foodiq. You both get 500 points when they make their first successful order.
          </p>
        </div>

        <div className="w-full md:w-auto bg-black/30 backdrop-blur-md border border-white/20 p-6 rounded-3xl flex flex-col items-center">
          <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-3">Your Referral Code</p>
          
          <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl mb-6 border border-white/10">
            <span className="font-mono text-2xl font-black text-white px-4 tracking-widest">{referralCode}</span>
            <button 
              onClick={handleCopy}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                copied ? "bg-green-500 text-white" : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              {copied ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <button className="w-full bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-black text-lg transition-colors shadow-xl">
            Invite Friends Now
          </button>
        </div>

      </div>
    </div>
  );
}
