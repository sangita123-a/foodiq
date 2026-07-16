"use client";

import { motion } from "framer-motion";
import { Order, OrderStatus } from "./types";
import { MapPin, Phone, CheckCircle2, XCircle, ChefHat, PackageCheck, Bike, AlertTriangle, Eye } from "lucide-react";

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
  isCompact?: boolean; // For Kanban view
}

export default function OrderCard({ order, onUpdateStatus, onViewDetails, isCompact = false }: OrderCardProps) {
  
  const statusColors = {
    "New": "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    "Accepted": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Preparing": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Ready for Pickup": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Picked Up": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Delivered": "bg-green-500/20 text-green-400 border-green-500/30",
    "Rejected": "bg-red-500/20 text-red-400 border-red-500/30"
  };

  // Simulate priority alert logic (hardcoded to true for demo purposes on "New" orders)
  const isWaitingLong = order.status === "New"; 

  const renderActionButtons = () => {
    switch (order.status) {
      case "New":
        return (
          <div className="flex gap-2 w-full mt-4">
            <button onClick={() => onUpdateStatus(order.id, "Accepted")} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-4 h-4" /> Accept
            </button>
            <button onClick={() => onUpdateStatus(order.id, "Rejected")} className="flex-1 bg-white/5 hover:bg-white/10 text-red-400 border border-white/10 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        );
      case "Accepted":
        return (
          <button onClick={() => onUpdateStatus(order.id, "Preparing")} className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 shadow-lg shadow-orange-500/20">
            <ChefHat className="w-4 h-4" /> Start Preparing
          </button>
        );
      case "Preparing":
        return (
          <button onClick={() => onUpdateStatus(order.id, "Ready for Pickup")} className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 shadow-lg shadow-purple-500/20">
            <PackageCheck className="w-4 h-4" /> Mark Ready
          </button>
        );
      case "Ready for Pickup":
        return (
          <button onClick={() => onUpdateStatus(order.id, "Picked Up")} className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 shadow-lg shadow-indigo-500/20">
            <Bike className="w-4 h-4" /> Handover to Rider
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-[#171717] border rounded-2xl p-5 shadow-xl relative overflow-hidden group transition-colors ${
        isWaitingLong ? 'border-red-500/50 hover:border-red-500/80' : 'border-white/5 hover:border-white/10'
      }`}
    >
      {/* Priority Pulse */}
      {isWaitingLong && (
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse"></div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-black text-white text-lg">{order.id}</span>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${statusColors[order.status]}`}>
              {order.status}
            </span>
          </div>
          <p className="text-gray-400 text-xs font-bold">{order.orderTime}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-white">₹{order.grandTotal}</p>
          <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${order.paymentStatus === 'Paid' ? 'text-green-400' : 'text-orange-400'}`}>
            {order.paymentStatus} ({order.paymentMethod})
          </p>
        </div>
      </div>

      {isWaitingLong && !isCompact && (
        <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 text-xs font-bold px-3 py-2 rounded-lg mb-4 border border-red-500/20">
          <AlertTriangle className="w-4 h-4" /> 
          Priority: Order waiting for 12 mins
        </div>
      )}

      {/* Customer Info (Hidden in compact mode) */}
      {!isCompact && (
        <div className="bg-[#111] rounded-xl p-3 mb-4 border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            {order.customerName}
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Phone className="w-3.5 h-3.5 text-gray-500" /> {order.customerPhone}
          </div>
          <div className="flex items-start gap-2 text-gray-400 text-xs leading-relaxed">
            <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" /> 
            <span className="line-clamp-2">{order.deliveryAddress}</span>
          </div>
        </div>
      )}

      {/* Items Summary */}
      <div className="space-y-1.5 mb-4">
        {order.items.slice(0, 2).map(item => (
          <div key={item.id} className="flex items-start justify-between text-sm">
            <div className="flex gap-2">
              <span className="text-primary font-black">{item.quantity}x</span>
              <span className="text-gray-300 font-medium truncate max-w-[180px]">{item.name}</span>
            </div>
          </div>
        ))}
        {order.items.length > 2 && (
          <p className="text-xs text-gray-500 font-bold mt-1">+{order.items.length - 2} more items</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <button onClick={() => onViewDetails(order)} className="text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> View Details
        </button>
      </div>

      {renderActionButtons()}

    </motion.div>
  );
}
