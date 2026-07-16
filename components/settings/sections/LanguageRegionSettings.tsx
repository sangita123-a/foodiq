"use client";

import { motion } from "framer-motion";
import { Globe, MapPin, DollarSign, Clock } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function LanguageRegionSettings() {
  const { data, mutate, isLoading } = useSWR("/api/settings");
  const { showToast } = useToast();
  const [form, setForm] = useState({
    language: "en",
    country: "in",
    currency: "inr",
    timezone: "ist",
  });

  useEffect(() => {
    if (data) {
      setForm({
        language: data.language || "en",
        country: data.country || "in",
        currency: data.currency || "inr",
        timezone: data.timezone || "ist",
      });
    }
  }, [data]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/api/settings", form);
      mutate();
      showToast("Language & region saved", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-white/5 animate-pulse rounded-3xl" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#171717] rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl"
    >
      <h2 className="text-2xl font-bold text-white mb-8">Language & Region</h2>

      <form id="settings-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-gray-400" />
            <h3 className="text-white font-bold">Language</h3>
          </div>
          <select
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="en">English (US)</option>
            <option value="en-gb">English (UK)</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h3 className="text-white font-bold">Country / Region</h3>
          </div>
          <select
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="in">India</option>
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="ca">Canada</option>
            <option value="au">Australia</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <h3 className="text-white font-bold">Currency</h3>
          </div>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="inr">INR (₹)</option>
            <option value="usd">USD ($)</option>
            <option value="eur">EUR (€)</option>
            <option value="gbp">GBP (£)</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="text-white font-bold">Timezone</h3>
          </div>
          <select
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="ist">(UTC+05:30) Indian Standard Time</option>
            <option value="pst">(UTC-08:00) Pacific Time</option>
            <option value="est">(UTC-05:00) Eastern Time</option>
            <option value="gmt">(UTC+00:00) Greenwich Mean Time</option>
          </select>
        </div>
      </form>
    </motion.div>
  );
}
