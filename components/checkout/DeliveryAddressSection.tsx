"use client";

import Link from "next/link";
import { MapPin, Home, Briefcase, Plus, CheckCircle2 } from "lucide-react";

export type Address = {
  id: string;
  type: "Home" | "Work" | "Other";
  address: string;
  details: string;
};

type Props = {
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function DeliveryAddressSection({
  addresses,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="bg-section rounded-2xl p-6 border border-border mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Delivery Address
        </h3>
        <Link
          href="/saved-addresses"
          className="text-primary font-bold text-sm hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add New
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-gray-text">
          <p className="mb-4">No saved addresses yet.</p>
          <Link href="/saved-addresses" className="text-primary font-bold hover:underline">
            Add your first address
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const isSelected = selectedId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => onSelect(addr.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 relative ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(226, 55, 68,0.15)]"
                    : "border-border bg-white hover:border-primary/40"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-primary">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2 text-white font-bold">
                  {addr.type === "Home" ? (
                    <Home className="w-4 h-4 text-gray-text" />
                  ) : (
                    <Briefcase className="w-4 h-4 text-gray-text" />
                  )}
                  {addr.type}
                </div>
                <p className="text-sm text-gray-text mb-1">{addr.address}</p>
                <p className="text-xs text-[#9CA3AF]">{addr.details}</p>

                <div className="mt-4 flex gap-3 text-xs font-bold text-gray-text">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit?.(addr.id);
                    }}
                    className="hover:text-primary transition-colors"
                  >
                    EDIT
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete?.(addr.id);
                    }}
                    className="hover:text-primary transition-colors"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
