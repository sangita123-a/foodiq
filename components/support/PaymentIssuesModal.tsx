"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Download, RotateCcw, Eye } from "lucide-react";
import SupportModal from "@/components/support/SupportModal";
import {
  SupportEmptyState,
  SupportErrorState,
  SupportSkeleton,
} from "@/components/support/SupportStates";
import {
  downloadInvoice,
  fetchPaymentDetail,
  fetchPayments,
  fetchRefund,
  retryPayment,
  type PaymentRecord,
} from "@/services/supportApi";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  open: boolean;
  onClose: () => void;
  variant?: "modal" | "page";
};

export default function PaymentIssuesModal({ open, onClose, variant = "modal" }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<PaymentRecord | null>(null);
  const [refundInfo, setRefundInfo] = useState<Record<string, unknown> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    data: payments = [],
    error,
    isLoading: loading,
    mutate: load,
  } = useSWR(open ? "/api/payments" : null, fetchPayments);

  const list = Array.isArray(payments) ? payments : [];
  const failed = list.filter((p) => /fail/i.test(String(p.status || "")));
  const history = list;
  const errorMessage =
    error &&
    ((error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      "Failed to load payments");

  const openDetails = async (p: PaymentRecord) => {
    setBusyId(p.id);
    try {
      const detail = await fetchPaymentDetail(p.id);
      setSelected(detail);
      const refundId = detail.refund?.id || detail.refund_request?.id;
      if (refundId) {
        try {
          setRefundInfo(await fetchRefund(refundId));
        } catch {
          setRefundInfo(detail.refund || detail.refund_request || null);
        }
      } else {
        setRefundInfo(null);
      }
    } catch {
      showToast("Could not load payment details", "error");
    } finally {
      setBusyId(null);
    }
  };

  const onRetry = async (p: PaymentRecord) => {
    setBusyId(p.id);
    try {
      const result = await retryPayment({ payment_id: p.id, order_id: p.order_id });
      showToast("Payment retry started", "success");
      if (result.checkout_hint) {
        onClose();
        router.push(result.checkout_hint);
        return;
      }
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Retry failed";
      showToast(msg, "error");
      showToast("Payment Failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const onInvoice = async (p: PaymentRecord) => {
    setBusyId(p.id);
    try {
      const blob = await downloadInvoice(p.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foodiq-invoice-${String(p.id).slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Invoice downloaded", "success");
    } catch {
      showToast("Could not download invoice", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SupportModal open={open} onClose={onClose} title="Payment Issues" wide variant={variant}>
      {loading ? <SupportSkeleton rows={4} /> : null}
      {!loading && errorMessage ? (
        <SupportErrorState message={errorMessage} onRetry={() => void load()} />
      ) : null}
      {!loading && !errorMessage && history.length === 0 ? (
        <SupportEmptyState
          title="No payments yet"
          description="Your payment history will appear here after you place an order."
        />
      ) : null}

      {!loading && !errorMessage && history.length > 0 ? (
        <div className="space-y-8">
          {failed.length > 0 ? (
            <section>
              <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-red-500">
                Failed Transactions
              </h3>
              <div className="space-y-3">
                {failed.map((p) => (
                  <PaymentRow
                    key={`f-${p.id}`}
                    payment={p}
                    busy={busyId === p.id}
                    onDetails={() => openDetails(p)}
                    onRetry={() => onRetry(p)}
                    onInvoice={() => onInvoice(p)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-[#9CA3AF]">
              Payment History
            </h3>
            <div className="space-y-3">
              {history.map((p) => (
                <PaymentRow
                  key={p.id}
                  payment={p}
                  busy={busyId === p.id}
                  onDetails={() => openDetails(p)}
                  onRetry={
                    /fail|pending/i.test(String(p.status || "")) ? () => onRetry(p) : undefined
                  }
                  onInvoice={() => onInvoice(p)}
                />
              ))}
            </div>
          </section>

          {selected ? (
            <section className="rounded-2xl border border-border bg-white p-5">
              <h3 className="mb-4 text-lg font-bold text-foreground">Payment Details</h3>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <Detail label="Payment ID" value={String(selected.id).slice(0, 8).toUpperCase()} />
                <Detail label="Status" value={String(selected.status || "—")} />
                <Detail
                  label="Amount"
                  value={`₹${Number(selected.amount || 0).toLocaleString("en-IN")}`}
                />
                <Detail label="Method" value={String(selected.method || "—")} />
                <Detail
                  label="Order"
                  value={
                    selected.order_id
                      ? String(selected.order_id).slice(0, 8).toUpperCase()
                      : "—"
                  }
                />
                <Detail
                  label="Refund Status"
                  value={
                    (refundInfo?.status as string) ||
                    selected.refund?.status ||
                    selected.refund_request?.status ||
                    "No refund"
                  }
                />
              </dl>
            </section>
          ) : null}
        </div>
      ) : null}
    </SupportModal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{label}</dt>
      <dd className="font-bold text-foreground">{value}</dd>
    </div>
  );
}

function PaymentRow({
  payment,
  busy,
  onDetails,
  onRetry,
  onInvoice,
}: {
  payment: PaymentRecord;
  busy?: boolean;
  onDetails: () => void;
  onRetry?: () => void;
  onInvoice: () => void;
}) {
  const failed = /fail/i.test(String(payment.status || ""));
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-foreground">
          ₹{Number(payment.amount || 0).toLocaleString("en-IN")} · {payment.method || "Payment"}
        </p>
        <p className="text-xs font-bold text-[#9CA3AF]">
          {payment.created_at
            ? new Date(payment.created_at).toLocaleString("en-IN")
            : String(payment.id).slice(0, 8)}{" "}
          · <span className={failed ? "text-red-500" : "text-foreground"}>{payment.status}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onDetails}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-section px-3 py-2 text-xs font-bold text-foreground"
        >
          <Eye className="h-3.5 w-3.5" /> Details
        </button>
        {onRetry ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry Payment
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={onInvoice}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-section px-3 py-2 text-xs font-bold text-foreground"
        >
          <Download className="h-3.5 w-3.5" /> Invoice
        </button>
      </div>
    </div>
  );
}
