"use client";

import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";

const SUMMARY = [
  { label: "Today's Earnings", value: "₹12,450", icon: Wallet, tone: "text-green-400" },
  { label: "This Week", value: "₹78,200", icon: TrendingUp, tone: "text-blue-400" },
  { label: "This Month", value: "₹2,85,000", icon: DollarSign, tone: "text-yellow-400" },
];

const PAYOUTS = [
  { id: "P-1001", date: "12 Jul 2026", amount: "₹42,500", status: "Paid" },
  { id: "P-1002", date: "05 Jul 2026", amount: "₹38,900", status: "Paid" },
  { id: "P-1003", date: "28 Jun 2026", amount: "₹45,200", status: "Paid" },
];

export default function PartnerEarningsPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] flex selection:bg-[var(--color-primary)] selection:text-white">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-2">Earnings</h1>
              <p className="text-gray-400">Track revenue and payout history for your restaurant</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {SUMMARY.map((item) => (
                <div key={item.label} className="bg-[#171717] rounded-2xl border border-white/5 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <item.icon className={`w-5 h-5 ${item.tone}`} />
                    <span className="text-gray-400 text-sm font-medium">{item.label}</span>
                  </div>
                  <p className="text-3xl font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#171717] rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">Recent Payouts</h2>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm">
                    <th className="px-6 py-4 font-medium">Payout ID</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PAYOUTS.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4 text-white font-mono text-sm">{p.id}</td>
                      <td className="px-6 py-4 text-gray-300">{p.date}</td>
                      <td className="px-6 py-4 text-white font-bold">{p.amount}</td>
                      <td className="px-6 py-4">
                        <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
