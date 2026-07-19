"use client";

import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";
import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { partnerFetcher, formatCurrency } from "@/services/partnerApi";

type Settlements = {
  summary: {
    today: number;
    week: number;
    month: number;
    paid_orders: number;
    pending_payments: number;
    commission_percent: number;
    commission_amount: number;
    net_payout: number;
  };
  paid_orders: Array<{
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    payment_status: string;
    payment_method: string;
  }>;
};

export default function PartnerEarningsPage() {
  const hasToken = useAuthToken();
  const { data, isLoading, error } = useSWR<Settlements>(
    hasToken ? "/api/partner/settlements" : null,
    partnerFetcher
  );

  const summary = data?.summary;
  const cards = [
    {
      label: "Today's Earnings",
      value: formatCurrency(summary?.today || 0),
      icon: Wallet,
      tone: "text-green-400",
    },
    {
      label: "This Week",
      value: formatCurrency(summary?.week || 0),
      icon: TrendingUp,
      tone: "text-blue-400",
    },
    {
      label: "This Month (Gross)",
      value: formatCurrency(summary?.month || 0),
      icon: DollarSign,
      tone: "text-yellow-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-[#E23744] selection:text-white">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-[#111827] mb-2">Earnings & Settlements</h1>
              <p className="text-[#6B7280]">
                Paid orders, payment status, and settlement estimates
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Unable to load settlements.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {cards.map((item) => (
                <div key={item.label} className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <item.icon className={`w-5 h-5 ${item.tone}`} />
                    <span className="text-[#6B7280] text-sm font-medium">{item.label}</span>
                  </div>
                  <p className="text-3xl font-black text-[#111827]">
                    {isLoading ? "…" : item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase mb-1">Commission</p>
                <p className="text-xl font-black text-[#111827]">
                  {summary?.commission_percent || 0}% ·{" "}
                  {formatCurrency(summary?.commission_amount || 0)}
                </p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase mb-1">Net Payout (Month)</p>
                <p className="text-xl font-black text-emerald-600">
                  {formatCurrency(summary?.net_payout || 0)}
                </p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase mb-1">Paid / Pending</p>
                <p className="text-xl font-black text-[#111827]">
                  {summary?.paid_orders || 0} / {summary?.pending_payments || 0}
                </p>
              </div>
            </div>

            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB]">
                <h2 className="text-xl font-bold text-[#111827]">Paid Orders</h2>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#6B7280] text-sm">
                    <th className="px-6 py-4 font-medium">Order</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium">Payment</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.paid_orders || []).map((o) => (
                    <tr key={o.id} className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4 text-[#111827] font-mono text-sm">
                        #{o.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-[#6B7280] capitalize">
                        {(o.payment_method || "").replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            o.payment_status === "completed"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-yellow-500/10 text-yellow-600"
                          }`}
                        >
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#111827] font-bold">
                        {formatCurrency(Number(o.total_amount))}
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">{o.status}</td>
                    </tr>
                  ))}
                  {!data?.paid_orders?.length && !isLoading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-[#6B7280] text-sm">
                        No paid orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
