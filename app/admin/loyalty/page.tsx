"use client";

import { useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPut, adminPost, formatCurrency } from "@/services/adminApi";
import StatCard from "@/components/admin/dashboard/StatCard";
import { Coins, Gift, TrendingUp, Users } from "lucide-react";

type LoyaltyData = {
  analytics: {
    membership_distribution: Array<{ slug: string; name: string; members: number }>;
    most_used_coupons: Array<{ code: string; uses: number; total_discount: number }>;
    redemption_rate_percent: number;
    total_earned: number;
    total_redeemed: number;
    referral_growth: Array<{ week: string; referrals: number }>;
    repeat_customers: number;
  };
  rules: Array<{ rule_key: string; label: string; points: number; multiplier?: number; is_active?: boolean }>;
  tiers: Array<{ slug: string; name: string; min_lifetime_points: number; benefits: Record<string, unknown> }>;
};

export default function AdminLoyaltyPage() {
  const { data, isLoading } = useAdminList<LoyaltyData>("/api/admin/loyalty");
  const [tab, setTab] = useState<"analytics" | "rules" | "tiers" | "adjust">("analytics");
  const [adjustForm, setAdjustForm] = useState({ user_id: "", points: "", reason: "" });
  const [msg, setMsg] = useState("");

  const analytics = data?.analytics;

  const saveRule = async (key: string, points: number) => {
    await adminPut(`/api/admin/loyalty/rules/${key}`, { points });
    mutate("/api/admin/loyalty");
    setMsg("Rule updated.");
  };

  const saveTier = async (slug: string, minPoints: number) => {
    await adminPut(`/api/admin/loyalty/tiers/${slug}`, { min_lifetime_points: minPoints });
    mutate("/api/admin/loyalty");
    setMsg("Tier updated.");
  };

  const adjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminPost("/api/admin/loyalty/adjust", {
      user_id: adjustForm.user_id,
      points: Number(adjustForm.points),
      reason: adjustForm.reason,
    });
    setAdjustForm({ user_id: "", points: "", reason: "" });
    setMsg("Points adjusted.");
  };

  const expirePoints = async () => {
    if (!confirm("Process expired points for all users?")) return;
    await adminPost("/api/admin/loyalty/expire", {});
    setMsg("Expired points processed.");
    mutate("/api/admin/loyalty");
  };

  return (
    <AdminShell title="Loyalty & Membership">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-1.5">Loyalty & Membership</h1>
          <p className="text-gray-text text-sm">Manage points rules, membership tiers, campaigns, and analytics.</p>
        </div>
        <button
          type="button"
          onClick={expirePoints}
          className="text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors"
        >
          Expire Points
        </button>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["analytics", "rules", "tiers", "adjust"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${
              tab === t ? "bg-primary text-white" : "bg-white border border-border text-gray-text"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-text">Loading…</p>}

      {tab === "analytics" && analytics && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Earned"
              value={analytics.total_earned}
              icon={Coins}
              color="text-amber-600"
              bg="bg-amber-500/10"
              format={(n) => n.toLocaleString("en-IN")}
            />
            <StatCard
              label="Total Redeemed"
              value={analytics.total_redeemed}
              icon={Gift}
              color="text-violet-600"
              bg="bg-violet-500/10"
              format={(n) => n.toLocaleString("en-IN")}
            />
            <StatCard
              label="Redemption Rate"
              value={analytics.redemption_rate_percent}
              icon={TrendingUp}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
              format={(n) => `${n}%`}
            />
            <StatCard
              label="Repeat Customers"
              value={analytics.repeat_customers}
              icon={Users}
              color="text-blue-600"
              bg="bg-blue-500/10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-5 sm:p-6">
              <h2 className="text-lg font-black text-foreground tracking-tight mb-4">Membership Distribution</h2>
              <div className="space-y-2">
                {analytics.membership_distribution.map((m) => (
                  <div key={m.slug} className="flex justify-between border border-border rounded-xl px-4 py-3">
                    <span className="font-bold text-sm">{m.name}</span>
                    <span className="text-sm text-gray-text">{m.members} members</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-5 sm:p-6">
              <h2 className="text-lg font-black text-foreground tracking-tight mb-4">Most Used Coupons</h2>
              <div className="space-y-2">
                {analytics.most_used_coupons.map((c) => (
                  <div key={c.code} className="flex justify-between border border-border rounded-xl px-4 py-3">
                    <span className="font-mono font-bold text-sm text-primary">{c.code}</span>
                    <div className="text-right text-xs">
                      <p className="font-bold">{c.uses} uses</p>
                      <p className="text-gray-text">{formatCurrency(c.total_discount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "rules" && (
        <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-5 sm:p-6 space-y-3">
          {(data?.rules || []).map((rule) => (
            <div key={rule.rule_key} className="flex flex-col sm:flex-row sm:items-center gap-3 border border-border rounded-xl p-4">
              <div className="flex-1">
                <p className="font-bold text-foreground">{rule.label}</p>
                <p className="text-xs text-[#9CA3AF] font-mono">{rule.rule_key}</p>
              </div>
              <input
                type="number"
                defaultValue={rule.points}
                onBlur={(e) => saveRule(rule.rule_key, Number(e.target.value))}
                className="w-24 border border-border rounded-lg px-3 py-2 text-sm font-bold"
              />
              <span className="text-xs text-gray-text">points</span>
            </div>
          ))}
        </div>
      )}

      {tab === "tiers" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data?.tiers || []).map((tier) => (
            <div key={tier.slug} className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-5 sm:p-6">
              <h3 className="font-black text-foreground mb-1">{tier.name}</h3>
              <p className="text-xs text-[#9CA3AF] mb-4 font-mono">{tier.slug}</p>
              <label className="text-xs font-bold text-gray-text">Min Lifetime Points</label>
              <input
                type="number"
                defaultValue={tier.min_lifetime_points}
                onBlur={(e) => saveTier(tier.slug, Number(e.target.value))}
                className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm font-bold mb-4"
              />
              <div className="text-xs space-y-1 text-gray-text">
                {Object.entries(tier.benefits || {}).map(([k, v]) => (
                  <p key={k}>{k.replace(/_/g, " ")}: {String(v)}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "adjust" && (
        <form onSubmit={adjustPoints} className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-5 sm:p-6 max-w-md space-y-4">
          <h2 className="text-lg font-black text-foreground tracking-tight">Manual Points Adjustment</h2>
          <input
            value={adjustForm.user_id}
            onChange={(e) => setAdjustForm({ ...adjustForm, user_id: e.target.value })}
            placeholder="User ID (UUID)"
            required
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
          <input
            type="number"
            value={adjustForm.points}
            onChange={(e) => setAdjustForm({ ...adjustForm, points: e.target.value })}
            placeholder="Points (+ credit, - debit)"
            required
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
          <input
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            placeholder="Reason"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
          <button type="submit" className="w-full bg-primary text-white font-black py-3 rounded-xl">
            Adjust Points
          </button>
        </form>
      )}
    </AdminShell>
  );
}
