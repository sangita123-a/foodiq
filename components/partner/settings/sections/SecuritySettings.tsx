"use client";

import { Shield, Key, Smartphone, Laptop, LogOut, AlertTriangle } from "lucide-react";
import { SettingsState } from "../types";
import { motion } from "framer-motion";

interface SecuritySettingsProps {
  data: SettingsState["security"];
  onChange: (data: Partial<SettingsState["security"]>) => void;
}

export default function SecuritySettings({ data, onChange }: SecuritySettingsProps) {
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-primary" /> Security Settings
        </h2>
        <p className="text-gray-text text-sm mb-6">Protect your account and manage active sessions.</p>
      </div>

      {/* Password Management */}
      <div className="bg-section border border-border rounded-3xl p-6">
        <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-400" /> Change Password
        </h3>
        
        <div className="space-y-4 max-w-md">
          <div>
            <input 
              type="password" 
              placeholder="Current Password"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="New Password"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Confirm New Password"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <button className="px-6 py-2.5 bg-background hover:bg-section border border-border text-foreground rounded-xl text-sm font-bold transition-colors">
            Update Password
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-section border border-border rounded-3xl p-6 flex items-center justify-between cursor-pointer group hover:border-border transition-colors" onClick={() => onChange({ twoFactorAuth: !data.twoFactorAuth })}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1 transition-colors ${data.twoFactorAuth ? 'bg-green-500/20 border border-green-500/30' : 'bg-background border border-border'}`}>
            <Smartphone className={`w-5 h-5 ${data.twoFactorAuth ? 'text-green-500' : 'text-[#9CA3AF]'}`} />
          </div>
          <div>
            <h4 className="text-foreground font-bold mb-1">Two-Factor Authentication (2FA)</h4>
            <p className="text-gray-text text-sm leading-relaxed max-w-xl">
              Add an extra layer of security to your account. We'll ask for a code from your mobile device every time you sign in.
            </p>
          </div>
        </div>
        
        <div className={`w-12 h-6 rounded-full p-1 shrink-0 transition-colors ${data.twoFactorAuth ? 'bg-green-500' : 'bg-background border border-border'}`}>
          <motion.div 
            layout
            className="w-4 h-4 rounded-full bg-white shadow-md"
            animate={{ x: data.twoFactorAuth ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-section border border-border rounded-3xl p-6">
        <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
          <Laptop className="w-4 h-4 text-purple-400" /> Active Sessions
        </h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-primary/20">
            <div className="flex items-center gap-4">
              <Laptop className="w-5 h-5 text-gray-text" />
              <div>
                <p className="text-sm font-bold text-foreground">Windows PC • Chrome</p>
                <p className="text-xs text-primary font-bold">Active Now</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
            <div className="flex items-center gap-4">
              <Smartphone className="w-5 h-5 text-gray-text" />
              <div>
                <p className="text-sm font-bold text-gray-text">iPhone 14 Pro • Safari</p>
                <p className="text-xs text-[#9CA3AF]">Last active 2 hours ago</p>
              </div>
            </div>
            <button className="text-xs font-bold text-gray-text hover:text-foreground transition-colors">Log Out</button>
          </div>
        </div>

        <button className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl font-bold transition-colors w-full md:w-auto justify-center">
          <LogOut className="w-4 h-4" /> Logout from All Devices
        </button>
      </div>

    </div>
  );
}
