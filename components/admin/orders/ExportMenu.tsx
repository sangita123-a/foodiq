"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";
import { fetchOrdersExportBlob, downloadBlob, type AdminOrderFilters } from "@/services/adminApi";
import { useToast } from "@/contexts/ToastContext";

export default function ExportMenu({ filters }: { filters: AdminOrderFilters }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const run = async (format: "csv" | "pdf", filename: string) => {
    setOpen(false);
    setBusy(true);
    try {
      const blob = await fetchOrdersExportBlob(filters, format);
      downloadBlob(blob, filename);
      showToast("Export downloaded", "success");
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="flex items-center gap-2 bg-white border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground hover:bg-section disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {busy ? "Exporting…" : "Export"}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-2xl shadow-lg z-20 overflow-hidden">
          <button
            type="button"
            onClick={() => run("csv", "orders-export.csv")}
            className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-section"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => run("csv", "orders-export.xls")}
            className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-section border-t border-border"
          >
            Excel-compatible CSV
          </button>
          <button
            type="button"
            onClick={() => run("pdf", "orders-export.pdf")}
            className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-section border-t border-border"
          >
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
