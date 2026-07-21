"use client";

import { CheckCircle2, Clock, MapPin, Store } from "lucide-react";

type Props = {
  orderId: string;
  restaurantName: string;
  eta: string;
  address: string;
};

export default function TrackingHeader({ orderId, restaurantName, eta, address }: Props) {
  return (
    <div className="bg-section rounded-3xl p-6 md:p-8 border border-border mb-8 text-center md:text-left relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
        
        {/* Title Section */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex flex-col md:flex-row items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            Your Order is on the Way
          </h1>
          <p className="text-[#A1A1A1] text-lg">
            Sit back and relax while we prepare your delicious meal.
          </p>
        </div>

        {/* Details Section */}
        <div className="flex flex-wrap justify-center md:justify-end gap-4 text-sm">
          <div className="bg-white px-4 py-3 rounded-xl border border-border flex flex-col items-center md:items-start min-w-[120px]">
            <span className="text-[#9CA3AF] font-medium mb-1">Order ID</span>
            <span className="text-white font-bold">{orderId}</span>
          </div>
          <div className="bg-white px-4 py-3 rounded-xl border border-border flex flex-col items-center md:items-start min-w-[120px]">
            <span className="text-[#9CA3AF] font-medium mb-1 flex items-center gap-1"><Store className="w-3.5 h-3.5"/> Restaurant</span>
            <span className="text-white font-bold">{restaurantName}</span>
          </div>
          <div className="bg-white px-4 py-3 rounded-xl border border-border flex flex-col items-center md:items-start min-w-[120px]">
            <span className="text-[#9CA3AF] font-medium mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> ETA</span>
            <span className="text-green-400 font-bold">{eta}</span>
          </div>
          <div className="bg-white px-4 py-3 rounded-xl border border-border flex flex-col items-center md:items-start min-w-[120px]">
            <span className="text-[#9CA3AF] font-medium mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> Delivery to</span>
            <span className="text-white font-bold">{address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
