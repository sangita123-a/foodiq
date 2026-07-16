"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function DeleteAccount() {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      showToast('Please type "DELETE MY ACCOUNT" to confirm', "error");
      return;
    }
    setLoading(true);
    try {
      await api.delete("/api/profile", { data: { confirmation: "DELETE MY ACCOUNT" } });
      Cookies.remove("token");
      localStorage.removeItem("user");
      showToast("Account deleted", "success");
      router.push("/");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete account", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#171717] rounded-3xl p-6 md:p-10 border border-red-500/20 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-red-500">Delete Account</h2>
      </div>

      <div className="relative z-10">
        <p className="text-gray-300 font-bold mb-2">Are you sure you want to delete your account?</p>
        <p className="text-gray-500 text-sm max-w-xl mb-8 leading-relaxed">
          This action is permanent and cannot be undone. All your data, including order history, saved addresses, favorite restaurants, and reward points will be permanently erased.
        </p>

        <div className="bg-[#111] border border-red-500/10 rounded-2xl p-6 mb-8">
          <h4 className="text-white font-bold mb-4">To verify, please type &quot;DELETE MY ACCOUNT&quot; below:</h4>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type here..."
            className="w-full bg-[#1a1a1a] text-white border border-red-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
          />
        </div>

        <button
          onClick={handleDelete}
          disabled={loading || confirmText !== "DELETE MY ACCOUNT"}
          className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-4 rounded-xl transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" /> {loading ? "Deleting..." : "Permanently Delete Account"}
        </button>
      </div>
    </motion.div>
  );
}
