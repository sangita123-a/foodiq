"use client";

import { motion } from "framer-motion";
import { Key, Smartphone, ShieldCheck, LogOut, Laptop } from "lucide-react";
import { FormEvent, useState } from "react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function SecuritySettings() {
  const { data: profile, mutate: mutateProfile } = useSWR("/api/profile");
  const { data: sessions, mutate: mutateSessions } = useSWR("/api/sessions");
  const { data: history } = useSWR("/api/sessions/history/logins");
  const { showToast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!profile?.two_factor_enabled);

  const handlePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const old_password = String(fd.get("old_password") || "");
    const new_password = String(fd.get("new_password") || "");
    const confirm = String(fd.get("confirm_password") || "");
    if (new_password !== confirm) {
      showToast("Passwords do not match", "error");
      return;
    }
    try {
      await api.put("/api/profile", { old_password, new_password });
      showToast("Password updated successfully", "success");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update password", "error");
    }
  };

  const toggle2FA = async () => {
    const next = !twoFactorEnabled;
    setTwoFactorEnabled(next);
    try {
      await api.put("/api/profile", { two_factor_enabled: next });
      mutateProfile();
      showToast(next ? "2FA enabled" : "2FA disabled", "success");
    } catch (err: any) {
      setTwoFactorEnabled(!next);
      showToast(err.response?.data?.message || "Failed to update 2FA", "error");
    }
  };

  const logoutOthers = async () => {
    try {
      await api.delete("/api/sessions/others");
      mutateSessions();
      showToast("Logged out from other devices", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  const removeSession = async (id: string) => {
    try {
      await api.delete(`/api/sessions/${id}`);
      mutateSessions();
      showToast("Session removed", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  const sessionList = sessions || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#F8FAFC] rounded-3xl p-6 md:p-10 border border-[#E5E7EB] shadow-2xl"
    >
      <h2 className="text-2xl font-bold text-white mb-8">Security Settings</h2>

      <div className="mb-10 pb-8 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-[#111827]">Change Password</h3>
        </div>
        <form onSubmit={handlePassword} className="space-y-4 max-w-md">
          <input
            type="password"
            name="old_password"
            required
            placeholder="Current Password"
            className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          />
          <input
            type="password"
            name="new_password"
            required
            minLength={8}
            placeholder="New Password"
            className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          />
          <input
            type="password"
            name="confirm_password"
            required
            minLength={8}
            placeholder="Confirm New Password"
            className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            className="bg-[#F8FAFC] hover:bg-[#F8FAFC] text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors mt-2"
          >
            Update Password
          </button>
        </form>
      </div>

      <div className="mb-10 pb-8 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-[#111827]">Two-Factor Authentication</h3>
          </div>
          <p className="text-[#6B7280] text-sm leading-relaxed">
            Add an extra layer of security to your account by requiring a code from your mobile app when logging in.
          </p>
        </div>
        <button
          onClick={toggle2FA}
          className={`w-14 h-8 rounded-full p-1 transition-colors relative flex-shrink-0 ${twoFactorEnabled ? "bg-primary" : "bg-white border border-[#E5E7EB]"}`}
        >
          <motion.div
            layout
            className="w-6 h-6 bg-white rounded-full shadow-md"
            animate={{ x: twoFactorEnabled ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      <div className="mb-10 pb-8 border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#111827]">Active Sessions</h3>
          <button
            onClick={logoutOthers}
            className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout from all devices
          </button>
        </div>

        <div className="space-y-3">
          {sessionList.length === 0 ? (
            <div className="flex items-center gap-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4">
              <div className="w-12 h-12 bg-[#F8FAFC] rounded-xl flex items-center justify-center">
                <Laptop className="w-6 h-6 text-[#6B7280]" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold">This Browser</h4>
                <p className="text-[#9CA3AF] text-xs">Current session</p>
              </div>
              <span className="text-green-400 text-xs font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                Current
              </span>
            </div>
          ) : (
            sessionList.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center gap-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4"
              >
                <div className="w-12 h-12 bg-[#F8FAFC] rounded-xl flex items-center justify-center">
                  {s.device_type === "mobile" ? (
                    <Smartphone className="w-6 h-6 text-[#6B7280]" />
                  ) : (
                    <Laptop className="w-6 h-6 text-[#6B7280]" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold">{s.device_name}</h4>
                  <p className="text-[#9CA3AF] text-xs">
                    {s.location || "Unknown"} • {new Date(s.last_active).toLocaleString()}
                  </p>
                </div>
                {s.is_current ? (
                  <span className="text-green-400 text-xs font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    Current
                  </span>
                ) : (
                  <button
                    onClick={() => removeSession(s.id)}
                    className="text-red-400 text-xs font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Login History</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {(history || []).length === 0 ? (
            <p className="text-[#9CA3AF] text-sm">No login history yet.</p>
          ) : (
            (history || []).map((h: any) => (
              <div
                key={h.id}
                className="flex justify-between text-sm bg-[#F8FAFC] rounded-xl px-4 py-2 border border-[#E5E7EB]"
              >
                <span className="text-[#6B7280]">{h.device_name}</span>
                <span className="text-[#9CA3AF]">{new Date(h.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
