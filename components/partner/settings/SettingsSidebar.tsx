"use client";

import { motion } from "framer-motion";
import { Store, MapPin, Clock, Bike, CreditCard, FileText, Bell, Shield, Palette } from "lucide-react";

export type SettingsTab = 
  | "profile" 
  | "address" 
  | "hours" 
  | "delivery" 
  | "bank" 
  | "tax" 
  | "notifications" 
  | "security" 
  | "branding";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

export default function SettingsSidebar({ activeTab, setActiveTab }: SettingsSidebarProps) {
  
  const tabs = [
    { id: "profile" as SettingsTab, label: "Restaurant Profile", icon: Store },
    { id: "address" as SettingsTab, label: "Business Address", icon: MapPin },
    { id: "hours" as SettingsTab, label: "Working Hours", icon: Clock },
    { id: "delivery" as SettingsTab, label: "Delivery Settings", icon: Bike },
    { id: "bank" as SettingsTab, label: "Bank & Payout Details", icon: CreditCard },
    { id: "tax" as SettingsTab, label: "Tax Information", icon: FileText },
    { id: "notifications" as SettingsTab, label: "Notification Preferences", icon: Bell },
    { id: "security" as SettingsTab, label: "Security", icon: Shield },
    { id: "branding" as SettingsTab, label: "Branding", icon: Palette },
  ];

  return (
    <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E7EB] shadow-xl overflow-hidden flex flex-col md:w-64 shrink-0">
      <div className="p-4 hidden md:block border-b border-[#E5E7EB] bg-[#F8FAFC]">
        <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Categories</span>
      </div>
      
      <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible custom-scrollbar p-2 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative text-left whitespace-nowrap md:whitespace-normal ${isActive ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]'}`}
            >
              {isActive && (
                <motion.div 
                  layoutId="settings-sidebar-active"
                  className="absolute inset-0 bg-[#FC8019]/10 border border-[#FC8019]/20 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <tab.icon className={`w-5 h-5 shrink-0 z-10 ${isActive ? 'text-[#FC8019]' : ''}`} />
              <span className={`text-sm font-bold z-10 ${isActive ? '' : 'font-medium'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
