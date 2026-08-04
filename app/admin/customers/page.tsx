"use client";

import { useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import CustomerStats from "@/components/admin/customers/CustomerStats";
import CustomerTopBar from "@/components/admin/customers/CustomerTopBar";
import CustomerTable from "@/components/admin/customers/CustomerTable";
import CustomerProfileModal from "@/components/admin/customers/CustomerProfileModal";
import CustomerBulkModal from "@/components/admin/customers/CustomerBulkModal";
import {
  exportCustomersToCSV,
  exportCustomersToExcel,
  exportCustomerToPDF,
} from "@/components/admin/customers/CustomerExport";
import {
  useCustomerStats,
  useCustomerList,
  useCustomerRealtimeUpdates,
} from "@/hooks/useAdminCustomers";
import {
  updateCustomerStatus,
  deleteCustomerAccount,
  resetCustomerPassword,
  performBulkCustomerActions,
  type CustomerFilters,
  type Customer,
} from "@/services/customerAdminApi";
import { Radio, Users } from "lucide-react";

export default function AdminCustomersPage() {
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    status: "",
    verification: "",
    city: "",
    state: "",
    startDate: "",
    endDate: "",
    orderRange: "",
    isPremium: "",
    sortBy: "newest",
    page: 1,
    limit: 10,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeProfileCustomer, setActiveProfileCustomer] = useState<Customer | null>(null);

  // Bulk Modal state
  const [bulkAction, setBulkAction] = useState<"verify" | "block" | "unblock" | "delete" | null>(null);

  // Toast / notification banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SWR hooks
  const { data: stats, isLoading: statsLoading, mutate: mutateStats } = useCustomerStats();
  const { data: customerData, isLoading: listLoading, path: swrPath } = useCustomerList(filters);
  const { onlineCustomersCount, liveEvents } = useCustomerRealtimeUpdates();

  const customers = customerData?.customers || [];
  const total = customerData?.total || 0;
  const page = customerData?.page || 1;
  const limit = customerData?.limit || 10;
  const totalPages = customerData?.totalPages || 1;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFilterChange = (newFilters: Partial<CustomerFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    if (swrPath) mutate(swrPath);
    mutateStats();
    showToast("Customer database refreshed");
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Single Actions
  const handleToggleVerify = async (cust: Customer) => {
    try {
      await updateCustomerStatus(cust.id, { isVerified: !cust.isVerified });
      if (swrPath) mutate(swrPath);
      mutateStats();
      showToast(`Updated verification status for ${cust.fullName}`);
    } catch {
      showToast("Failed to update verification status");
    }
  };

  const handleToggleBlock = async (cust: Customer) => {
    try {
      const nextStatus = cust.status === "blocked" ? "active" : "blocked";
      await updateCustomerStatus(cust.id, { status: nextStatus });
      if (swrPath) mutate(swrPath);
      mutateStats();
      showToast(`${nextStatus === "blocked" ? "Blocked" : "Unblocked"} customer ${cust.fullName}`);
    } catch {
      showToast("Failed to update account status");
    }
  };

  const handleResetPassword = async (cust: Customer) => {
    try {
      const res = await resetCustomerPassword(cust.id);
      showToast(`Password reset for ${cust.fullName}. Temp: ${res.temporaryPassword || "Check email"}`);
    } catch {
      showToast("Failed to reset password");
    }
  };

  const handleDeleteCustomer = async (cust: Customer) => {
    if (!confirm(`Are you sure you want to permanently delete account for ${cust.fullName}?`)) return;
    try {
      await deleteCustomerAccount(cust.id);
      if (swrPath) mutate(swrPath);
      mutateStats();
      if (activeProfileCustomer?.id === cust.id) setActiveProfileCustomer(null);
      showToast(`Deleted customer ${cust.fullName}`);
    } catch {
      showToast("Failed to delete customer");
    }
  };

  // Bulk Actions Confirm
  const handleConfirmBulk = async () => {
    if (!bulkAction || !selectedIds.length) return;
    try {
      const res = await performBulkCustomerActions({
        action: bulkAction,
        customerIds: selectedIds,
      });
      setSelectedIds([]);
      if (swrPath) mutate(swrPath);
      mutateStats();
      showToast(res.message || `Bulk action '${bulkAction}' completed`);
    } catch {
      showToast("Bulk operation failed");
    }
  };

  // Export handlers
  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (format === "csv") {
      exportCustomersToCSV(customers);
      showToast("Downloaded CSV report");
    } else if (format === "excel") {
      exportCustomersToExcel(customers);
      showToast("Downloaded Excel report");
    } else if (format === "pdf") {
      if (activeProfileCustomer) {
        exportCustomerToPDF(activeProfileCustomer);
      } else if (customers.length > 0) {
        exportCustomerToPDF(customers[0]);
      }
      showToast("Opened print PDF view");
    }
  };

  return (
    <AdminShell title="Customer Management">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-[#E23744] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Page Title & Live Counter Strip */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Customer Management Module
          </h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium">
            Monitor, audit, verify, support, and manage enterprise customer accounts.
          </p>
        </div>

        {/* Realtime Live Socket Indicator */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="w-4 h-4 text-emerald-500" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute inset-0 m-auto" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Live Socket</div>
              <div className="text-xs font-bold text-gray-900">Connected</div>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-100" />

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#E23744]" />
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Online Customers</div>
              <div className="text-xs font-black text-[#E23744]">{onlineCustomersCount} Live</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Registration Events Alert Banner */}
      {liveEvents.length > 0 && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>{liveEvents[0].message}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-mono">{liveEvents[0].timestamp}</span>
        </div>
      )}

      {/* Top Statistics Cards Strip */}
      <CustomerStats stats={stats} isLoading={statsLoading} />

      {/* Top Controls: Search, Refresh, Advanced Filters, Export, Sorting */}
      <CustomerTopBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
        selectedCount={selectedIds.length}
        onOpenBulkModal={(act) => setBulkAction(act)}
        isRefreshing={listLoading}
      />

      {/* Modern Customer Table */}
      <CustomerTable
        customers={customers}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        isLoading={listLoading}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onViewProfile={(cust) => setActiveProfileCustomer(cust)}
        onToggleVerify={handleToggleVerify}
        onToggleBlock={handleToggleBlock}
        onResetPassword={handleResetPassword}
        onDeleteCustomer={handleDeleteCustomer}
      />

      {/* Enterprise 9-Tab Customer Profile Modal */}
      <CustomerProfileModal
        isOpen={Boolean(activeProfileCustomer)}
        customer={activeProfileCustomer}
        onClose={() => setActiveProfileCustomer(null)}
        onToggleVerify={handleToggleVerify}
        onToggleBlock={handleToggleBlock}
        onResetPassword={handleResetPassword}
        onDeleteCustomer={handleDeleteCustomer}
        onRefreshData={handleRefresh}
      />

      {/* Bulk Operations Confirmation Modal */}
      <CustomerBulkModal
        isOpen={Boolean(bulkAction)}
        action={bulkAction}
        count={selectedIds.length}
        onClose={() => setBulkAction(null)}
        onConfirm={handleConfirmBulk}
      />
    </AdminShell>
  );
}
