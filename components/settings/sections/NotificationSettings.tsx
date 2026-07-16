"use client";

import { motion } from "framer-motion";
import { useState, useEffect, FormEvent } from "react";
import { BellRing, Mail, MessageSquare } from "lucide-react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

function ToggleSwitch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-12 h-6 rounded-full p-1 transition-colors relative flex-shrink-0 ${checked ? "bg-primary" : "bg-[#111] border border-white/10"}`}
    >
      <motion.div
        layout
        className="w-4 h-4 bg-white rounded-full shadow-md"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default function NotificationSettings() {
  const { data, isLoading, mutate } = useSWR("/api/settings");
  const settings = data || {};
  const { showToast } = useToast();

  const [toggles, setToggles] = useState({
    orders: true,
    offers: true,
    rewards: false,
    email: true,
    sms: false,
  });

  useEffect(() => {
    if (data) {
      setToggles({
        orders: data.notify_orders ?? true,
        offers: data.notify_offers ?? true,
        rewards: data.notify_rewards ?? false,
        email: data.email_notifications ?? true,
        sms: data.push_notifications ?? false,
      });
    }
  }, [data]);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.put("/api/settings", {
        notify_orders: toggles.orders,
        notify_offers: toggles.offers,
        notify_rewards: toggles.rewards,
        email_notifications: toggles.email,
        push_notifications: toggles.sms,
      });
      showToast("Notification settings updated successfully", "success");
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update settings", "error");
    }
  };

  const toggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return <div className="text-white animate-pulse h-64 bg-white/5 rounded-3xl"></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#171717] rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl"
    >
      <h2 className="text-2xl font-bold text-white mb-8">Notification Preferences</h2>

      <form id="settings-form" onSubmit={handleSave}>
        <div className="mb-10 pb-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <BellRing className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white">Push Notifications</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold mb-1">Order Updates</h4>
                <p className="text-gray-500 text-sm">Get real-time tracking updates for active orders.</p>
              </div>
              <ToggleSwitch checked={toggles.orders} onClick={() => toggle("orders")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold mb-1">Offers & Promotions</h4>
                <p className="text-gray-500 text-sm">Receive alerts for flash sales and daily discounts.</p>
              </div>
              <ToggleSwitch checked={toggles.offers} onClick={() => toggle("offers")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold mb-1">Reward Notifications</h4>
                <p className="text-gray-500 text-sm">Know when you earn points or level up.</p>
              </div>
              <ToggleSwitch checked={toggles.rewards} onClick={() => toggle("rewards")} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-6">External Channels</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Email Newsletters</h4>
                  <p className="text-gray-500 text-sm">Weekly summaries and special event invites.</p>
                </div>
              </div>
              <ToggleSwitch checked={toggles.email} onClick={() => toggle("email")} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">SMS Notifications</h4>
                  <p className="text-gray-500 text-sm">Critical order updates only via text message.</p>
                </div>
              </div>
              <ToggleSwitch checked={toggles.sms} onClick={() => toggle("sms")} />
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
