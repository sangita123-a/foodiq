"use client";

import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import { Users } from "lucide-react";

const MOCK_CUSTOMERS = [
  { id: 1, name: "Jane Customer", orders: 12, spent: "₹4,280", lastOrder: "2 days ago" },
  { id: 2, name: "Rahul Sharma", orders: 8, spent: "₹2,950", lastOrder: "Yesterday" },
  { id: 3, name: "Priya Patel", orders: 15, spent: "₹6,120", lastOrder: "Today" },
  { id: 4, name: "Amit Verma", orders: 5, spent: "₹1,840", lastOrder: "5 days ago" },
];

export default function PartnerCustomersPage() {
  return (
    <div className="min-h-screen bg-section flex selection:bg-primary selection:text-white">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground">Customers</h1>
                <p className="text-gray-text">People who ordered from your restaurant</p>
              </div>
            </div>

            <div className="bg-background rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-gray-text text-sm">
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Orders</th>
                    <th className="px-6 py-4 font-medium">Total Spent</th>
                    <th className="px-6 py-4 font-medium">Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CUSTOMERS.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-section">
                      <td className="px-6 py-4 text-foreground font-medium">{c.name}</td>
                      <td className="px-6 py-4 text-gray-text">{c.orders}</td>
                      <td className="px-6 py-4 text-foreground font-bold">{c.spent}</td>
                      <td className="px-6 py-4 text-gray-text">{c.lastOrder}</td>
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
