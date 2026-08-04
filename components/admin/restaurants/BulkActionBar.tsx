"use client";

import { useState } from "react";
import { X, CheckCircle2, Ban, XCircle, Trash2, Download, Loader2 } from "lucide-react";
import { bulkRestaurantAction, downloadBlob, type AdminRestaurantRow, type AdminRestaurantBulkResult } from "@/services/adminApi";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "./ConfirmDialog";

const EXPORT_COLUMNS: Array<{ key: keyof AdminRestaurantRow; label: string }> = [
  { key: "id", label: "Restaurant ID" },
  { key: "name", label: "Restaurant Name" },
  { key: "owner_name", label: "Owner" },
  { key: "city", label: "City" },
  { key: "approval_status", label: "Status" },
  { key: "rating", label: "Rating" },
  { key: "revenue_today", label: "Revenue Today" },
];

function rowsToCsv(rows: AdminRestaurantRow[]) {
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
  selectedRows: AdminRestaurantRow[];
  onClear: () => void;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const reportResult = (result: AdminRestaurantBulkResult, verb: string) => {
    if (result.partial) {
      showToast(`${result.succeeded.length} restaurants ${verb}, ${result.failed.length} failed`, "error");
    } else {
      showToast(`${result.succeeded.length} restaurants ${verb}`, "success");
    }
  };

  const run = async (action: "approve" | "reject" | "suspend" | "delete", verb: string, needsReason = false) => {
    let reason: string | undefined;
    if (needsReason) {
      reason = prompt(`Reason for ${action === "reject" ? "rejecting" : "this action on"} ${selectedIds.length} restaurant(s):`) || undefined;
      if (action === "reject" && !reason) {
        showToast("A reason is required to bulk reject", "error");
        return;
      }
    }
    setBusy(action);
    try {
      const result = await bulkRestaurantAction(selectedIds, action, reason);
      reportResult(result, verb);
      onChanged();
      if (action === "delete") setConfirmingDelete(false);
    } catch {
      showToast(`Bulk ${action} failed`, "error");
    } finally {
      setBusy(null);
    }
  };

  const bulkExport = () => {
    const blob = new Blob([rowsToCsv(selectedRows)], { type: "text/csv" });
    downloadBlob(blob, `restaurants-selection-${selectedIds.length}.csv`);
  };

  return (
    <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 bg-foreground text-white rounded-2xl px-5 py-3 shadow-lg">
      <span className="text-sm font-bold">{selectedIds.length} selected</span>

      <button type="button" onClick={() => run("approve", "approved")} disabled={!!busy} className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg disabled:opacity-50">
        {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
      </button>

      <button type="button" onClick={() => run("reject", "rejected", true)} disabled={!!busy} className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg disabled:opacity-50">
        {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
      </button>

      <button type="button" onClick={() => run("suspend", "suspended", true)} disabled={!!busy} className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg disabled:opacity-50">
        {busy === "suspend" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Suspend
      </button>

      <button type="button" onClick={bulkExport} className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg">
        <Download className="w-3.5 h-3.5" /> Bulk Export
      </button>

      <button type="button" onClick={() => setConfirmingDelete(true)} disabled={!!busy} className="flex items-center gap-1.5 text-xs font-bold bg-red-500/80 hover:bg-red-500 px-3 py-2 rounded-lg disabled:opacity-50">
        {busy === "delete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
      </button>

      <button type="button" onClick={onClear} className="ml-auto flex items-center gap-1 text-xs font-bold text-white/70 hover:text-white">
        <X className="w-3.5 h-3.5" /> Clear selection
      </button>

      {confirmingDelete && (
        <ConfirmDialog
          title={`Remove ${selectedIds.length} restaurant(s)?`}
          message="This hides the selected restaurants from listings and search. It is reversible on request, and does not delete their order or review history."
          confirmLabel="Remove Restaurants"
          busy={busy === "delete"}
          onConfirm={() => run("delete", "deleted")}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
