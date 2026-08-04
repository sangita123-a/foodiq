"use client";

import { useState } from "react";
import {
  Search,
  RotateCw,
  Filter,
  Download,
  CheckSquare,
  X,
  FileSpreadsheet,
  FileCode,
  FileText,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import type { CustomerFilters } from "@/services/customerAdminApi";

type Props = {
  filters: CustomerFilters;
  onFilterChange: (newFilters: Partial<CustomerFilters>) => void;
  onRefresh: () => void;
  onExport: (format: "csv" | "excel" | "pdf") => void;
  selectedCount: number;
  onOpenBulkModal: (action: "verify" | "block" | "unblock" | "delete") => void;
  isRefreshing?: boolean;
};

export default function CustomerTopBar({
  filters,
  onFilterChange,
  onRefresh,
  onExport,
  selectedCount,
  onOpenBulkModal,
  isRefreshing,
}: Props) {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const activeFilterCount =
    (filters.status ? 1 : 0) +
    (filters.verification ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.state ? 1 : 0) +
    (filters.orderRange ? 1 : 0) +
    (filters.isPremium ? 1 : 0);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search by ID, Name, Phone, Email..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E23744]/20 focus:border-[#E23744] transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "", page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm font-semibold transition-all disabled:opacity-50"
            title="Refresh list"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#E23744]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Filter Popover Toggle */}
          <button
            onClick={() => setShowFilterModal(!showFilterModal)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              activeFilterCount > 0
                ? "bg-red-50 border-red-200 text-[#E23744]"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#E23744] text-white text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Selector */}
          <select
            value={filters.sortBy || "newest"}
            onChange={(e) =>
              onFilterChange({ sortBy: e.target.value as CustomerFilters["sortBy"], page: 1 })
            }
            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E23744]/20"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="highest_spending">Sort: Highest Spending</option>
            <option value="most_orders">Sort: Most Orders</option>
            <option value="highest_rewards">Sort: Highest Rewards</option>
          </select>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm font-semibold transition-all"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 p-2 space-y-1 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    onExport("csv");
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={() => {
                    onExport("excel");
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>Export as Excel</span>
                </button>
                <button
                  onClick={() => {
                    onExport("pdf");
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <FileText className="w-4 h-4 text-[#E23744]" />
                  <span>Print PDF Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedCount > 0 && (
        <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#E23744]">
            <CheckSquare className="w-4 h-4" />
            <span>{selectedCount} customer(s) selected</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenBulkModal("verify")}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-all"
            >
              Verify Selected
            </button>
            <button
              onClick={() => onOpenBulkModal("block")}
              className="px-3 py-1.5 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-50 transition-all"
            >
              Block Selected
            </button>
            <button
              onClick={() => onOpenBulkModal("unblock")}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all"
            >
              Unblock Selected
            </button>
            <button
              onClick={() => onOpenBulkModal("delete")}
              className="px-3 py-1.5 bg-[#E23744] text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Detailed Filters Modal/Drawer */}
      {showFilterModal && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mt-2 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
              <SlidersHorizontal className="w-4 h-4 text-[#E23744]" />
              <span>Advanced Customer Filters</span>
            </div>
            <button
              onClick={() => {
                onFilterChange({
                  status: "",
                  verification: "",
                  city: "",
                  state: "",
                  orderRange: "",
                  isPremium: "",
                  page: 1,
                });
              }}
              className="text-xs text-[#E23744] hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Account Status Filter */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Account Status</label>
              <select
                value={filters.status || ""}
                onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#E23744]/20"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Verification</label>
              <select
                value={filters.verification || ""}
                onChange={(e) => onFilterChange({ verification: e.target.value, page: 1 })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#E23744]/20"
              >
                <option value="">All Verification</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">City</label>
              <input
                type="text"
                value={filters.city || ""}
                onChange={(e) => onFilterChange({ city: e.target.value, page: 1 })}
                placeholder="e.g. Mumbai"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#E23744]/20"
              />
            </div>

            {/* State Filter */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">State</label>
              <input
                type="text"
                value={filters.state || ""}
                onChange={(e) => onFilterChange({ state: e.target.value, page: 1 })}
                placeholder="e.g. Maharashtra"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#E23744]/20"
              />
            </div>

            {/* Total Orders Range */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Order Volume</label>
              <select
                value={filters.orderRange || ""}
                onChange={(e) => onFilterChange({ orderRange: e.target.value, page: 1 })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#E23744]/20"
              >
                <option value="">All Orders</option>
                <option value="0">0 Orders</option>
                <option value="1-5">1 - 5 Orders</option>
                <option value="6-20">6 - 20 Orders</option>
                <option value="20+">20+ Orders</option>
              </select>
            </div>

            {/* Premium Tier */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Premium Customer</label>
              <select
                value={filters.isPremium || ""}
                onChange={(e) => onFilterChange({ isPremium: e.target.value, page: 1 })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#E23744]/20"
              >
                <option value="">All Tiers</option>
                <option value="true">Premium / VIP Only</option>
                <option value="false">Standard Only</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
