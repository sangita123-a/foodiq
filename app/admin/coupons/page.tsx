"use client";

import { useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPost, adminPut, adminDelete, formatDate } from "@/services/adminApi";

type Coupon = {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  coupon_type?: string;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count?: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  one_time_per_user?: boolean;
  title?: string;
  description?: string;
};

type Analytics = {
  summary?: {
    total_coupons?: number;
    active_coupons?: number;
    festival_coupons?: number;
  };
  usage_by_coupon?: Array<{
    id: string;
    code: string;
    coupon_type?: string;
    title?: string;
    total_uses: number;
    total_discount_given: number;
    usage_limit?: number;
    is_active?: boolean;
  }>;
  recent_usage?: Array<{
    coupon_code: string;
    discount_amount: number;
    final_price: number;
    created_at: string;
    user_name?: string;
  }>;
};

const COUPON_TYPES = [
  { value: "flat", label: "Flat Discount" },
  { value: "percentage", label: "Percentage Discount" },
  { value: "free_delivery", label: "Free Delivery" },
  { value: "first_order", label: "First Order Offer" },
  { value: "festival", label: "Festival Offer" },
];

const emptyForm = {
  code: "",
  title: "",
  description: "",
  discount_amount: 10,
  discount_type: "percentage",
  coupon_type: "percentage",
  min_order_amount: 0,
  max_discount_amount: "",
  usage_limit: "",
  valid_until: "",
  is_active: true,
  one_time_per_user: false,
};

export default function AdminCouponsPage() {
  const { data, isLoading } = useAdminList<Coupon[]>("/api/admin/coupons");
  const { data: analytics } = useAdminList<Analytics>("/api/admin/coupons/analytics");
  const coupons = data || [];
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    mutate("/api/admin/coupons");
    mutate("/api/admin/coupons/analytics");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const discountType =
        form.coupon_type === "flat" || form.coupon_type === "free_delivery"
          ? "fixed"
          : "percentage";
      const payload = {
        code: form.code,
        title: form.title || null,
        description: form.description || null,
        discount_amount: Number(form.discount_amount),
        discount_type: discountType,
        coupon_type: form.coupon_type,
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        valid_until: form.valid_until || null,
        is_active: form.is_active,
        one_time_per_user: form.one_time_per_user,
      };
      if (editingId) await adminPut(`/api/admin/coupons/${editingId}`, payload);
      else await adminPost("/api/admin/coupons", payload);
      setForm(emptyForm);
      setEditingId(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const edit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      title: c.title || "",
      description: c.description || "",
      discount_amount: Number(c.discount_amount),
      discount_type: c.discount_type || "percentage",
      coupon_type: c.coupon_type || (c.discount_type === "fixed" ? "flat" : "percentage"),
      min_order_amount: Number(c.min_order_amount || 0),
      max_discount_amount: c.max_discount_amount != null ? String(c.max_discount_amount) : "",
      usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
      valid_until: c.valid_until ? String(c.valid_until).slice(0, 10) : "",
      is_active: c.is_active !== false,
      one_time_per_user: Boolean(c.one_time_per_user),
    });
  };

  const toggleActive = async (c: Coupon) => {
    await adminPut(`/api/admin/coupons/${c.id}`, { is_active: !c.is_active });
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await adminDelete(`/api/admin/coupons/${id}`);
    refresh();
  };

  const summary = analytics?.summary;

  return (
    <AdminShell title="Coupons & Offers">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#111827]">Coupons & Referrals</h1>
        <p className="text-[#6B7280]">
          Create flat, percentage, free delivery, first-order, and festival coupons with usage rules.
        </p>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase">Total</p>
            <p className="text-2xl font-black text-[#111827]">{summary.total_coupons || 0}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase">Active</p>
            <p className="text-2xl font-black text-emerald-600">{summary.active_coupons || 0}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase">Festival</p>
            <p className="text-2xl font-black text-[#111827]">{summary.festival_coupons || 0}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase">Total Uses</p>
            <p className="text-2xl font-black text-[#E23744]">
              {(analytics?.usage_by_coupon || []).reduce((s, c) => s + c.total_uses, 0)}
            </p>
          </div>
        </div>
      ) : null}

      <form onSubmit={save} className="bg-white rounded-3xl border border-[#E5E7EB] p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CODE" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm uppercase" />
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <select value={form.coupon_type} onChange={(e) => setForm({ ...form, coupon_type: e.target.value })} className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm">
          {COUPON_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input required type="number" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: Number(e.target.value) })} placeholder="Discount amount" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })} placeholder="Min order ₹" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <input type="number" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="Max discount (optional)" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Global usage limit" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Terms / description" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm md:col-span-2" />
        <label className="flex items-center gap-2 text-sm font-bold text-[#6B7280]">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-[#6B7280]">
          <input type="checkbox" checked={form.one_time_per_user} onChange={(e) => setForm({ ...form, one_time_per_user: e.target.checked })} /> One-time per user
        </label>
        <button type="submit" disabled={saving} className="bg-[#E23744] text-white font-black rounded-xl py-3 disabled:opacity-60">
          {saving ? "Saving…" : editingId ? "Update Coupon" : "Create Coupon"}
        </button>
      </form>

      {isLoading && <p className="text-sm text-[#6B7280] mb-4">Loading…</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-black text-[#111827] mb-4">All Coupons</h2>
          <div className="space-y-3">
            {coupons.map((c) => (
              <div key={c.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-[#111827] tracking-wider">{c.code}</p>
                    {!c.is_active ? (
                      <span className="text-[10px] font-bold uppercase bg-[#FEF3C7] text-amber-700 px-2 py-0.5 rounded">Disabled</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-[#6B7280]">
                    {c.title || c.coupon_type} ·{" "}
                    {c.discount_type === "percentage" ? `${c.discount_amount}%` : `₹${c.discount_amount}`} · Used {c.usage_count || 0}
                    {c.usage_limit != null ? ` / ${c.usage_limit}` : ""} · Expires {c.valid_until ? formatDate(c.valid_until) : "never"}
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button type="button" onClick={() => toggleActive(c)} className="text-xs font-bold text-[#6B7280]">
                    {c.is_active ? "Disable" : "Enable"}
                  </button>
                  <button type="button" onClick={() => edit(c)} className="text-xs font-bold text-[#E23744]">Edit</button>
                  <button type="button" onClick={() => remove(c.id)} className="text-xs font-bold text-red-500">Delete</button>
                </div>
              </div>
            ))}
            {!coupons.length && !isLoading && <p className="text-center text-[#9CA3AF] py-12">No coupons yet.</p>}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-black text-[#111827] mb-4">Usage Analytics</h2>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold uppercase text-[#9CA3AF] mb-3">Top Coupons</p>
            <div className="space-y-2">
              {(analytics?.usage_by_coupon || []).slice(0, 8).map((c) => (
                <div key={c.id} className="flex justify-between text-sm border-b border-[#F3F4F6] pb-2">
                  <span className="font-bold text-[#111827]">{c.code}</span>
                  <span className="text-[#6B7280]">
                    {c.total_uses} uses · ₹{Number(c.total_discount_given).toFixed(0)} saved
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
            <p className="text-xs font-bold uppercase text-[#9CA3AF] mb-3">Recent Redemptions</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(analytics?.recent_usage || []).map((u, i) => (
                <div key={i} className="text-sm border-b border-[#F3F4F6] pb-2">
                  <p className="font-bold text-[#111827]">{u.coupon_code} · {u.user_name}</p>
                  <p className="text-xs text-[#9CA3AF]">
                    −₹{u.discount_amount} · {formatDate(u.created_at)}
                  </p>
                </div>
              ))}
              {!analytics?.recent_usage?.length ? (
                <p className="text-sm text-[#9CA3AF]">No redemptions yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
