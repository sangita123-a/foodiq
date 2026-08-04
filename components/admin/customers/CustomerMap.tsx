"use client";

import { MapPin, Navigation } from "lucide-react";
import type { SavedAddress } from "@/services/customerAdminApi";

type Props = {
  addresses: SavedAddress[];
  selectedAddressId?: string;
  onSelectAddress?: (address: SavedAddress) => void;
};

export default function CustomerMap({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: Props) {
  const activeAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#E23744]" />
          <h4 className="font-bold text-gray-900 text-sm">Saved Delivery Map</h4>
        </div>
        {activeAddress && (
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {activeAddress.label} • {activeAddress.city}
          </span>
        )}
      </div>

      {/* Embedded Map Representation */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
        {/* Map Grid Pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        {/* Location Pins */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-6 text-center">
          {activeAddress ? (
            <div className="space-y-3 max-w-xs animate-in zoom-in-95">
              <div className="relative inline-block">
                <div className="w-12 h-12 rounded-full bg-[#E23744]/20 border-2 border-[#E23744] flex items-center justify-center mx-auto animate-ping absolute inset-0" />
                <div className="w-12 h-12 rounded-full bg-[#E23744] text-white flex items-center justify-center mx-auto shadow-lg relative z-10">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
              <div>
                <div className="text-white font-bold text-sm">{activeAddress.addressLine1}</div>
                <div className="text-slate-300 text-xs mt-0.5">
                  {activeAddress.city}, {activeAddress.state} - {activeAddress.pincode}
                </div>
                <div className="text-slate-400 text-[10px] font-mono mt-1">
                  Lat: {activeAddress.latitude.toFixed(4)}, Lng: {activeAddress.longitude.toFixed(4)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-xs">No addresses saved for this customer</div>
          )}
        </div>

        {/* Top-right Navigation Control Pill */}
        <div className="absolute top-3 right-3 bg-slate-800/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700">
          <Navigation className="w-3.5 h-3.5 text-[#E23744]" />
          <span>Interactive Map Preview</span>
        </div>
      </div>

      {/* Address Switcher Chips */}
      {addresses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {addresses.map((addr) => {
            const isSelected = activeAddress?.id === addr.id;
            return (
              <button
                key={addr.id}
                onClick={() => onSelectAddress?.(addr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-red-50 border-[#E23744] text-[#E23744]"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {addr.label} {addr.isDefault && "(Default)"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
