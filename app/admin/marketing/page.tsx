"use client";

import { useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPost, formatDate } from "@/services/adminApi";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  audience: string;
  subject?: string;
  message: string;
  status: string;
  sent_count?: number;
  created_at?: string;
};

type Seasonal = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  banner_url?: string;
  offer_code?: string;
  starts_at: string;
  ends_at: string;
  is_active?: boolean;
};

type MarketingData = {
  campaigns: Campaign[];
  seasonal: Seasonal[];
};

export default function AdminMarketingPage() {
  const { data, isLoading } = useAdminList<MarketingData>("/api/admin/marketing");
  const [tab, setTab] = useState<"push" | "email" | "sms" | "banner" | "seasonal">("push");
  const [form, setForm] = useState({
    name: "",
    audience: "all",
    subject: "",
    message: "",
  });
  const [seasonal, setSeasonal] = useState({
    slug: "",
    title: "",
    subtitle: "",
    banner_url: "",
    offer_code: "",
    starts_at: "",
    ends_at: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const campaigns = data?.campaigns || [];
  const seasonalList = data?.seasonal || [];

  const createCampaign = async (channel: string) => {
    setBusy(true);
    setMsg("");
    try {
      await adminPost("/api/admin/marketing/campaigns", { ...form, channel });
      setForm({ name: "", audience: "all", subject: "", message: "" });
      setMsg("Campaign created.");
      mutate("/api/admin/marketing");
    } catch {
      setMsg("Failed to create campaign.");
    } finally {
      setBusy(false);
    }
  };

  const sendCampaign = async (id: string) => {
    if (!confirm("Send this campaign now?")) return;
    setBusy(true);
    try {
      await adminPost(`/api/admin/marketing/campaigns/${id}/send`, {});
      mutate("/api/admin/marketing");
      setMsg("Campaign sent.");
    } catch {
      setMsg("Failed to send campaign.");
    } finally {
      setBusy(false);
    }
  };

  const saveSeasonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminPost("/api/admin/marketing/seasonal", seasonal);
      setSeasonal({ slug: "", title: "", subtitle: "", banner_url: "", offer_code: "", starts_at: "", ends_at: "" });
      mutate("/api/admin/marketing");
      setMsg("Festival offer saved.");
    } catch {
      setMsg("Failed to save offer.");
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { id: "push" as const, label: "Push Notifications" },
    { id: "email" as const, label: "Email Campaigns" },
    { id: "sms" as const, label: "SMS Campaigns" },
    { id: "banner" as const, label: "Banner Management" },
    { id: "seasonal" as const, label: "Festival Offers" },
  ];

  return (
    <AdminShell title="Marketing">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#111827]">Marketing Hub</h1>
        <p className="text-[#6B7280]">Push notifications, email/SMS campaigns, banners, and festival offers.</p>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === t.id ? "bg-[#E23744] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "seasonal" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCampaign(tab === "banner" ? "banner" : tab);
            }}
            className="bg-white rounded-3xl border border-[#E5E7EB] p-6 space-y-4"
          >
            <h2 className="text-lg font-black text-[#111827]">Create {tabs.find((t) => t.id === tab)?.label}</h2>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Campaign name"
              required
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
            />
            <select
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
            >
              <option value="all">All users</option>
              <option value="customers">Customers</option>
              <option value="restaurants">Restaurants</option>
              <option value="delivery">Delivery partners</option>
            </select>
            {(tab === "email" || tab === "banner") && (
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Subject / Banner title"
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
              />
            )}
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Message content"
              required
              rows={4}
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="bg-[#E23744] text-white font-black px-6 py-3 rounded-xl disabled:opacity-60"
            >
              Create Campaign
            </button>
          </form>

          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
            <h2 className="text-lg font-black text-[#111827] mb-4">Recent Campaigns</h2>
            {isLoading && <p className="text-sm text-[#6B7280]">Loading…</p>}
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {campaigns
                .filter((c) => (tab === "banner" ? c.channel === "banner" : c.channel === tab))
                .map((c) => (
                  <div key={c.id} className="border border-[#E5E7EB] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-[#111827]">{c.name}</p>
                        <p className="text-xs text-[#6B7280] mt-1">{c.message.slice(0, 80)}…</p>
                        <p className="text-xs text-[#9CA3AF] mt-1">{formatDate(c.created_at)}</p>
                      </div>
                      <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-[#F8FAFC] text-[#6B7280]">
                        {c.status}
                      </span>
                    </div>
                    {c.status === "draft" && (
                      <button
                        type="button"
                        onClick={() => sendCampaign(c.id)}
                        className="mt-3 text-xs font-bold text-[#E23744]"
                      >
                        Send now
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <form onSubmit={saveSeasonal} className="bg-white rounded-3xl border border-[#E5E7EB] p-6 space-y-4">
            <h2 className="text-lg font-black text-[#111827]">Festival / Flash Offer</h2>
            {(["slug", "title", "subtitle", "banner_url", "offer_code"] as const).map((key) => (
              <input
                key={key}
                value={seasonal[key]}
                onChange={(e) => setSeasonal({ ...seasonal, [key]: e.target.value })}
                placeholder={key.replace("_", " ")}
                required={key === "slug" || key === "title"}
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm capitalize"
              />
            ))}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="datetime-local"
                value={seasonal.starts_at}
                onChange={(e) => setSeasonal({ ...seasonal, starts_at: e.target.value })}
                required
                className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
              />
              <input
                type="datetime-local"
                value={seasonal.ends_at}
                onChange={(e) => setSeasonal({ ...seasonal, ends_at: e.target.value })}
                required
                className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <button type="submit" disabled={busy} className="bg-[#E23744] text-white font-black px-6 py-3 rounded-xl">
              Save Offer
            </button>
          </form>

          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
            <h2 className="text-lg font-black text-[#111827] mb-4">Active Festival Offers</h2>
            <div className="space-y-3">
              {seasonalList.map((s) => (
                <div key={s.id} className="border border-[#E5E7EB] rounded-xl p-4">
                  <p className="font-bold text-[#111827]">{s.title}</p>
                  <p className="text-xs text-[#6B7280]">{s.subtitle}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    {formatDate(s.starts_at)} → {formatDate(s.ends_at)}
                  </p>
                  {s.offer_code && (
                    <span className="inline-block mt-2 text-xs font-bold bg-[#E23744]/10 text-[#E23744] px-2 py-1 rounded">
                      {s.offer_code}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
