"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  X,
  User,
  Store,
  Bike,
  Receipt,
  CreditCard,
  Printer,
  Download,
  Loader2,
  Star,
} from "lucide-react";
import {
  adminFetcher,
  adminPut,
  adminPost,
  formatCurrency,
  formatDate,
  fetchOrderInvoiceBlob,
  downloadBlob,
  type AdminOrderDetails,
} from "@/services/adminApi";
import { useAdminList } from "@/hooks/useAdminData";
import { useToast } from "@/contexts/ToastContext";
import OrderTimeline from "./OrderTimeline";

const PRIORITY_THRESHOLD = 500;

type Partner = { id: string; full_name?: string; is_available?: boolean };

export default function OrderDetailsDrawer({
  orderId,
  onClose,
  onChanged,
}: {
  orderId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const key = `/api/admin/orders/${orderId}`;
  const { data, isLoading, error, mutate } = useSWR<AdminOrderDetails>(key, adminFetcher);
  const { data: partners } = useAdminList<Partner[]>("/api/admin/delivery-partners?status=approved");
  const { showToast } = useToast();

  const [assignId, setAssignId] = useState("");
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const refreshAll = async () => {
    await mutate();
    onChanged();
  };

  const runAction = async (name: string, fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(name);
    try {
      await fn();
      await refreshAll();
      showToast(successMsg, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const cancelOrder = () => {
    if (!confirm("Cancel this order?")) return;
    runAction("cancel", () => adminPut(key, { status: "Cancelled" }), "Order cancelled");
  };

  const assignPartner = () => {
    if (!assignId) return;
    runAction("assign", () => adminPut(key, { delivery_partner_id: assignId }), "Delivery partner assigned");
  };

  const reschedule = () => {
    if (!rescheduleAt) return;
    runAction(
      "reschedule",
      () => adminPut(key, { scheduled_for: new Date(rescheduleAt).toISOString() }),
      "Order rescheduled"
    );
  };

  const refund = () => {
    if (!confirm("Process refund for this order?")) return;
    runAction(
      "refund",
      () =>
        adminPost(`${key}/refund`, {
          amount: refundAmount ? Number(refundAmount) : undefined,
          reason: refundReason || undefined,
        }),
      "Refund processed"
    );
  };

  const downloadInvoice = async (print: boolean) => {
    setBusy("invoice");
    try {
      const blob = await fetchOrderInvoiceBlob(orderId);
      if (print) {
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank");
        win?.addEventListener("load", () => win.print());
      } else {
        downloadBlob(blob, `foodiq-invoice-${orderId.slice(0, 8)}.pdf`);
      }
    } catch {
      showToast("Invoice unavailable for this order", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-foreground">
              Order #{orderId.slice(0, 8)}
              {data && Number(data.total_amount) >= PRIORITY_THRESHOLD && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full align-middle">
                  <Star className="w-3 h-3" /> Priority
                </span>
              )}
            </h2>
            {data && <p className="text-xs text-gray-text">{data.status}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-section"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading && (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-section rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600 mb-3">Failed to load order details.</p>
            <button
              type="button"
              onClick={() => mutate()}
              className="text-sm font-bold text-primary underline"
            >
              Retry
            </button>
          </div>
        )}

        {data && !isLoading && (
          <div className="p-6 space-y-6">
            {/* Customer / Restaurant / Delivery Partner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-section rounded-2xl p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#9CA3AF] mb-1">
                  <User className="w-3.5 h-3.5" /> Customer
                </p>
                <p className="text-sm font-bold">{data.customer_name}</p>
                <p className="text-xs text-gray-text">{data.customer_phone}</p>
                <p className="text-xs text-gray-text">{data.customer_email}</p>
              </div>
              <div className="bg-section rounded-2xl p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#9CA3AF] mb-1">
                  <Store className="w-3.5 h-3.5" /> Restaurant
                </p>
                <p className="text-sm font-bold">{data.restaurant_name}</p>
                <p className="text-xs text-gray-text">{data.restaurant_phone}</p>
              </div>
              <div className="bg-section rounded-2xl p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#9CA3AF] mb-1">
                  <Bike className="w-3.5 h-3.5" /> Delivery Partner
                </p>
                <p className="text-sm font-bold">{data.delivery_partner_name || "Not assigned"}</p>
                <p className="text-xs text-gray-text">{data.delivery_partner_phone}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-text mb-1">Delivery Address</p>
              <p className="text-sm">
                {[data.house_no, data.street, data.city, data.state, data.zip_code].filter(Boolean).join(", ") || "—"}
              </p>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-bold uppercase text-[#9CA3AF] mb-2">Ordered Items</p>
              <div className="space-y-2">
                {(data.items || []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm border-b border-border py-2">
                    <span>{item.quantity}× {item.name}</span>
                    <span className="font-bold">{formatCurrency(Number(item.price_at_time) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="bg-section rounded-2xl p-4 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(Number(data.subtotal || 0))} />
              <Row
                label={data.coupon_code ? `Discount (${data.coupon_code})` : "Discount"}
                value={`- ${formatCurrency(Number(data.discount_amount || 0))}`}
              />
              <Row label="Taxes" value={formatCurrency(Number(data.tax_amount || 0))} />
              <Row label="Delivery Charge" value={formatCurrency(Number(data.delivery_fee || 0))} />
              <Row label="Packing Charge" value="—" />
              <Row label="Platform Fee" value={formatCurrency(Number(data.platform_fee || 0))} />
              <div className="border-t border-border pt-2 mt-2">
                <Row label="Grand Total" value={formatCurrency(Number(data.total_amount || 0))} bold />
              </div>
            </div>

            {/* Payment */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#9CA3AF] mb-2">
                <CreditCard className="w-3.5 h-3.5" /> Payment Transaction
              </p>
              <div className="text-sm space-y-1">
                <Row label="Method" value={(data.payment_method || "—").replace(/_/g, " ")} />
                <Row label="Status" value={data.payment_status || "—"} />
                <Row label="Transaction ID" value={data.provider_transaction_id || data.razorpay_payment_id || "—"} />
                {data.refund_id && (
                  <Row
                    label="Refund"
                    value={`${formatCurrency(Number(data.refund_amount || 0))} · ${data.refund_status}`}
                  />
                )}
              </div>
            </div>

            {/* Invoice */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadInvoice(true)}
                disabled={busy === "invoice"}
                className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-section disabled:opacity-50"
              >
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
              <button
                type="button"
                onClick={() => downloadInvoice(false)}
                disabled={busy === "invoice"}
                className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-section disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-5 space-y-4">
              <p className="text-xs font-bold uppercase text-[#9CA3AF]">Actions</p>

              <div className="flex gap-2">
                <select
                  value={assignId}
                  onChange={(e) => setAssignId(e.target.value)}
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">
                    {data.delivery_partner_id ? "Reassign delivery partner…" : "Assign delivery partner…"}
                  </option>
                  {(partners || []).filter((p) => p.is_available !== false).map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name || p.id}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={assignPartner}
                  disabled={!assignId || busy === "assign"}
                  className="bg-primary text-white font-bold px-4 rounded-xl text-sm disabled:opacity-50"
                >
                  {busy === "assign" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={rescheduleAt}
                  onChange={(e) => setRescheduleAt(e.target.value)}
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={reschedule}
                  disabled={!rescheduleAt || busy === "reschedule"}
                  className="border border-border font-bold px-4 rounded-xl text-sm disabled:opacity-50 hover:bg-section"
                >
                  Reschedule
                </button>
              </div>

              <div className="bg-section rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-foreground">Refund</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={`Amount (default: full ${formatCurrency(Number(data.total_amount || 0))})`}
                    className="flex-1 border border-border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={refund}
                  disabled={busy === "refund"}
                  className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  {busy === "refund" ? "Processing…" : "Process Refund"}
                </button>
              </div>

              <button
                type="button"
                onClick={cancelOrder}
                disabled={busy === "cancel" || data.status === "Cancelled"}
                className="w-full border border-red-200 text-red-600 font-bold py-2.5 rounded-xl text-sm hover:bg-red-50 disabled:opacity-50"
              >
                {data.status === "Cancelled" ? "Order Cancelled" : "Cancel Order"}
              </button>
            </div>

            {/* Timeline */}
            <div className="border-t border-border pt-5">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#9CA3AF] mb-4">
                <Receipt className="w-3.5 h-3.5" /> Timeline
              </p>
              <OrderTimeline events={data.timeline || []} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-black text-foreground" : "text-gray-text"}>{label}</span>
      <span className={bold ? "font-black text-foreground" : "font-semibold text-foreground"}>{value}</span>
    </div>
  );
}
