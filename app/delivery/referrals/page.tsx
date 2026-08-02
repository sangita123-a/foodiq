"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Gift,
  Copy,
  Check,
  Share2,
  Send,
  Mail,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Wallet,
  RefreshCw,
  Trophy,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  fetchDeliveryReferral,
  shareDeliveryReferral,
  ReferralSummary,
} from "@/services/deliveryApi";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import { isClientAuthenticated } from "@/lib/authSession";
import { useRouter } from "next/navigation";

export default function DeliveryReferralsPage() {
  const router = useRouter();
  const { data: dashboard } = useDeliveryDashboard();
  const [data, setData] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"progress" | "rewards" | "leaderboard">("progress");

  // Auth guard
  useEffect(() => {
    if (typeof window !== "undefined" && !isClientAuthenticated()) {
      router.replace("/delivery/login");
    }
  }, [router]);

  const loadReferralData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDeliveryReferral();
      setData(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      console.error("Failed to load referral data:", err);
      setError(e?.response?.data?.message || e?.message || "Failed to load referral details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferralData();

    const socket = getSocket();
    if (socket) {
      const handleUpdate = () => {
        loadReferralData();
      };
      socket.on(SOCKET_EVENTS.DELIVERY_REFERRAL_UPDATE, handleUpdate);
      socket.on(SOCKET_EVENTS.DELIVERY_REWARD_CREDITED, handleUpdate);

      return () => {
        socket.off(SOCKET_EVENTS.DELIVERY_REFERRAL_UPDATE, handleUpdate);
        socket.off(SOCKET_EVENTS.DELIVERY_REWARD_CREDITED, handleUpdate);
      };
    }
  }, [loadReferralData]);

  const handleCopyCode = async () => {
    if (!data?.referral_code) return;
    try {
      await navigator.clipboard.writeText(data.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const handleShare = async (platform: string) => {
    try {
      setSharingPlatform(platform);
      const shareData = await shareDeliveryReferral(platform);

      if (navigator.share && platform === "native") {
        await navigator.share({
          title: "Join Foodiq Delivery & Earn Bonus",
          text: shareData.text,
          url: shareData.shareUrl,
        });
      } else {
        window.open(shareData.shareUrl, "_blank");
      }
    } catch (e) {
      console.error("Share failed", e);
    } finally {
      setSharingPlatform(null);
    }
  };

  const formatCurrency = (val: number) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "rewarded":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Rewarded
          </span>
        );
      case "first_delivery_completed":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> First Delivery Done
          </span>
        );
      case "kyc_completed":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> KYC Approved
          </span>
        );
      case "registered":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Registered
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <DeliveryShell title="Referral Program" online={dashboard?.is_online}>
      <div className="-m-4 md:-m-8 bg-zinc-950 text-zinc-100 pb-16 min-h-[calc(100vh-5rem)] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-emerald-400" />
                <h1 className="text-2xl font-bold text-zinc-100">Referral Program</h1>
              </div>
              <p className="text-sm text-zinc-400 mt-0.5">
                Invite delivery partners & earn ₹{data?.default_reward_amount || 500} directly to your wallet for each valid referral
              </p>
            </div>
          </div>
          <button
            onClick={loadReferralData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm font-medium text-zinc-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Banner Card & Code Box */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-500/30 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-64 h-64 text-emerald-400" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Unlimited Earnings
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Earn <span className="text-emerald-400">{formatCurrency(data?.default_reward_amount || 500)}</span> Per Referral
              </h2>
              <p className="text-zinc-300 text-sm leading-relaxed max-w-xl">
                Share your unique code with friends. Once they register, get their KYC approved, and complete their 1st delivery, your reward is automatically credited to your delivery wallet!
              </p>

              {/* Business Rule Milestones Stepper */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 text-center">
                  <div className="font-semibold text-emerald-400 mb-0.5">Step 1</div>
                  <div className="text-zinc-400">Partner Register</div>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 text-center">
                  <div className="font-semibold text-emerald-400 mb-0.5">Step 2</div>
                  <div className="text-zinc-400">KYC Approved</div>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 text-center">
                  <div className="font-semibold text-emerald-400 mb-0.5">Step 3</div>
                  <div className="text-zinc-400">1st Delivery Done</div>
                </div>
              </div>
            </div>

            {/* Code Card & Quick Share */}
            <div className="lg:col-span-5 bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-lg">
              <div>
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider block mb-2">
                  Your Unique Referral Code
                </label>
                <div className="flex items-center gap-2 bg-zinc-900 border border-emerald-500/40 rounded-xl p-2.5 pl-4">
                  <span className="font-mono text-xl font-bold tracking-widest text-emerald-400 flex-1">
                    {data?.referral_code || "FDQ-LOADING"}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-md active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Share Channels */}
              <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium block">Instant Share Options</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleShare("whatsapp")}
                    disabled={sharingPlatform === "whatsapp"}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-xs font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare("telegram")}
                    disabled={sharingPlatform === "telegram"}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-400 hover:bg-sky-600 hover:text-white transition-all text-xs font-semibold"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Telegram
                  </button>
                  <button
                    onClick={() => handleShare("email")}
                    disabled={sharingPlatform === "email"}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all text-xs font-semibold"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Total Referred</span>
              <Users className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold text-white">{data?.stats.total_referrals || 0}</div>
            <div className="text-xs text-zinc-500">Partners invited</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Pending Stage</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{data?.stats.pending_referrals || 0}</div>
            <div className="text-xs text-zinc-500">Awaiting KYC / First Delivery</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Rewarded Referrals</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{data?.stats.completed_referrals || 0}</div>
            <div className="text-xs text-zinc-500">Successfully Credited</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Total Wallet Earned</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(data?.stats.total_earned || 0)}
            </div>
            <div className="text-xs text-zinc-500">
              Leaderboard Rank: #{data?.stats.leaderboard_position || 1}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab("progress")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "progress"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Referral Progress ({data?.history?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "rewards"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Reward & Wallet Credits ({data?.rewards?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "leaderboard"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Top Leaderboard
          </button>
        </div>

        {/* TAB 1: Referral Progress */}
        {activeTab === "progress" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-200 text-sm">Referred Delivery Partners Status</h3>
              <span className="text-xs text-zinc-500">Live Stage Tracker</span>
            </div>

            {!data?.history || data.history.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 space-y-3">
                <Users className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-sm">No referrals yet. Share your code to start earning!</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {data.history.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-100">{item.referred_name || "Referred Partner"}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center gap-3">
                        <span>Phone: {item.referred_phone || "N/A"}</span>
                        <span>Joined: {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-zinc-400">Reward Value</div>
                        <div className="font-bold text-emerald-400">{formatCurrency(item.reward_amount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Wallet Credits */}
        {activeTab === "rewards" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-200 text-sm">Wallet Transaction History</h3>
              <span className="text-xs text-zinc-500">Directly Credited to Delivery Wallet</span>
            </div>

            {!data?.rewards || data.rewards.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 space-y-3">
                <Wallet className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-sm">No wallet credit history yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {data.rewards.map((rw) => (
                  <div key={rw.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-100 text-sm">
                          Referral Bonus Credited for {rw.referred_name || "Partner"}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {rw.credited_at ? new Date(rw.credited_at).toLocaleString() : new Date(rw.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-emerald-400 text-base">+ {formatCurrency(rw.amount)}</div>
                      <span className="text-xs text-emerald-500 font-medium uppercase">Credited</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Leaderboard */}
        {activeTab === "leaderboard" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-200 text-sm">Top Delivery Partner Referrers</h3>
              <span className="text-xs text-emerald-400 font-medium">Updated Real-Time</span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {data?.leaderboard.map((lb) => (
                <div key={lb.partner_id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      lb.rank === 1 ? "bg-amber-400 text-zinc-950" : lb.rank === 2 ? "bg-zinc-300 text-zinc-950" : lb.rank === 3 ? "bg-amber-700 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {lb.rank === 1 ? <Trophy className="w-4 h-4" /> : `#${lb.rank}`}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100 text-sm">{lb.full_name}</div>
                      <div className="text-xs text-zinc-500">{lb.completed_count} successful referrals</div>
                    </div>
                  </div>

                  <div className="font-bold text-emerald-400 text-sm">
                    {formatCurrency(lb.total_earned)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </DeliveryShell>
  );
}
