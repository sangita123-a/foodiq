"use client";

import { useState } from "react";
import useSWR from "swr";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  formatCurrency,
  formatRelativeTime,
  type DeliveryTransactionsResponse,
} from "@/services/deliveryApi";
import { fetcher } from "@/services/api";

const PAGE_SIZE = 20;

export default function DeliveryTransactionsPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const hasToken = useAuthToken();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<"" | "credit" | "debit">("");
  const [status, setStatus] = useState<"" | "pending" | "completed" | "failed">("");

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(PAGE_SIZE));
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  const key = hasToken ? `/api/delivery/transactions?${params.toString()}` : null;

  const { data, error, isLoading } = useSWR<DeliveryTransactionsResponse>(key, fetcher);

  const transactions = data?.transactions || [];
  const pagination = data?.pagination;

  return (
    <DeliveryShell title="Transactions" online={dashboard?.is_online}>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Transaction History</h1>
          <p className="text-gray-text text-sm">All wallet credits and debits.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as "" | "credit" | "debit");
              setPage(1);
            }}
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | "pending" | "completed" | "failed");
              setPage(1);
            }}
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load transactions.
        </div>
      )}

      <section className="bg-white border border-border rounded-2xl overflow-hidden">
        {isLoading && (
          <p className="p-6 text-sm text-gray-text">Loading transactions...</p>
        )}
        <div className="divide-y divide-[#F3F4F6]">
          {transactions.map((tx) => (
            <div key={tx.id} className="px-5 py-4 flex justify-between gap-3">
              <div>
                <p className="font-bold text-foreground capitalize">
                  {tx.description || (tx.type === "credit" ? "Delivery earnings" : "Withdrawal")}
                </p>
                <p className="text-xs text-gray-text mt-1">
                  <span className="capitalize">{tx.status}</span>
                  {tx.order_id ? ` · Order #${tx.order_id.slice(0, 8)}` : ""} ·{" "}
                  {formatRelativeTime(tx.created_at)}
                </p>
              </div>
              <p
                className={`font-black shrink-0 ${
                  tx.type === "credit" ? "text-emerald-600" : "text-foreground"
                }`}
              >
                {tx.type === "credit" ? "+" : "-"}
                {formatCurrency(Number(tx.amount))}
              </p>
            </div>
          ))}
          {!transactions.length && !isLoading && (
            <p className="p-8 text-sm text-gray-text text-center">No transactions yet.</p>
          )}
        </div>
      </section>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-text">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} transactions
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </DeliveryShell>
  );
}
