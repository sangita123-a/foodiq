"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import {
  inventoryFetcher,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createPurchase,
  receivePurchase,
  type Supplier,
  type PurchaseOrder,
  type InventoryItem,
} from "@/services/partnerInventoryApi";
import { Truck, ShoppingCart } from "lucide-react";

type Tab = "suppliers" | "purchases";

export default function PartnerSuppliersPage() {
  const [tab, setTab] = useState<Tab>("suppliers");
  const { data: suppliers } = useSWR<Supplier[]>("/api/partner/inventory/suppliers", inventoryFetcher);
  const { data: purchases } = useSWR<PurchaseOrder[]>("/api/partner/inventory/purchases", inventoryFetcher);
  const { data: items } = useSWR<InventoryItem[]>("/api/partner/inventory/items", inventoryFetcher);
  const [supplierForm, setSupplierForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "" });
  const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
  const [poForm, setPoForm] = useState({
    supplier_id: "",
    notes: "",
    item_id: "",
    quantity: 1,
    unit_price: 0,
  });

  const refresh = () => {
    mutate("/api/partner/inventory/suppliers");
    mutate("/api/partner/inventory/purchases");
    mutate("/api/partner/inventory/items");
  };

  const saveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editSupplierId) await updateSupplier(editSupplierId, supplierForm);
    else await createSupplier(supplierForm);
    setSupplierForm({ name: "", contact_person: "", phone: "", email: "", address: "" });
    setEditSupplierId(null);
    refresh();
  };

  const createPo = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItem = (items || []).find((i) => i.id === poForm.item_id);
    await createPurchase({
      supplier_id: poForm.supplier_id || null,
      notes: poForm.notes,
      status: "ordered",
      items: [
        {
          inventory_item_id: poForm.item_id,
          item_name: selectedItem?.name,
          quantity: poForm.quantity,
          unit: selectedItem?.unit || "pieces",
          unit_price: poForm.unit_price,
        },
      ],
    });
    setPoForm({ supplier_id: "", notes: "", item_id: "", quantity: 1, unit_price: 0 });
    refresh();
  };

  return (
    <div className="min-h-screen bg-section flex">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-black text-foreground">Suppliers & Purchases</h1>
              <p className="text-gray-text">Manage suppliers and receive stock into inventory.</p>
            </div>

            <div className="flex gap-2">
              {(["suppliers", "purchases"] as Tab[]).map((t) => (
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

            {tab === "suppliers" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={saveSupplier} className="bg-white rounded-3xl border border-border p-6 space-y-3">
                  <h2 className="font-black flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> {editSupplierId ? "Edit" : "Add"} Supplier</h2>
                  {(["name", "contact_person", "phone", "email"] as const).map((f) => (
                    <input
                      key={f}
                      value={supplierForm[f]}
                      onChange={(e) => setSupplierForm({ ...supplierForm, [f]: e.target.value })}
                      placeholder={f.replace("_", " ")}
                      required={f === "name"}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm capitalize"
                    />
                  ))}
                  <textarea
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    placeholder="Address"
                    rows={2}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm"
                  />
                  <button type="submit" className="w-full bg-[#111827] text-white font-black py-3 rounded-xl">Save Supplier</button>
                </form>
                <div className="bg-white rounded-3xl border border-border p-6 space-y-3">
                  {(suppliers || []).map((s) => (
                    <div key={s.id} className="flex justify-between items-start border border-border rounded-xl p-4">
                      <div>
                        <p className="font-bold">{s.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{s.phone} · {s.purchase_count || 0} orders</p>
                      </div>
                      <div className="space-x-2">
                        <button type="button" onClick={() => { setEditSupplierId(s.id); setSupplierForm({ name: s.name, contact_person: s.contact_person || "", phone: s.phone || "", email: s.email || "", address: s.address || "" }); }} className="text-xs font-bold">Edit</button>
                        <button type="button" onClick={() => deleteSupplier(s.id).then(refresh)} className="text-xs font-bold text-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "purchases" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={createPo} className="bg-white rounded-3xl border border-border p-6 space-y-3">
                  <h2 className="font-black flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" /> Create Purchase Order</h2>
                  <select value={poForm.supplier_id} onChange={(e) => setPoForm({ ...poForm, supplier_id: e.target.value })} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm">
                    <option value="">Select supplier</option>
                    {(suppliers || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={poForm.item_id} onChange={(e) => setPoForm({ ...poForm, item_id: e.target.value })} required className="w-full border border-border rounded-xl px-4 py-2.5 text-sm">
                    <option value="">Select inventory item</option>
                    {(items || []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={poForm.quantity} onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })} placeholder="Qty" className="border border-border rounded-xl px-4 py-2.5 text-sm" />
                    <input type="number" value={poForm.unit_price} onChange={(e) => setPoForm({ ...poForm, unit_price: Number(e.target.value) })} placeholder="Unit price ₹" className="border border-border rounded-xl px-4 py-2.5 text-sm" />
                  </div>
                  <textarea value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })} placeholder="Notes" rows={2} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm" />
                  <button type="submit" className="w-full bg-primary text-white font-black py-3 rounded-xl">Create PO</button>
                </form>
                <div className="bg-white rounded-3xl border border-border p-6 space-y-3">
                  <h2 className="font-black text-foreground">Purchase History</h2>
                  {(purchases || []).map((p) => (
                    <div key={p.id} className="border border-border rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">#{String(p.id).slice(0, 8)} · {p.supplier_name || "No supplier"}</p>
                        <p className="text-xs text-[#9CA3AF]">₹{Number(p.total_amount).toFixed(0)} · {p.status} · {p.item_count} items</p>
                      </div>
                      {p.status !== "received" && (
                        <button type="button" onClick={() => receivePurchase(p.id).then(refresh)} className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg">
                          Receive Stock
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
