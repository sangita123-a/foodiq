"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import {
  inventoryFetcher,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryCategory,
  INVENTORY_UNITS,
  type InventoryItem,
} from "@/services/partnerInventoryApi";
import { AlertTriangle, Package, Trash2 } from "lucide-react";

const emptyForm = {
  name: "",
  quantity: 0,
  unit: "pieces",
  purchase_price: 0,
  category_id: "",
  supplier_id: "",
  expiry_date: "",
  reorder_level: 5,
};

export default function PartnerInventoryPage() {
  const { data: items, isLoading } = useSWR<InventoryItem[]>("/api/partner/inventory/items", inventoryFetcher);
  const { data: alerts } = useSWR<InventoryItem[]>("/api/partner/inventory/alerts", inventoryFetcher);
  const { data: categories } = useSWR<Array<{ id: string; name: string }>>(
    "/api/partner/inventory/categories",
    inventoryFetcher
  );
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    mutate("/api/partner/inventory/items");
    mutate("/api/partner/inventory/alerts");
    mutate("/api/partner/inventory/overview");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        ...form,
        category_id: form.category_id || null,
        quantity: Number(form.quantity),
        purchase_price: Number(form.purchase_price),
        reorder_level: Number(form.reorder_level),
        expiry_date: form.expiry_date || null,
      };
      if (editId) await updateInventoryItem(editId, body);
      else await createInventoryItem(body);
      setForm(emptyForm);
      setEditId(null);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      purchase_price: Number(item.purchase_price || 0),
      category_id: item.category_id || "",
      supplier_id: item.supplier_id || "",
      expiry_date: item.expiry_date ? String(item.expiry_date).slice(0, 10) : "",
      reorder_level: Number(item.reorder_level || 5),
    });
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await createInventoryCategory(newCategory.trim());
    setNewCategory("");
    mutate("/api/partner/inventory/categories");
  };

  return (
    <div className="min-h-screen bg-section flex">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-black text-foreground">Inventory Management</h1>
              <p className="text-gray-text">Track ingredients, stock levels, and expiry dates.</p>
            </div>

            {(alerts || []).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-black text-amber-900 text-sm">{alerts?.length} stock alert(s)</p>
                  <p className="text-xs text-amber-800 mt-1">
                    {(alerts || []).slice(0, 3).map((a) => a.name).join(", ")}
                    {(alerts?.length || 0) > 3 ? "…" : ""}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={submit} className="lg:col-span-1 bg-white rounded-3xl border border-border p-6 space-y-3 h-fit">
                <h2 className="font-black text-foreground flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {editId ? "Edit Item" : "Add Item"}
                </h2>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Item name"
                  required
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    placeholder="Quantity"
                    className="border border-border rounded-xl px-4 py-2.5 text-sm"
                  />
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="border border-border rounded-xl px-3 py-2.5 text-sm"
                  >
                    {INVENTORY_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={form.purchase_price}
                  onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })}
                  placeholder="Purchase price (₹)"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm"
                />
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="">No category</option>
                  {(categories || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category"
                    className="flex-1 border border-border rounded-xl px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={addCategory} className="px-3 py-2 bg-[#111827] text-white rounded-xl text-xs font-bold">
                    Add
                  </button>
                </div>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm"
                />
                <input
                  type="number"
                  value={form.reorder_level}
                  onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
                  placeholder="Reorder level"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm"
                />
                <button type="submit" disabled={busy} className="w-full bg-primary text-white font-black py-3 rounded-xl">
                  {busy ? "Saving…" : editId ? "Update Item" : "Add Item"}
                </button>
                {editId && (
                  <button type="button" onClick={() => { setEditId(null); setForm(emptyForm); }} className="w-full text-sm text-gray-text">
                    Cancel edit
                  </button>
                )}
              </form>

              <div className="lg:col-span-2 bg-white rounded-3xl border border-border overflow-hidden">
                {isLoading && <p className="p-6 text-sm text-gray-text">Loading inventory…</p>}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="bg-section border-b border-border">
                      <tr>
                        {["Item", "Qty", "Unit", "Price", "Status", "Actions"].map((h) => (
                          <th key={h} className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(items || []).map((item) => (
                        <tr key={item.id} className="border-b border-border hover:bg-section">
                          <td className="p-4">
                            <p className="font-bold text-sm">{item.name}</p>
                            <p className="text-xs text-[#9CA3AF]">{item.category_name || "—"}</p>
                          </td>
                          <td className="p-4 text-sm">{Number(item.quantity)}</td>
                          <td className="p-4 text-sm">{item.unit}</td>
                          <td className="p-4 text-sm">₹{Number(item.purchase_price || 0).toFixed(0)}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              item.stock_status === "ok" ? "bg-emerald-50 text-emerald-700" :
                              item.stock_status === "low_stock" ? "bg-amber-50 text-amber-700" :
                              "bg-red-50 text-red-700"
                            }`}>
                              {item.stock_status?.replace("_", " ") || "ok"}
                            </span>
                          </td>
                          <td className="p-4 space-x-2">
                            <button type="button" onClick={() => startEdit(item)} className="text-xs font-bold text-foreground">Edit</button>
                            <button
                              type="button"
                              onClick={() => deleteInventoryItem(item.id).then(refresh)}
                              className="text-xs font-bold text-red-600 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!isLoading && !items?.length && (
                  <p className="p-8 text-center text-sm text-gray-text">No inventory items yet. Add your first ingredient.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
