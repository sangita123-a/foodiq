"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import Badge from "@/components/admin/ui/Badge";
import EmptyState from "@/components/admin/ui/EmptyState";
import { Truck } from "lucide-react";

type Vehicle = {
  id: string;
  label: string;
  vehicle_type: string;
  capacity: number;
  is_active: boolean;
  market_id?: string;
};

export default function AdminFleetPage() {
  const { data, isLoading } = useAdminList<Vehicle[]>("/api/admin/v4/fleet");
  const vehicles = Array.isArray(data) ? data : [];

  return (
    <AdminShell title="Fleet Management">
      <div className="mb-6 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Truck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Fleet</h1>
          <p className="text-gray-text">
            Vehicles and assignments (Foodiq 4.0 foundation).
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-5 sm:p-6">
        <h2 className="text-lg font-black text-foreground tracking-tight mb-4">Vehicles</h2>
        {isLoading ? (
          <p className="text-sm text-gray-text py-4">Loading…</p>
        ) : vehicles.length ? (
          <div className="space-y-1">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 text-sm border-b border-border last:border-b-0 py-3"
              >
                <div>
                  <p className="font-bold text-foreground">{v.label}</p>
                  <p className="text-xs text-gray-text mt-0.5">
                    {v.vehicle_type} · capacity {v.capacity}
                  </p>
                </div>
                <Badge status={v.is_active ? "active" : "inactive"}>
                  {v.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Truck} title="No vehicles yet" description="Fleet vehicles will appear here once added." />
        )}
      </div>
    </AdminShell>
  );
}
