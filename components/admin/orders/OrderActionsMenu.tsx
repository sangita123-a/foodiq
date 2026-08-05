"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Eye, Ban, RotateCcw, Download } from "lucide-react";
import { adminPut, adminPost, fetchOrderInvoiceBlob, downloadBlob } from "@/services/adminApi";
import { useToast } from "@/contexts/ToastContext";
import type { AdminOrderRow } from "@/services/adminApi";

export default function OrderActionsMenu({
  order,
  onViewDetails,
  onChanged,
}: {
  order: AdminOrderRow;
  onViewDetails: () => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const cancelOrder = async () => {
    setOpen(false);
    if (!confirm(`Cancel order #${order.id.slice(0, 8)}?`)) return;
    try {
      await adminPut(`/api/admin/orders/${order.id}`, { status: "Cancelled" });
      onChanged();
      showToast("Order cancelled", "success");
    } catch {
      showToast("Failed to cancel order", "error");
    }
  };

  const refundOrder = async () => {
    setOpen(false);
    if (!confirm(`Refund order #${order.id.slice(0, 8)} in full?`)) return;
    try {
      await adminPost(`/api/admin/orders/${order.id}/refund`, {});
      onChanged();
      showToast("Refund processed", "success");
    } catch {
      showToast("Failed to process refund", "error");
    }
  };

  const downloadInvoice = async () => {
    setOpen(false);
    try {
      const blob = await fetchOrderInvoiceBlob(order.id);
      downloadBlob(blob, `foodiq-invoice-${order.id.slice(0, 8)}.pdf`);
    } catch {
      showToast("Invoice unavailable for this order", "error");
    }
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Order actions"
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-section"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-border rounded-xl shadow-[var(--shadow-admin-lifted)] z-20 overflow-hidden text-sm">
          <button type="button" onClick={() => { setOpen(false); onViewDetails(); }} className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold">
            <Eye className="w-4 h-4" /> View Details
          </button>
          <button type="button" onClick={downloadInvoice} className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold border-t border-border">
            <Download className="w-4 h-4" /> Download Invoice
          </button>
          <button
            type="button"
            onClick={refundOrder}
            disabled={order.payment_status === "refunded"}
            className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold text-amber-600 border-t border-border disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" /> Refund
          </button>
          <button
            type="button"
            onClick={cancelOrder}
            disabled={order.status === "Cancelled"}
            className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold text-red-600 border-t border-border disabled:opacity-40"
          >
            <Ban className="w-4 h-4" /> Cancel Order
          </button>
        </div>
      )}
    </div>
  );
}
