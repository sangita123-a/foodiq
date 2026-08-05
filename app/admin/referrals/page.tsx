"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Gift,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  Sliders,
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
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/admin/dashboard/StatCard";
import { Badge, Button, EmptyState } from "@/components/admin/ui";
import type { BadgeTone } from "@/components/admin/ui";

const STATUS_TONE: Record<string, BadgeTone> = {
  rewarded: "success",
  first_delivery_completed: "info",
  kyc_completed: "violet",
  registered: "warning",
  pending: "warning",
  expired: "neutral",
};

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
    <AdminShell title="Referral Program">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Referral Program Management</h1>
              <p className="text-sm text-gray-text mt-0.5">
                Audit delivery referrals, verify eligibility rules, fraud risk checks, &amp; adjust reward settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border hover:bg-section text-sm font-bold text-foreground transition-all"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Export CSV
            </button>
            <Button variant="primary" onClick={loadData} loading={loading} icon={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Referrals" value={data?.stats.total_referrals || 0} icon={Users} color="text-primary" bg="bg-primary/10" hint="All registered links" />
          <StatCard
            label="Registered / In Progress"
            value={(data?.stats.registered_count || 0) + (data?.stats.kyc_completed_count || 0)}
            icon={Clock}
            color="text-amber-600"
            bg="bg-amber-500/10"
            hint="Pending eligibility"
          />
          <StatCard label="First Delivery Complete" value={data?.stats.first_delivery_count || 0} icon={Check} color="text-blue-600" bg="bg-blue-500/10" hint="Ready for credit" />
          <StatCard label="Rewarded Count" value={data?.stats.rewarded_count || 0} icon={Sparkles} color="text-emerald-600" bg="bg-emerald-500/10" hint="Credited to wallet" />
          <StatCard
            label="Total Bonus Payout"
            value={data?.stats.total_payout || 0}
            icon={Wallet}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            format={formatCurrency}
            hint="Delivery wallet total"
          />
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("referrals")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "referrals"
                ? "bg-primary/10 text-primary"
                : "text-gray-text hover:text-foreground hover:bg-section"
            }`}
          >
            <Users className="w-4 h-4" /> Referrals Audit &amp; Rewards
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-primary/10 text-primary"
                : "text-gray-text hover:text-foreground hover:bg-section"
            }`}
          >
            <Settings className="w-4 h-4" /> Reward Settings &amp; Rules
          </button>
        </div>

        {/* TAB 1: Referrals Table & Filters */}
        {activeTab === "referrals" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-border shadow-[var(--shadow-admin-soft)]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search code, partner name, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-section border border-transparent rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-gray-text shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-section border border-transparent rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
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
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-admin-soft)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-section">
                    <tr>
                      <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Referral Code</th>
                      <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Referrer Partner</th>
                      <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Referred Partner</th>
                      <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Status &amp; Eligibility</th>
                      <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Reward Amount</th>
                      <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {!data?.referrals || data.referrals.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState icon={Gift} title="No referrals found" description="No referral records match the current criteria." />
                        </td>
                      </tr>
                    ) : (
                      data.referrals.map((r) => (
                        <tr key={r.id} className="hover:bg-section/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-primary">{r.referral_code}</td>
                          <td className="p-4">
                            <div className="font-bold text-foreground">{r.referrer_name || "Unknown"}</div>
                            <div className="text-xs text-gray-text">{r.referrer_phone}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-foreground">{r.referred_name || "Pending Registration"}</div>
                            <div className="text-xs text-gray-text">{r.referred_phone}</div>
                          </td>
                          <td className="p-4 space-y-1">
                            <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
                            <div className="text-[11px] text-gray-text">
                              KYC: {r.referred_kyc_approved ? "Approved" : "Pending"}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-emerald-600">{formatCurrency(r.reward_amount)}</td>
                          <td className="p-4">
                            {r.status !== "rewarded" && (
                              <button
                                onClick={() => handleUpdateStatus(r.id, "rewarded", true)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1"
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
          <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-6 max-w-2xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Referral Reward Configuration
              </h3>
              <p className="text-sm text-gray-text">Manage global referral rules, payout amount, and automation settings</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-foreground block mb-1.5">
                  Default Reward Amount (₹)
                </label>
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(Number(e.target.value))}
                  className="w-full bg-section border border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-foreground block mb-1.5">
                  Reward Type
                </label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value)}
                  className="w-full bg-section border border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                >
                  <option value="cash">Direct Cash to Delivery Wallet</option>
                  <option value="bonus">Bonus Credit</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-foreground block mb-1.5">
                  Min Deliveries Required Before Reward
                </label>
                <input
                  type="number"
                  value={minDeliveries}
                  onChange={(e) => setMinDeliveries(Number(e.target.value))}
                  className="w-full bg-section border border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-foreground block mb-1.5">
                  Referral Link Expiry (Days)
                </label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full bg-section border border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="autoCredit"
                  checked={autoCredit}
                  onChange={(e) => setAutoCredit(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary focus:ring-primary/30"
                />
                <label htmlFor="autoCredit" className="text-sm text-gray-text">
                  Enable Automatic Wallet Crediting upon eligibility check
                </label>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all shadow-[var(--shadow-button)] disabled:opacity-50"
              >
                {savingSettings ? "Saving Settings..." : "Save Referral Configuration"}
              </button>
            </form>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
