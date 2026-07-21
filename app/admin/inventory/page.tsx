"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";

type RestaurantInventoryRow = {
  id: string;
  name: string;
  is_active?: boolean;
  item_count: number;
  out_of_stock: number;
  low_stock: number;
  inventory_value: number;
  unavailable_dishes: number;
};

export default function AdminInventoryPage() {
  const { data, isLoading } = useAdminList<RestaurantInventoryRow[]>("/api/admin/inventory");

  const totals = (data || []).reduce(
    (acc, r) => ({
      items: acc.items + r.item_count,
      out: acc.out + r.out_of_stock,
      low: acc.low + r.low_stock,
      value: acc.value + Number(r.inventory_value),
      unavailable: acc.unavailable + r.unavailable_dishes,
    }),
    { items: 0, out: 0, low: 0, value: 0, unavailable: 0 }
  );

  return (
    <AdminShell title="Inventory Monitor">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground">Restaurant Inventory Health</h1>
        <p className="text-gray-text">Platform-wide stock levels and food availability.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Items", value: totals.items },
          { label: "Out of Stock", value: totals.out },
          { label: "Low Stock", value: totals.low },
          { label: "Inventory Value", value: `₹${totals.value.toLocaleString()}` },
          { label: "Unavailable Dishes", value: totals.unavailable },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-border rounded-2xl p-5">
            <p className="text-xs font-bold uppercase text-[#9CA3AF] mb-1">{c.label}</p>
            <p className="text-2xl font-black text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-border overflow-hidden">
        {isLoading && <p className="p-6 text-sm text-gray-text">Loading…</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-section border-b border-border">
              <tr>
                {["Restaurant", "Items", "Out of Stock", "Low Stock", "Value", "Unavailable Dishes", "Status"].map((h) => (
                  <th key={h} className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data || []).map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="p-4 font-bold text-sm">{r.name}</td>
                  <td className="p-4 text-sm">{r.item_count}</td>
                  <td className="p-4 text-sm text-red-600 font-bold">{r.out_of_stock}</td>
                  <td className="p-4 text-sm text-amber-600 font-bold">{r.low_stock}</td>
                  <td className="p-4 text-sm">₹{Number(r.inventory_value).toLocaleString()}</td>
                  <td className="p-4 text-sm">{r.unavailable_dishes}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {r.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
