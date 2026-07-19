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
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count?: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
};

const emptyForm = {
  code: "",
  discount_amount: 10,
  discount_type: "percentage",
  min_order_amount: 0,
  max_discount_amount: "",
  usage_limit: "",
  valid_until: "",
  is_active: true,
};

export default function AdminCouponsPage() {
  const { data, isLoading } = useAdminList<Coupon[]>("/api/admin/coupons");
  const coupons = data || [];
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => mutate("/api/admin/coupons");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        discount_amount: Number(form.discount_amount),
        discount_type: form.discount_type,
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        valid_until: form.valid_until || null,
        is_active: form.is_active,
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
      discount_amount: Number(c.discount_amount),
      discount_type: c.discount_type || "percentage",
      min_order_amount: Number(c.min_order_amount || 0),
      max_discount_amount: c.max_discount_amount != null ? String(c.max_discount_amount) : "",
      usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
      valid_until: c.valid_until ? String(c.valid_until).slice(0, 10) : "",
      is_active: c.is_active !== false,
    });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await adminDelete(`/api/admin/coupons/${id}`);
    refresh();
  };

  return (
    <AdminShell title="Coupons & Offers">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#111827]">Coupons</h1>
        <p className="text-[#6B7280]">Create percentage or flat discounts with limits and expiry.</p>
      </div>

      <form onSubmit={save} className="bg-white rounded-3xl border border-[#E5E7EB] p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CODE" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm uppercase" />
        <input required type="number" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: Number(e.target.value) })} placeholder="Discount" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm">
          <option value="percentage">Percentage</option>
          <option value="fixed">Flat</option>
        </select>
        <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })} placeholder="Min order" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <input type="number" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="Max discount" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Usage limit" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
        <label className="flex items-center gap-2 text-sm font-bold text-[#6B7280]">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
        </label>
        <button type="submit" disabled={saving} className="bg-[#E23744] text-white font-black rounded-xl py-3 disabled:opacity-60">
          {saving ? "Saving…" : editingId ? "Update Coupon" : "Create Coupon"}
        </button>
      </form>

      {isLoading && <p className="text-sm text-[#6B7280] mb-4">Loading…</p>}

      <div className="space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-black text-[#111827] tracking-wider">{c.code}</p>
              <p className="text-sm text-[#6B7280]">
                {c.discount_type === "percentage" ? `${c.discount_amount}%` : `₹${c.discount_amount}`} off · Used {c.usage_count || 0}
                {c.usage_limit != null ? ` / ${c.usage_limit}` : ""} · Expires {c.valid_until ? formatDate(c.valid_until) : "never"}
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => edit(c)} className="text-xs font-bold text-[#E23744]">Edit</button>
              <button type="button" onClick={() => remove(c.id)} className="text-xs font-bold text-red-500">Delete</button>
            </div>
          </div>
        ))}
        {!coupons.length && !isLoading && <p className="text-center text-[#9CA3AF] py-12">No coupons yet.</p>}
      </div>
    </AdminShell>
  );
}
