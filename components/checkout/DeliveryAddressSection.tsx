"use client";

import Link from "next/link";
import { MapPin, Home, Briefcase, Plus, CheckCircle2 } from "lucide-react";

export type Address = {
  id: string;
  type: "Home" | "Work" | "Other";
  address: string;
  details: string;
};



type Props = {
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function DeliveryAddressSection({ addresses, selectedId, onSelect }: Props) {
  return (
    <div className="bg-[#171717] rounded-2xl p-6 border border-white/5 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Delivery Address
        </h3>
        <Link
          href="/saved-addresses"
          className="text-primary font-bold text-sm hover:text-white transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add New
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const isSelected = selectedId === addr.id;
          return (
            <div 
              key={addr.id}
              onClick={() => onSelect(addr.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 relative ${
                isSelected 
                ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(255,45,59,0.15)]' 
                : 'border-white/10 bg-[#111] hover:border-white/30'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-2 text-white font-bold">
                {addr.type === "Home" ? <Home className="w-4 h-4 text-gray-400" /> : <Briefcase className="w-4 h-4 text-gray-400" />}
                {addr.type}
              </div>
              <p className="text-sm text-gray-300 mb-1">{addr.address}</p>
              <p className="text-xs text-gray-500">{addr.details}</p>
              
              <div className="mt-4 flex gap-3 text-xs font-bold text-gray-400">
                <button className="hover:text-primary transition-colors">EDIT</button>
                <button className="hover:text-primary transition-colors">DELETE</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
