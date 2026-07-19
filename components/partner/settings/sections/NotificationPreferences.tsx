"use client";

import { Bell, Package, XCircle, Star, DollarSign, Megaphone } from "lucide-react";
import { SettingsState } from "../types";
import { motion } from "framer-motion";

interface NotificationPreferencesProps {
  data: SettingsState["notifications"];
  onChange: (data: Partial<SettingsState["notifications"]>) => void;
}

export default function NotificationPreferences({ data, onChange }: NotificationPreferencesProps) {
  
  const options = [
    { id: 'newOrders', label: 'New Orders', desc: 'Get push notifications and sounds for incoming orders.', icon: Package, color: 'text-green-500', value: data.newOrders },
    { id: 'orderCancellation', label: 'Order Cancellations', desc: 'Alerts when a customer or rider cancels an order.', icon: XCircle, color: 'text-red-500', value: data.orderCancellation },
    { id: 'customerReviews', label: 'Customer Reviews', desc: 'Receive daily summaries of new ratings and reviews.', icon: Star, color: 'text-yellow-500', value: data.customerReviews },
    { id: 'paymentAlerts', label: 'Payment & Payout Alerts', desc: 'Notifications for weekly bank settlements.', icon: DollarSign, color: 'text-blue-500', value: data.paymentAlerts },
    { id: 'marketingUpdates', label: 'Marketing & Promos', desc: 'Tips and tricks to boost your sales on Foodiq.', icon: Megaphone, color: 'text-purple-500', value: data.marketingUpdates },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-[#111827] flex items-center gap-2 mb-2">
          <Bell className="w-6 h-6 text-[#E23744]" /> Notification Preferences
        </h2>
        <p className="text-[#6B7280] text-sm mb-6">Control what alerts you receive across your devices.</p>
      </div>

      <div className="space-y-4">
        {options.map((opt) => (
          <div 
            key={opt.id}
            className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 flex items-center justify-between cursor-pointer group hover:border-[#E5E7EB] transition-colors"
            onClick={() => onChange({ [opt.id]: !opt.value })}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[#FFFFFF] border border-[#E5E7EB] group-hover:bg-[#F8FAFC] transition-colors`}>
                <opt.icon className={`w-5 h-5 ${opt.color}`} />
              </div>
              <div>
                <h4 className="text-[#111827] font-bold mb-1">{opt.label}</h4>
                <p className="text-[#6B7280] text-xs hidden md:block">{opt.desc}</p>
              </div>
            </div>
            
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${opt.value ? 'bg-[#E23744]' : 'bg-[#FFFFFF] border border-[#E5E7EB]'}`}>
              <motion.div 
                layout
                className="w-4 h-4 rounded-full bg-white shadow-md"
                animate={{ x: opt.value ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
