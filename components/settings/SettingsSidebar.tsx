"use client";

import { User, Shield, Bell, Globe, Palette, Lock, Smartphone, Trash2 } from "lucide-react";

export type SettingsSection = 
  | "Profile Settings" 
  | "Security" 
  | "Notification Preferences" 
  | "Language & Region" 
  | "Appearance" 
  | "Privacy" 
  | "Connected Devices" 
  | "Delete Account";

type Props = {
  activeSection: SettingsSection;
  setActiveSection: (section: SettingsSection) => void;
};

export const SETTINGS_SECTIONS: { id: SettingsSection, icon: any }[] = [
  { id: "Profile Settings", icon: User },
  { id: "Security", icon: Shield },
  { id: "Notification Preferences", icon: Bell },
  { id: "Language & Region", icon: Globe },
  { id: "Appearance", icon: Palette },
  { id: "Privacy", icon: Lock },
  { id: "Connected Devices", icon: Smartphone },
  { id: "Delete Account", icon: Trash2 },
];

export default function SettingsSidebar({ activeSection, setActiveSection }: Props) {
  return (
    <div className="w-full lg:w-[280px] flex-shrink-0">
      <div className="sticky top-[100px] bg-[#111] border border-white/5 rounded-3xl p-4 md:p-6 overflow-x-auto lg:overflow-visible flex lg:flex-col gap-2 custom-scrollbar-hide">
        
        {SETTINGS_SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          const isDanger = section.id === "Delete Account";
          
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm whitespace-nowrap lg:whitespace-normal ${
                isActive 
                  ? isDanger 
                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                    : "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(255,45,59,0.1)]"
                  : isDanger 
                    ? "text-red-400 hover:bg-red-500/5 hover:text-red-300 border border-transparent"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <section.icon className={`w-5 h-5 flex-shrink-0 ${isActive && isDanger ? 'animate-pulse' : ''}`} />
              {section.id}
            </button>
          );
        })}

      </div>
    </div>
  );
}
