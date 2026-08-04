"use client";

import { useState } from "react";
import { X, Ban, Bike, Download, Loader2 } from "lucide-react";
import { adminPost, downloadBlob, type AdminOrderRow, type AdminBulkResult } from "@/services/adminApi";
import { useAdminList } from "@/hooks/useAdminData";
import { useToast } from "@/contexts/ToastContext";

const STATUSES = ["Accepted", "Preparing", "Ready for Pickup", "Picked Up", "On The Way", "Delivered", "Cancelled"];

type Partner = { id: string; full_name?: string; is_available?: boolean };

const EXPORT_COLUMNS: Array<{ key: keyof AdminOrderRow; label: string }> = [
  { key: "id", label: "Order ID" },
  { key: "created_at", label: "Created" },
  { key: "customer_name", label: "Customer" },
  { key: "restaurant_name", label: "Restaurant" },
  { key: "delivery_partner_name", label: "Delivery Partner" },
  { key: "total_amount", label: "Total Amount" },
  { key: "payment_status", label: "Payment Status" },
  { key: "status", label: "Order Status" },
];

function rowsToCsv(rows: AdminOrderRow[]) {
  const header = EXPORT_COLUMNS.map((c) => c.label).join(",");
  const body = rows
    .map((r) => EXPORT_COLUMNS.map((c) => JSON.stringify(r[c.key] ?? "")).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export default function BulkActionBar({
  selectedIds,
  selectedRows,
  onClear,
  onChanged,
}: {
  selectedIds: string[];
  selectedRows: AdminOrderRow[];
  onClear: () => void;
  onChanged: () => void;
}) {
  const { data: partners } = useAdminList<Partner[]>("/api/admin/delivery-partners?status=approved");
  const { showToast } = useToast();
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPartner, setBulkPartner] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const reportResult = (result: AdminBulkResult, verb: string) => {
    if (result.partial) {
      showToast(`${result.succeeded.length} orders ${verb}, ${result.failed.length} failed`, "error");
    } else {
      showToast(`${result.succeeded.length} orders ${verb}`, "success");
    }
  };

  const bulkCancel = async () => {
    if (!confirm(`Cancel ${selectedIds.length} selected order(s)?`)) return;
    setBusy("cancel");
    try {
      const result = await adminPost<AdminBulkResult>("/api/admin/orders/bulk-cancel", { ids: selectedIds });
      reportResult(result, "cancelled");
      onChanged();
    } catch {
      showToast("Bulk cancel failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const bulkStatusUpdate = async () => {
    if (!bulkStatus) return;
    setBusy("status");
    try {
      const result = await adminPost<AdminBulkResult>("/api/admin/orders/bulk-status", {
        ids: selectedIds,
        status: bulkStatus,
      });
      reportResult(result, "updated");
      onChanged();
    } catch {
      showToast("Bulk status update failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const bulkAssign = async () => {
    if (!bulkPartner) return;
    setBusy("assign");
    try {
      const result = await adminPost<AdminBulkResult>("/api/admin/orders/bulk-assign", {
        ids: selectedIds,
        delivery_partner_id: bulkPartner,
      });
      reportResult(result, "assigned");
      onChanged();
    } catch {
      showToast("Bulk assign failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const bulkExport = () => {
    const blob = new Blob([rowsToCsv(selectedRows)], { type: "text/csv" });
    downloadBlob(blob, `orders-selection-${selectedIds.length}.csv`);
  };

  return (
    <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 bg-foreground text-white rounded-2xl px-5 py-3 shadow-lg">
      <span className="text-sm font-bold">{selectedIds.length} selected</span>

      <button type="button" onClick={bulkCancel} disabled={!!busy} className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg disabled:opacity-50">
        {busy === "cancel" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Bulk Cancel
      </button>

      <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1">
        <select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value)}
          className="bg-transparent text-xs font-bold text-white outline-none [&>option]:text-foreground"
        >
          <option value="">Set status…</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="button" onClick={bulkStatusUpdate} disabled={!bulkStatus || !!busy} className="text-xs font-bold px-2 py-1 disabled:opacity-40">
          {busy === "status" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
        </button>
      </div>

      <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1">
        <Bike className="w-3.5 h-3.5" />
        <select
          value={bulkPartner}
          onChange={(e) => setBulkPartner(e.target.value)}
          className="bg-transparent text-xs font-bold text-white outline-none [&>option]:text-foreground"
        >
          <option value="">Assign partner…</option>
          {(partners || []).filter((p) => p.is_available !== false).map((p) => (
            <option key={p.id} value={p.id}>{p.full_name || p.id}</option>
          ))}
        </select>
        <button type="button" onClick={bulkAssign} disabled={!bulkPartner || !!busy} className="text-xs font-bold px-2 py-1 disabled:opacity-40">
          {busy === "assign" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
        </button>
      </div>

      <button type="button" onClick={bulkExport} className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg">
        <Download className="w-3.5 h-3.5" /> Bulk Export
      </button>

      <button type="button" onClick={onClear} className="ml-auto flex items-center gap-1 text-xs font-bold text-white/70 hover:text-white">
        <X className="w-3.5 h-3.5" /> Clear selection
      </button>
    </div>
  );
}
