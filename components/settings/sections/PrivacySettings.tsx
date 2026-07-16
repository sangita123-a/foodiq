"use client";

import { motion } from "framer-motion";
import { EyeOff, Database, Download } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function PrivacySettings() {
  const { data, mutate } = useSWR("/api/settings");
  const { data: profile } = useSWR("/api/profile");
  const { showToast } = useToast();
  const [hideProfile, setHideProfile] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);

  useEffect(() => {
    if (data) {
      setHideProfile(!!data.hide_profile);
      setDataSharing(data.data_sharing ?? true);
    }
  }, [data]);

  const savePrivacy = async (next: { hide_profile?: boolean; data_sharing?: boolean }) => {
    try {
      await api.put("/api/settings", next);
      mutate();
      showToast("Privacy settings saved", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    }
  };

  const downloadData = () => {
    const blob = new Blob(
      [JSON.stringify({ profile, settings: data }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "foodiq-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data download started", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#171717] rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl"
    >
      <h2 className="text-2xl font-bold text-white mb-8">Privacy Settings</h2>

      <form
        id="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          savePrivacy({ hide_profile: hideProfile, data_sharing: dataSharing });
        }}
      >
        <div className="mb-10 pb-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <EyeOff className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-white">Hide Profile from Search</h3>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              If enabled, your profile will not appear in public searches or friend recommendations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !hideProfile;
              setHideProfile(next);
              savePrivacy({ hide_profile: next });
            }}
            className={`w-14 h-8 rounded-full p-1 transition-colors relative flex-shrink-0 ${hideProfile ? "bg-primary" : "bg-[#111] border border-white/10"}`}
          >
            <motion.div
              layout
              className="w-6 h-6 bg-white rounded-full shadow-md"
              animate={{ x: hideProfile ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        <div className="mb-10 pb-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Manage Data Sharing</h3>
          </div>
          <p className="text-gray-400 text-sm max-w-md mb-6">
            Control how your data is shared with our restaurant partners for targeted offers and analytics.
          </p>
          <button
            type="button"
            onClick={() => {
              const next = !dataSharing;
              setDataSharing(next);
              savePrivacy({ data_sharing: next });
            }}
            className="bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
          >
            {dataSharing ? "Disable Data Sharing" : "Enable Data Sharing"}
          </button>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <Download className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-white">Download My Data</h3>
          </div>
          <p className="text-gray-400 text-sm max-w-md mb-6">
            Request a copy of your personal data in JSON or CSV format. It may take up to 24 hours to process.
          </p>
          <button
            type="button"
            onClick={downloadData}
            className="bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Request Archive
          </button>
        </div>
      </form>
    </motion.div>
  );
}
