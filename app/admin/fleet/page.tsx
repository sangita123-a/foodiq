"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
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
          <h1 className="text-3xl font-black text-foreground">Fleet</h1>
          <p className="text-gray-text">
            Vehicles and assignments (Foodiq 4.0 foundation).
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="bg-white rounded-3xl border border-border p-6">
        <h2 className="font-bold text-lg mb-4">Vehicles</h2>
        <div className="space-y-2">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="flex justify-between text-sm border-b border-border py-2"
            >
              <div>
                <p className="font-bold">{v.label}</p>
                <p className="text-xs text-gray-text">
                  {v.vehicle_type} · capacity {v.capacity}
                </p>
              </div>
              <p className="font-bold text-gray-text">
                {v.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          ))}
          {!vehicles.length && (
            <p className="text-sm text-gray-text">No vehicles yet.</p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
