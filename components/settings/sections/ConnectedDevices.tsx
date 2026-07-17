"use client";

import { motion } from "framer-motion";
import { Laptop, Smartphone, Trash2 } from "lucide-react";
import useSWR from "swr";
import { useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function ConnectedDevices() {
  const { data, mutate, isLoading } = useSWR("/api/sessions");
  const { showToast } = useToast();
  const sessions = data || [];

  useEffect(() => {
    api.post("/api/sessions/register").then(() => mutate()).catch(() => {});
  }, [mutate]);

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/sessions/${id}`);
      mutate();
      showToast("Device removed", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to remove device", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#F8FAFC] rounded-3xl p-6 md:p-10 border border-[#E5E7EB] shadow-2xl"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Connected Devices</h2>
        <p className="text-[#6B7280] text-sm">
          You are currently logged into Foodiq on these devices. If you don't recognize a device, remove it immediately.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-[#F8FAFC] animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Laptop className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg mb-1">This Device</h4>
                <p className="text-[#9CA3AF] text-sm">Active now</p>
              </div>
              <span className="ml-auto bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/30">
                This Device
              </span>
            </div>
          ) : (
            sessions.map((s: any) => (
              <div
                key={s.id}
                className={`bg-white border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  s.is_current ? "border-primary/20" : "border-[#E5E7EB]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      s.is_current ? "bg-primary/10" : "bg-[#F8FAFC]"
                    }`}
                  >
                    {s.device_type === "mobile" ? (
                      <Smartphone className={`w-6 h-6 ${s.is_current ? "text-primary" : "text-[#6B7280]"}`} />
                    ) : (
                      <Laptop className={`w-6 h-6 ${s.is_current ? "text-primary" : "text-[#6B7280]"}`} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">{s.device_name}</h4>
                    <p className="text-[#9CA3AF] text-sm">
                      {s.browser} on {s.os}
                    </p>
                    <p className="text-[#9CA3AF] text-sm mt-1">
                      {s.location || "Unknown"} • {new Date(s.last_active).toLocaleString()}
                    </p>
                  </div>
                </div>
                {s.is_current ? (
                  <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/30 self-start md:self-center">
                    This Device
                  </span>
                ) : (
                  <button
                    onClick={() => remove(s.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start md:self-center"
                  >
                    <Trash2 className="w-4 h-4" /> Remove Device
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
