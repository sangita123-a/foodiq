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
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
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
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm mb-6 text-center space-y-3">
        <div className="w-16 h-16 bg-red-50 text-[#E23744] rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">No Customers Found</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Try adjusting your search keyword, date range, or status filters to find matching customer records.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <th className="py-3.5 px-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-[#E23744] focus:ring-[#E23744] cursor-pointer"
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
          <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
            {customers.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <tr
                  key={c.id}
                  className={`hover:bg-red-50/30 transition-colors ${
                    isSelected ? "bg-red-50/50" : ""
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectRow(c.id, e.target.checked)}
                      className="rounded border-gray-300 text-[#E23744] focus:ring-[#E23744] cursor-pointer"
                    />
                  </td>

                  {/* Customer Profile & ID */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        {c.avatarUrl ? (
                          <Image
                            src={c.avatarUrl}
                            alt={c.fullName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 text-sm bg-gray-200">
                            {c.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onViewProfile(c)}
                            className="font-bold text-gray-900 hover:text-[#E23744] truncate text-left"
                          >
                            {c.fullName}
                          </button>
                          {c.isPremium && (
                            <span title="Premium Customer">
                              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-gray-400 block truncate">
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
                    <div className="text-[11px] text-gray-500 font-mono">{c.phone}</div>
                  </td>

                  {/* City & State */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-800">{c.city}</div>
                    <div className="text-[11px] text-gray-400">{c.state}</div>
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                        Unverified
                      </span>
                    )}
                  </td>

                  {/* Orders Breakdown */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="font-bold text-gray-800">
                      <span className="text-emerald-600">{c.completedOrders}</span> /{" "}
                      <span className="text-rose-500">{c.cancelledOrders}</span> /{" "}
                      <span className="text-gray-900">{c.totalOrders}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Comp / Canc / Total</span>
                  </td>

                  {/* Total Spending */}
                  <td className="py-3.5 px-4 text-right font-black text-gray-900 whitespace-nowrap">
                    ₹{c.totalSpending.toLocaleString("en-IN")}
                  </td>

                  {/* Wallet Balance */}
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                    ₹{c.walletBalance.toLocaleString("en-IN")}
                  </td>

                  {/* Reward Points */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-lg border border-purple-100 text-[11px]">
                      {c.rewardPoints} pts
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {c.status === "active" && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    )}
                    {c.status === "blocked" && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Blocked
                      </span>
                    )}
                    {c.status === "suspended" && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Suspended
                      </span>
                    )}
                    {c.status === "deactivated" && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        Deactivated
                      </span>
                    )}
                  </td>

                  {/* Context Actions */}
                  <td className="py-3.5 px-4 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewProfile(c)}
                        className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                        title="View Profile Drawer"
                      >
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {activeMenuId === c.id && (
                      <div className="absolute right-4 mt-1 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-1.5 text-left space-y-0.5 animate-in fade-in">
                        <button
                          onClick={() => {
                            onViewProfile(c);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            onToggleVerify(c);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{c.isVerified ? "Mark Unverified" : "Verify Customer"}</span>
                        </button>
                        <button
                          onClick={() => {
                            onToggleBlock(c);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
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
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
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
      <div className="bg-gray-50/80 border-t border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-gray-600">
        <div>
          Showing <span className="font-bold text-gray-900">{(page - 1) * limit + 1}</span> to{" "}
          <span className="font-bold text-gray-900">
            {Math.min(page * limit, total)}
          </span>{" "}
          of <span className="font-bold text-gray-900">{total}</span> customers
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-bold bg-white border border-gray-200 rounded-lg">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
