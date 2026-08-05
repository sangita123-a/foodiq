"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Eye,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Unlock,
  KeyRound,
  Trash2,
  MoreVertical,
  Crown,
  User,
} from "lucide-react";
import { Badge, Pagination, EmptyState } from "@/components/admin/ui";
import type { Customer } from "@/services/customerAdminApi";

type Props = {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading?: boolean;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (id: string, checked: boolean) => void;
  onPageChange: (page: number) => void;
  onViewProfile: (customer: Customer) => void;
  onToggleVerify: (customer: Customer) => void;
  onToggleBlock: (customer: Customer) => void;
  onResetPassword: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
};

export default function CustomerTable({
  customers,
  total,
  page,
  limit,
  totalPages,
  isLoading,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onPageChange,
  onViewProfile,
  onToggleVerify,
  onToggleBlock,
  onResetPassword,
  onDeleteCustomer,
}: Props) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isAllSelected =
    customers.length > 0 && customers.every((c) => selectedIds.includes(c.id));

  if (isLoading) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 shadow-[var(--shadow-admin-soft)] mb-6 animate-pulse space-y-4">
        <div className="h-6 bg-section rounded w-1/4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-section rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] mb-6">
        <EmptyState
          icon={User}
          title="No Customers Found"
          description="Try adjusting your search keyword, date range, or status filters to find matching customer records."
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-section border-b border-border text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              <th className="py-3.5 px-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                  aria-label="Select all customers"
                />
              </th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">Registration</th>
              <th className="py-3.5 px-4">Verification</th>
              <th className="py-3.5 px-4 text-center">Orders (C/C/T)</th>
              <th className="py-3.5 px-4 text-right">Spending</th>
              <th className="py-3.5 px-4 text-right">Wallet</th>
              <th className="py-3.5 px-4 text-center">Rewards</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs font-medium text-gray-700">
            {customers.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <tr
                  key={c.id}
                  className={`hover:bg-section/50 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectRow(c.id, e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                      aria-label={`Select customer ${c.fullName}`}
                    />
                  </td>

                  {/* Customer Profile & ID */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-section border border-border shrink-0">
                        {c.avatarUrl ? (
                          <Image
                            src={c.avatarUrl}
                            alt={c.fullName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-gray-700 text-sm bg-section">
                            {c.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onViewProfile(c)}
                            className="font-bold text-foreground hover:text-primary truncate text-left"
                          >
                            {c.fullName}
                          </button>
                          {c.isPremium && (
                            <span title="Premium Customer">
                              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-[#9CA3AF] block truncate">
                          {c.customerId}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="py-3.5 px-4">
                    <div className="truncate max-w-[160px] font-semibold text-gray-800" title={c.email}>
                      {c.email}
                    </div>
                    <div className="text-[11px] text-gray-text font-mono">{c.phone}</div>
                  </td>

                  {/* City & State */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-800">{c.city}</div>
                    <div className="text-[11px] text-[#9CA3AF]">{c.state}</div>
                  </td>

                  {/* Registration Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-700">
                      {new Date(c.registrationDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>

                  {/* Verification Status */}
                  <td className="py-3.5 px-4">
                    {c.isVerified ? (
                      <Badge tone="info">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge tone="warning">
                        <ShieldAlert className="w-3 h-3" />
                        Unverified
                      </Badge>
                    )}
                  </td>

                  {/* Orders Breakdown */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="font-bold text-gray-800">
                      <span className="text-emerald-600">{c.completedOrders}</span> /{" "}
                      <span className="text-rose-500">{c.cancelledOrders}</span> /{" "}
                      <span className="text-foreground">{c.totalOrders}</span>
                    </div>
                    <span className="text-[10px] text-[#9CA3AF]">Comp / Canc / Total</span>
                  </td>

                  {/* Total Spending */}
                  <td className="py-3.5 px-4 text-right font-black text-foreground whitespace-nowrap">
                    ₹{c.totalSpending.toLocaleString("en-IN")}
                  </td>

                  {/* Wallet Balance */}
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                    ₹{c.walletBalance.toLocaleString("en-IN")}
                  </td>

                  {/* Reward Points */}
                  <td className="py-3.5 px-4 text-center">
                    <Badge tone="violet">{c.rewardPoints} pts</Badge>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    <Badge status={c.status}>{c.status}</Badge>
                  </td>

                  {/* Context Actions */}
                  <td className="py-3.5 px-4 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewProfile(c)}
                        className="p-1.5 hover:bg-section text-gray-600 rounded-lg transition-colors"
                        title="View Profile Drawer"
                      >
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                        className="p-1.5 hover:bg-section text-gray-500 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {activeMenuId === c.id && (
                      <div className="absolute right-4 mt-1 w-44 bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-lifted)] z-20 p-1.5 text-left space-y-0.5 animate-in fade-in">
                        <button
                          onClick={() => {
                            onViewProfile(c);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-section rounded-xl"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            onToggleVerify(c);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-section rounded-xl"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{c.isVerified ? "Mark Unverified" : "Verify Customer"}</span>
                        </button>
                        <button
                          onClick={() => {
                            onToggleBlock(c);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-section rounded-xl"
                        >
                          {c.status === "blocked" ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Unblock Customer</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5 text-amber-600" />
                              <span>Block Customer</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            onResetPassword(c);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-section rounded-xl"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Reset Password</span>
                        </button>
                        <button
                          onClick={() => {
                            onDeleteCustomer(c);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}
