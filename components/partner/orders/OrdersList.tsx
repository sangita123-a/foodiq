"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Order, OrderStatus } from "./types";
import OrderCard from "./OrderCard";
import { Inbox } from "lucide-react";

interface OrdersListProps {
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
}

export default function OrdersList({ orders, onUpdateStatus, onViewDetails }: OrdersListProps) {
  
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Orders Found</h3>
        <p className="text-gray-400 max-w-md">Try adjusting your filters or wait for new orders to arrive.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {orders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onUpdateStatus={onUpdateStatus}
            onViewDetails={onViewDetails}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
