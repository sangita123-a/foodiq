"use client";

import { useState, useMemo } from "react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import HistoryHeader from "@/components/partner/history/HistoryHeader";
import HistorySummary from "@/components/partner/history/HistorySummary";
import HistoryFilterBar from "@/components/partner/history/HistoryFilterBar";
import HistoryTable from "@/components/partner/history/HistoryTable";
import HistoryEmptyState from "@/components/partner/history/HistoryEmptyState";
import HistoryAnalytics from "@/components/partner/history/HistoryAnalytics";
import OrderDetailsModal from "@/components/partner/orders/OrderDetailsModal";
import { Order } from "@/components/partner/orders/types";

// --- Massive Historical Mock Dataset ---
const HISTORY_ORDERS: Order[] = [
  {
    id: "#ORD-8901",
    customerName: "Sanjay Gupta",
    customerPhone: "+91 98765 00001",
    deliveryAddress: "Flat 101, Prestige Oasis, Yelahanka",
    items: [
      { id: "1", name: "Family Pack Biryani", quantity: 1, price: 800 },
      { id: "2", name: "Coke 1L", quantity: 2, price: 90 }
    ],
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    subtotal: 980,
    taxes: 49,
    discount: 100,
    grandTotal: 929,
    orderTime: "2026-07-15 14:30",
    status: "Delivered",
    deliveryPartner: { name: "Anil Kumar", phone: "+91 88888 11111" }
  },
  {
    id: "#ORD-8902",
    customerName: "Neha Sharma",
    customerPhone: "+91 98765 00002",
    deliveryAddress: "Villa 5, Golden Enclave, HSR Layout",
    items: [
      { id: "3", name: "Veg Manchurian", quantity: 2, price: 200 }
    ],
    paymentMethod: "Card",
    paymentStatus: "Paid",
    subtotal: 400,
    taxes: 20,
    discount: 0,
    grandTotal: 420,
    orderTime: "2026-07-15 15:00",
    status: "Delivered",
    deliveryPartner: { name: "Rajesh", phone: "+91 88888 22222" }
  },
  {
    id: "#ORD-8903",
    customerName: "Arjun Reddy",
    customerPhone: "+91 98765 00003",
    deliveryAddress: "Appt 2B, Skyline, Indiranagar",
    items: [
      { id: "4", name: "Mutton Kebab", quantity: 3, price: 250 }
    ],
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Pending",
    subtotal: 750,
    taxes: 37,
    discount: 0,
    grandTotal: 787,
    orderTime: "2026-07-15 15:45",
    status: "Rejected"
  },
  {
    id: "#ORD-8904",
    customerName: "Kavya Iyer",
    customerPhone: "+91 98765 00004",
    deliveryAddress: "House 12, 4th Cross, Malleshwaram",
    items: [
      { id: "5", name: "Masala Dosa", quantity: 2, price: 80 },
      { id: "6", name: "Filter Coffee", quantity: 2, price: 40 }
    ],
    paymentMethod: "Wallet",
    paymentStatus: "Paid",
    subtotal: 240,
    taxes: 12,
    discount: 20,
    grandTotal: 232,
    orderTime: "2026-07-14 09:30",
    status: "Rejected"
  },
  {
    id: "#ORD-8905",
    customerName: "Rahul Dravid",
    customerPhone: "+91 98765 00005",
    deliveryAddress: "Indiranagar 100ft Road",
    items: [
      { id: "7", name: "Butter Chicken", quantity: 1, price: 320 }
    ],
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    subtotal: 320,
    taxes: 16,
    discount: 0,
    grandTotal: 336,
    orderTime: "2026-07-14 20:00",
    status: "Delivered",
    deliveryPartner: { name: "Suresh", phone: "+91 77665 54433" }
  }
];

export default function OrderHistoryPage() {
  const [orders] = useState<Order[]>(HISTORY_ORDERS);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Date (Newest)");

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Derived Data
  const filteredOrders = useMemo(() => {
    const result = orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) || 
                            order.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      const matchesPayment = paymentFilter === "All" || order.paymentMethod === paymentFilter;
      // Date range filtering is simulated here
      return matchesSearch && matchesStatus && matchesPayment;
    });

    // Sort Logic
    result.sort((a, b) => {
      if (sortBy === "Date (Newest)") {
        return new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime();
      } else if (sortBy === "Date (Oldest)") {
        return new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime();
      } else if (sortBy === "Amount (High to Low)") {
        return b.grandTotal - a.grandTotal;
      } else if (sortBy === "Amount (Low to High)") {
        return a.grandTotal - b.grandTotal;
      }
      return 0;
    });

    return result;
  }, [orders, search, statusFilter, paymentFilter, sortBy]);

  return (
    <div className="min-h-screen bg-section flex selection:bg-primary selection:text-white">
      
      {/* Sidebar - Fixed on left for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Header */}
        <PartnerHeader />

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            <HistoryHeader />
            
            <HistorySummary orders={orders} />

            <HistoryFilterBar 
              search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              dateRange={dateRange} setDateRange={setDateRange}
              paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter}
              sortBy={sortBy} setSortBy={setSortBy}
            />

            {filteredOrders.length > 0 ? (
              <HistoryTable orders={filteredOrders} onViewDetails={setSelectedOrder} />
            ) : (
              <HistoryEmptyState />
            )}

            <HistoryAnalytics />

          </div>
        </main>
      </div>

      {/* Reuse the OrderDetailsModal from live orders */}
      <OrderDetailsModal 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />

    </div>
  );
}
