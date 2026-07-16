"use client";

import { motion } from "framer-motion";
import { Home, Briefcase, MapPin, Edit2, Trash2, Star, CheckCircle2 } from "lucide-react";

export type AddressType = {
  id: string;
  name: string;
  phone: string;
  flat: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  type: "Home" | "Work" | "Other";
  isDefault: boolean;
};

type Props = {
  address: AddressType;
  onEdit: (address: AddressType) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
};

export default function AddressCard({ address, onEdit, onDelete, onSetDefault }: Props) {
  const fullAddress = `${address.flat}, ${address.street}, ${address.landmark ? address.landmark + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-[#171717] rounded-[24px] p-6 md:p-8 border hover:border-white/20 transition-all duration-300 relative flex flex-col h-full group shadow-lg ${
        address.isDefault ? "border-primary/50 shadow-[0_0_15px_rgba(255,45,59,0.1)]" : "border-white/5"
      }`}
    >
      {/* Top Badges */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2 bg-[#111] px-3 py-1.5 rounded-lg border border-white/10">
          {address.type === "Home" && <Home className="w-4 h-4 text-primary" />}
          {address.type === "Work" && <Briefcase className="w-4 h-4 text-blue-400" />}
          {address.type === "Other" && <MapPin className="w-4 h-4 text-green-400" />}
          <span className="text-white text-sm font-bold">{address.type}</span>
        </div>

        {address.isDefault && (
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Default
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-1">{address.name}</h3>
        <p className="text-gray-400 text-sm font-medium">{address.phone}</p>
      </div>

      {/* Address String */}
      <p className="text-gray-300 text-sm leading-relaxed mb-8 flex-1">
        {fullAddress}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/5">
        <button 
          onClick={() => onEdit(address)}
          className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-white/5 hover:border-white/10"
        >
          <Edit2 className="w-4 h-4" /> Edit
        </button>
        
        <button 
          onClick={() => onDelete(address.id)}
          className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-red-500/10 hover:border-red-500/20"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>

        {!address.isDefault && (
          <button 
            onClick={() => onSetDefault(address.id)}
            className="w-full mt-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-yellow-500/20"
          >
            <Star className="w-4 h-4" /> Set as Default
          </button>
        )}
      </div>
    </motion.div>
  );
}
