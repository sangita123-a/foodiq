"use client";

import { motion } from "framer-motion";
import { useState, useEffect, FormEvent } from "react";
import { BellRing, Mail, MessageSquare, Megaphone, Package } from "lucide-react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

function ToggleSwitch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-12 h-6 rounded-full p-1 transition-colors relative flex-shrink-0 ${checked ? "bg-primary" : "bg-white border border-border"}`}
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

type PrefToggles = {
  orders: boolean;
  offers: boolean;
  rewards: boolean;
  orderUpdates: boolean;
  email: boolean;
  sms: boolean;
  marketing: boolean;
  push: boolean;
};

export default function NotificationSettings() {
  const { data, isLoading, mutate } = useSWR("/api/settings");
  const { showToast } = useToast();

  const [toggles, setToggles] = useState<PrefToggles>({
    orders: true,
    offers: true,
    rewards: false,
    orderUpdates: true,
    email: true,
    sms: true,
    marketing: false,
    push: true,
  });

  useEffect(() => {
    if (data) {
      setToggles({
        orders: data.notify_orders ?? true,
        offers: data.notify_offers ?? true,
        rewards: data.notify_rewards ?? false,
        orderUpdates: data.notify_order_updates ?? true,
        email: data.email_notifications ?? true,
        sms: data.sms_notifications ?? true,
        marketing: data.marketing_emails ?? false,
        push: data.push_notifications ?? true,
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
        notify_order_updates: toggles.orderUpdates,
        email_notifications: toggles.email,
        sms_notifications: toggles.sms,
        marketing_emails: toggles.marketing,
        push_notifications: toggles.push,
      });
      showToast("Notification settings updated successfully", "success");
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update settings", "error");
    }
  };

  const toggle = (key: keyof PrefToggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return <div className="text-foreground animate-pulse h-64 bg-section rounded-3xl"></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-section rounded-3xl p-6 md:p-10 border border-border shadow-2xl"
    >
      <h2 className="text-2xl font-bold text-foreground mb-2">Notification Preferences</h2>
      <p className="text-sm text-gray-text mb-8">
        Control email, SMS, push, and marketing messages. Transactional security emails (OTP, password reset) always send.
      </p>

      <form id="settings-form" onSubmit={handleSave}>
        <div className="mb-10 pb-8 border-b border-border">
          <div className="flex items-center gap-3 mb-6">
            <BellRing className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">In-app &amp; Push</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-foreground font-bold mb-1">Push Notifications</h4>
                <p className="text-[#9CA3AF] text-sm">Browser and device push alerts.</p>
              </div>
              <ToggleSwitch checked={toggles.push} onClick={() => toggle("push")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-foreground font-bold mb-1">Order Updates</h4>
                <p className="text-[#9CA3AF] text-sm">Tracking, delivery, and status changes.</p>
              </div>
              <ToggleSwitch checked={toggles.orderUpdates} onClick={() => toggle("orderUpdates")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-foreground font-bold mb-1">Order Alerts</h4>
                <p className="text-[#9CA3AF] text-sm">New orders and confirmation summaries.</p>
              </div>
              <ToggleSwitch checked={toggles.orders} onClick={() => toggle("orders")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-foreground font-bold mb-1">Offers &amp; Promotions</h4>
                <p className="text-[#9CA3AF] text-sm">Flash sales and daily discounts (in-app).</p>
              </div>
              <ToggleSwitch checked={toggles.offers} onClick={() => toggle("offers")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-foreground font-bold mb-1">Reward Notifications</h4>
                <p className="text-[#9CA3AF] text-sm">Points and loyalty updates.</p>
              </div>
              <ToggleSwitch checked={toggles.rewards} onClick={() => toggle("rewards")} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-6">Email &amp; SMS</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-border">
                  <Mail className="w-5 h-5 text-gray-text" />
                </div>
                <div>
                  <h4 className="text-foreground font-bold mb-1">Email Notifications</h4>
                  <p className="text-[#9CA3AF] text-sm">Order, payment, and account emails.</p>
                </div>
              </div>
              <ToggleSwitch checked={toggles.email} onClick={() => toggle("email")} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-border">
                  <MessageSquare className="w-5 h-5 text-gray-text" />
                </div>
                <div>
                  <h4 className="text-foreground font-bold mb-1">SMS Notifications</h4>
                  <p className="text-[#9CA3AF] text-sm">OTP and critical order updates by text.</p>
                </div>
              </div>
              <ToggleSwitch checked={toggles.sms} onClick={() => toggle("sms")} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-border">
                  <Megaphone className="w-5 h-5 text-gray-text" />
                </div>
                <div>
                  <h4 className="text-foreground font-bold mb-1">Marketing Emails</h4>
                  <p className="text-[#9CA3AF] text-sm">Promotional campaigns and newsletters.</p>
                </div>
              </div>
              <ToggleSwitch checked={toggles.marketing} onClick={() => toggle("marketing")} />
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-border">
              <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-text">
                PDF invoices are emailed after successful payment when email notifications are on.
                You can also download invoices from Payment Methods.
              </p>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
