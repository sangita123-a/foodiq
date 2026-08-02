"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Gift,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ChevronLeft,
  Users,
  Wallet,
  Download,
  Settings,
  ShieldAlert,
  Check,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  fetchAdminReferrals,
  updateAdminReferral,
  fetchAdminReferralSettings,
  updateAdminReferralSettings,
  AdminReferralRecord,
  AdminReferralResponse,
  AdminReferralSettings,
} from "@/services/adminApi";

export default function AdminReferralsPage() {
  const [data, setData] = useState<AdminReferralResponse | null>(null);
  const [settings, setSettings] = useState<AdminReferralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"referrals" | "settings">("referrals");
  const [savingSettings, setSavingSettings] = useState(false);

  // Settings Form state
  const [rewardAmount, setRewardAmount] = useState(500);
  const [rewardType, setRewardType] = useState("cash");
  const [expiryDays, setExpiryDays] = useState(30);
  const [minDeliveries, setMinDeliveries] = useState(1);
  const [autoCredit, setAutoCredit] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [refRes, setRes] = await Promise.all([
        fetchAdminReferrals({ status: statusFilter, search: searchQuery }),
        fetchAdminReferralSettings(),
      ]);
      setData(refRes);
      setSettings(setRes);
      setRewardAmount(setRes.default_reward_amount || 500);
      setRewardType(setRes.reward_type || "cash");
      setExpiryDays(setRes.expiry_days || 30);
      setMinDeliveries(setRes.min_deliveries_required || 1);
      setAutoCredit(setRes.auto_credit_enabled ?? true);
    } catch (err: any) {
      console.error("Failed to load admin referrals:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load referrals.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadData();

    const socket = getSocket();
    if (socket) {
      const handleUpdate = () => loadData();
      socket.on(SOCKET_EVENTS.ADMIN_REFERRAL_NEW, handleUpdate);
      socket.on(SOCKET_EVENTS.DELIVERY_REFERRAL_UPDATE, handleUpdate);

      return () => {
        socket.off(SOCKET_EVENTS.ADMIN_REFERRAL_NEW, handleUpdate);
        socket.off(SOCKET_EVENTS.DELIVERY_REFERRAL_UPDATE, handleUpdate);
      };
    }
  }, [loadData]);

  const handleUpdateStatus = async (id: string, status: string, forceCredit = false) => {
    try {
      await updateAdminReferral(id, { status, force_credit: forceCredit });
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await updateAdminReferralSettings({
        default_reward_amount: Number(rewardAmount),
        reward_type: rewardType,
        expiry_days: Number(expiryDays),
        min_deliveries_required: Number(minDeliveries),
        auto_credit_enabled: autoCredit,
      });
      alert("Referral settings updated successfully!");
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportCSV = () => {
    if (!data?.referrals || data.referrals.length === 0) return;
    const headers = [
      "ID",
      "Referral Code",
      "Referrer Name",
      "Referrer Phone",
      "Referred Name",
      "Referred Phone",
      "Status",
      "Reward Amount",
      "Created At",
    ];
    const rows = data.referrals.map((r) => [
      r.id,
      r.referral_code,
      `"${r.referrer_name || ""}"`,
      `"${r.referrer_phone || ""}"`,
      `"${r.referred_name || ""}"`,
      `"${r.referred_phone || ""}"`,
      r.status,
      r.reward_amount,
      r.created_at,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `referrals_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-emerald-400" />
                <h1 className="text-2xl font-bold text-zinc-100">Referral Program Management</h1>
              </div>
              <p className="text-sm text-zinc-400 mt-0.5">
                Audit delivery referrals, verify eligibility rules, fraud risk checks, & adjust reward settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm font-medium text-zinc-300 hover:text-white transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Export CSV
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-zinc-400 font-medium">Total Referrals</span>
            <div className="text-2xl font-bold text-white">{data?.stats.total_referrals || 0}</div>
            <span className="text-xs text-zinc-500">All registered links</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-zinc-400 font-medium">Registered / In Progress</span>
            <div className="text-2xl font-bold text-amber-400">
              {(data?.stats.registered_count || 0) + (data?.stats.kyc_completed_count || 0)}
            </div>
            <span className="text-xs text-zinc-500">Pending eligibility</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-zinc-400 font-medium">First Delivery Complete</span>
            <div className="text-2xl font-bold text-blue-400">{data?.stats.first_delivery_count || 0}</div>
            <span className="text-xs text-zinc-500">Ready for credit</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-zinc-400 font-medium">Rewarded Count</span>
            <div className="text-2xl font-bold text-emerald-400">{data?.stats.rewarded_count || 0}</div>
            <span className="text-xs text-zinc-500">Credited to wallet</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1 col-span-2 lg:col-span-1">
            <span className="text-xs text-zinc-400 font-medium">Total Bonus Payout</span>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(data?.stats.total_payout || 0)}
            </div>
            <span className="text-xs text-zinc-500">Delivery Wallet total</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab("referrals")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "referrals"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Users className="w-4 h-4" /> Referrals Audit & Rewards
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Settings className="w-4 h-4" /> Reward Settings & Rules
          </button>
        </div>

        {/* TAB 1: Referrals Table & Filters */}
        {activeTab === "referrals" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search code, partner name, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-zinc-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="registered">Registered</option>
                  <option value="kyc_completed">KYC Completed</option>
                  <option value="first_delivery_completed">First Delivery Done</option>
                  <option value="rewarded">Rewarded</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Referrals List Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-xs font-semibold uppercase text-zinc-400">
                    <tr>
                      <th className="p-4">Referral Code</th>
                      <th className="p-4">Referrer Partner</th>
                      <th className="p-4">Referred Partner</th>
                      <th className="p-4">Status & Eligibility</th>
                      <th className="p-4">Reward Amount</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {!data?.referrals || data.referrals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                          No referral records found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      data.referrals.map((r) => (
                        <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-4 font-mono font-bold text-emerald-400">{r.referral_code}</td>
                          <td className="p-4">
                            <div className="font-semibold text-zinc-100">{r.referrer_name || "Unknown"}</div>
                            <div className="text-xs text-zinc-500">{r.referrer_phone}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-zinc-100">{r.referred_name || "Pending Registration"}</div>
                            <div className="text-xs text-zinc-500">{r.referred_phone}</div>
                          </td>
                          <td className="p-4 space-y-1">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              r.status === "rewarded"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : r.status === "first_delivery_completed"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : r.status === "kyc_completed"
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {r.status}
                            </span>
                            <div className="text-[11px] text-zinc-500">
                              KYC: {r.referred_kyc_approved ? "Approved" : "Pending"}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-emerald-400">{formatCurrency(r.reward_amount)}</td>
                          <td className="p-4">
                            {r.status !== "rewarded" && (
                              <button
                                onClick={() => handleUpdateStatus(r.id, "rewarded", true)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Credit Reward
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Settings */}
        {activeTab === "settings" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" /> Referral Reward Configuration
              </h3>
              <p className="text-sm text-zinc-400">Manage global referral rules, payout amount, and automation settings</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1">
                  Default Reward Amount (₹)
                </label>
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1">
                  Reward Type
                </label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="cash">Direct Cash to Delivery Wallet</option>
                  <option value="bonus">Bonus Credit</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1">
                  Min Deliveries Required Before Reward
                </label>
                <input
                  type="number"
                  value={minDeliveries}
                  onChange={(e) => setMinDeliveries(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1">
                  Referral Link Expiry (Days)
                </label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="autoCredit"
                  checked={autoCredit}
                  onChange={(e) => setAutoCredit(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="autoCredit" className="text-sm text-zinc-300">
                  Enable Automatic Wallet Crediting upon eligibility check
                </label>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all shadow-lg disabled:opacity-50"
              >
                {savingSettings ? "Saving Settings..." : "Save Referral Configuration"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
