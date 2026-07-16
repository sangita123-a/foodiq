"use client";

import { Phone, MessageSquare, Star } from "lucide-react";

type Props = {
  partner?: {
    name: string;
    vehicleDetails: string;
    rating: number;
    deliveries: number;
    phone: string;
    image?: string;
  };
};

export default function DeliveryPartnerCard({ partner }: Props) {
  if (!partner) return null;

  return (
    <div className="bg-[#171717] rounded-3xl p-6 md:p-8 border border-white/5 mb-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        
        {/* Driver Info */}
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 relative">
            <img 
              src={partner.image || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200"} 
              alt="Delivery Partner"
              className="w-full h-full object-cover"
            />
            {/* Status dot */}
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#171717]"></div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{partner.name}</h3>
            <p className="text-[#A1A1A1] text-sm mb-2">{partner.vehicleDetails}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1 text-sm">
              <span className="text-white font-bold">{partner.rating}</span>
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-gray-500 ml-1">({partner.deliveries} deliveries)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 rounded-xl font-bold transition-colors">
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3.5 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Phone className="w-4 h-4" />
            Call
          </button>
        </div>

      </div>
    </div>
  );
}
