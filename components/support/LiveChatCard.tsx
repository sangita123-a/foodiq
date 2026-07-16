"use client";

import { MessageSquareText, Zap } from "lucide-react";

export default function LiveChatCard() {
  return (
    <div className="bg-[#171717] rounded-3xl p-6 md:p-8 border border-white/5 relative overflow-hidden h-full flex flex-col justify-between">
      
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[50px] pointer-events-none"></div>

      <div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Online</span>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Live Chat Support</h3>
        <p className="text-gray-400 text-sm mb-6 relative z-10 leading-relaxed">
          Get instant help from our support agents for urgent issues regarding active orders.
        </p>

        <div className="flex items-center gap-3 bg-[#111] p-4 rounded-2xl border border-white/5 mb-8 relative z-10">
          <Zap className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-0.5">Avg Response Time</p>
            <p className="text-white font-black">Under 2 Minutes</p>
          </div>
        </div>
      </div>

      <button className="w-full bg-primary hover:bg-[#e02633] text-white px-6 py-4 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(255,45,59,0.3)] hover:-translate-y-1 relative z-10 flex items-center justify-center gap-2">
        <MessageSquareText className="w-5 h-5" />
        Start Live Chat
      </button>

    </div>
  );
}
