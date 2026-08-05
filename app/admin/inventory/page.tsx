"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import StatCard from "@/components/admin/dashboard/StatCard";
import Badge from "@/components/admin/ui/Badge";
import EmptyState from "@/components/admin/ui/EmptyState";
import { Package, PackageX, AlertTriangle, Wallet, UtensilsCrossed } from "lucide-react";

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
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Restaurant Inventory Health</h1>
        <p className="text-gray-text">Platform-wide stock levels and food availability.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Items" value={totals.items} icon={Package} color="text-sky-600" bg="bg-sky-500/10" loading={isLoading && !data} />
        <StatCard label="Out of Stock" value={totals.out} icon={PackageX} color="text-red-600" bg="bg-red-500/10" loading={isLoading && !data} />
        <StatCard label="Low Stock" value={totals.low} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-500/10" loading={isLoading && !data} />
        <StatCard
          label="Inventory Value"
          value={totals.value}
          icon={Wallet}
          color="text-primary"
          bg="bg-primary/10"
          format={(n) => `₹${n.toLocaleString()}`}
          loading={isLoading && !data}
        />
        <StatCard label="Unavailable Dishes" value={totals.unavailable} icon={UtensilsCrossed} color="text-violet-600" bg="bg-violet-500/10" loading={isLoading && !data} />
      </div>

      <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-text">Loading…</p>
        ) : !data?.length ? (
          <EmptyState icon={Package} title="No inventory data" description="Restaurant stock levels will appear here once available." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-section">
                <tr>
                  {["Restaurant", "Items", "Out of Stock", "Low Stock", "Value", "Unavailable Dishes", "Status"].map((h) => (
                    <th key={h} className="p-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-section/50 transition-colors">
                    <td className="p-4 font-bold text-sm text-foreground">{r.name}</td>
                    <td className="p-4 text-sm text-foreground">{r.item_count}</td>
                    <td className="p-4 text-sm text-red-600 font-bold">{r.out_of_stock}</td>
                    <td className="p-4 text-sm text-amber-600 font-bold">{r.low_stock}</td>
                    <td className="p-4 text-sm text-foreground">₹{Number(r.inventory_value).toLocaleString()}</td>
                    <td className="p-4 text-sm text-foreground">{r.unavailable_dishes}</td>
                    <td className="p-4">
                      <Badge status={r.is_active ? "active" : "inactive"}>{r.is_active ? "Active" : "Inactive"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
