"use client";

import { motion } from "framer-motion";
import SecuritySettings from "@/components/settings/sections/SecuritySettings";
import ConnectedDevices from "@/components/settings/sections/ConnectedDevices";

export default function SecurityPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="rounded-[24px] border border-border bg-white p-6 shadow-sm md:p-10">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Security</h2>
        <p className="mb-8 text-sm text-[#555555]">Update your password and manage account security.</p>
        <SecuritySettings />
      </div>
      <div className="rounded-[24px] border border-border bg-white p-6 shadow-sm md:p-10">
        <h3 className="mb-6 text-xl font-bold text-foreground">Connected Devices</h3>
        <ConnectedDevices />
      </div>
    </motion.div>
  );
}
