"use client";

import { motion } from "framer-motion";
import { Bike, Tag, CreditCard, User, CheckCircle2, Trash2, ChevronRight, Bell } from "lucide-react";
import { NotificationFilter } from "./NotificationsHeader";

export type NotificationType = {
  id: string;
  type: NotificationFilter;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  timeGroup: "Today" | "Yesterday" | "This Week" | "Earlier";
};

type Props = {
  notification: NotificationType;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function NotificationCard({ notification, onMarkAsRead, onDelete }: Props) {
  
  // Dynamic Icon Selection
  const getIcon = () => {
    switch (notification.type) {
      case "Orders": return <Bike className="w-5 h-5 text-blue-400" />;
      case "Offers": return <Tag className="w-5 h-5 text-yellow-400" />;
      case "Payments": return <CreditCard className="w-5 h-5 text-green-400" />;
      case "Account": return <User className="w-5 h-5 text-purple-400" />;
      default: return <Bell className="w-5 h-5 text-gray-text" />;
    }
  };

  const getIconBg = () => {
    switch (notification.type) {
      case "Orders": return "bg-blue-500/10 border-blue-500/20";
      case "Offers": return "bg-yellow-500/10 border-yellow-500/20";
      case "Payments": return "bg-green-500/10 border-green-500/20";
      case "Account": return "bg-purple-500/10 border-purple-500/20";
      default: return "bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`relative bg-section rounded-2xl p-5 md:p-6 border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:bg-section group ${
        !notification.isRead 
          ? "border-l-4 border-l-primary border-y-white/5 border-r-white/5 shadow-lg" 
          : "border-l-4 border-l-transparent border-y-white/5 border-r-white/5 opacity-80"
      }`}
    >
      
      {/* Content */}
      <div className="flex items-start gap-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${getIconBg()}`}>
          {getIcon()}
        </div>
        
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className={`text-lg font-bold ${!notification.isRead ? "text-foreground" : "text-gray-text"}`}>
              {notification.title}
            </h3>
            {!notification.isRead && (
              <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(226, 55, 68,0.8)]"></span>
            )}
          </div>
          <p className="text-gray-text text-sm leading-relaxed mb-2 max-w-2xl">
            {notification.description}
          </p>
          <span className="text-xs font-bold text-[#9CA3AF] tracking-wider">
            {notification.time}
          </span>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-end md:self-center bg-section/80 backdrop-blur-sm p-1 rounded-xl">
        
        {!notification.isRead && (
          <button 
            onClick={() => onMarkAsRead(notification.id)}
            className="p-2 bg-section hover:bg-green-500/20 text-gray-text hover:text-green-400 rounded-lg transition-colors"
            title="Mark as Read"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        )}

        <button 
          onClick={() => onDelete(notification.id)}
          className="p-2 bg-section hover:bg-red-500/20 text-gray-text hover:text-red-400 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <button 
          className="p-2 bg-section hover:bg-section text-gray-text hover:text-foreground rounded-lg transition-colors"
          title="Open Details"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

      </div>
    </motion.div>
  );
}
