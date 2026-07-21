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
      className={`group relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-[0_8px_24px_rgba(28,28,28,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_14px_32px_rgba(28,28,28,0.10)] md:p-8 ${
        address.isDefault ? "border-primary/50 shadow-[0_10px_26px_rgba(226, 55, 68,0.10)]" : "border-border"
      }`}
    >
      {/* Top Badges */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-[#F8F9FA] px-3 py-1.5">
          {address.type === "Home" && <Home className="w-4 h-4 text-primary" />}
          {address.type === "Work" && <Briefcase className="w-4 h-4 text-blue-400" />}
          {address.type === "Other" && <MapPin className="w-4 h-4 text-green-400" />}
          <span className="text-sm font-bold text-foreground">{address.type}</span>
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
        <h3 className="mb-1 text-xl font-bold text-foreground">{address.name}</h3>
        <p className="text-sm font-medium text-muted">{address.phone}</p>
      </div>

      {/* Address String */}
      <p className="mb-8 flex-1 text-sm leading-relaxed text-muted">
        {fullAddress}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <button 
          onClick={() => onEdit(address)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-[#F8F9FA] px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-primary/30 hover:bg-white"
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
