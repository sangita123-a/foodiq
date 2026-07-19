"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Order, OrderStatus } from "./types";
import OrderCard from "./OrderCard";
import { Bell, ChefHat, PackageCheck, Bike } from "lucide-react";

interface OrdersKanbanProps {
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
}

export default function OrdersKanban({ orders, onUpdateStatus, onViewDetails }: OrdersKanbanProps) {
  
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  const columns: { id: OrderStatus; title: string; icon: any; color: string }[] = [
    { id: "New", title: "New Orders", icon: Bell, color: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5" },
    { id: "Preparing", title: "Preparing", icon: ChefHat, color: "text-[#E23744] border-[#E23744]/20 bg-[#E23744]/5" },
    { id: "Ready for Pickup", title: "Ready", icon: PackageCheck, color: "text-purple-400 border-purple-400/20 bg-purple-400/5" },
    { id: "Picked Up", title: "Picked Up", icon: Bike, color: "text-indigo-400 border-indigo-400/20 bg-indigo-400/5" }
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedOrderId(id);
    // Required for Firefox
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    if (draggedOrderId) {
      onUpdateStatus(draggedOrderId, targetStatus);
    }
    setDraggedOrderId(null);
  };

  return (
    <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-6 min-h-[600px] h-full">
      {columns.map(column => {
        
        // Include "Accepted" orders in the Preparing column for the Kanban view
        const columnOrders = orders.filter(o => {
          if (column.id === "Preparing" && o.status === "Accepted") return true;
          return o.status === column.id;
        });

        return (
          <div 
            key={column.id} 
            className="flex-shrink-0 w-80 bg-[#FFFFFF] rounded-3xl border border-[#E5E7EB] flex flex-col overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className={`p-4 border-b flex items-center justify-between ${column.color}`}>
              <div className="flex items-center gap-2 font-bold">
                <column.icon className="w-5 h-5" />
                {column.title}
              </div>
              <span className="bg-black/40 px-2 py-0.5 rounded-md text-xs font-black">{columnOrders.length}</span>
            </div>

            {/* Column Dropzone */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
              <AnimatePresence mode="popLayout">
                {columnOrders.map((order) => (
                  <motion.div
                    layout
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, order.id)}
                    className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <OrderCard 
                      order={order} 
                      onUpdateStatus={onUpdateStatus}
                      onViewDetails={onViewDetails}
                      isCompact={true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {columnOrders.length === 0 && (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-[#E5E7EB] rounded-xl text-[#9CA3AF]">
                  <span className="text-sm font-bold">Drop here</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
