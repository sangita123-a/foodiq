"use client";

import { useState, useMemo } from "react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import OrdersHeader from "@/components/partner/orders/OrdersHeader";
import OrdersSummary from "@/components/partner/orders/OrdersSummary";
import OrdersFilterBar from "@/components/partner/orders/OrdersFilterBar";
import OrdersList from "@/components/partner/orders/OrdersList";
import OrdersKanban from "@/components/partner/orders/OrdersKanban";
import OrderDetailsModal from "@/components/partner/orders/OrderDetailsModal";
import { Order, OrderStatus } from "@/components/partner/orders/types";

// --- Mock Dataset ---
const INITIAL_ORDERS: Order[] = [
  {
    id: "#ORD-9021",
    customerName: "Rahul Sharma",
    customerPhone: "+91 98765 43210",
    deliveryAddress: "Flat 402, Sunshine Apartments, MG Road, Bangalore",
    items: [
      { id: "1", name: "Hyderabadi Chicken Dum Biryani", quantity: 2, price: 300, customizations: ["Extra Raita", "Double Masala"] },
      { id: "2", name: "Diet Coke", quantity: 1, price: 60 }
    ],
    specialInstructions: "Please make the biryani extra spicy and ring the doorbell twice.",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    subtotal: 660,
    taxes: 33,
    discount: 50,
    grandTotal: 643,
    orderTime: "12:45 PM",
    status: "New"
  },
  {
    id: "#ORD-9022",
    customerName: "Priya Patel",
    customerPhone: "+91 91234 56789",
    deliveryAddress: "Villa 14, Palm Grove, Whitefield, Bangalore",
    items: [
      { id: "3", name: "Paneer Butter Masala", quantity: 1, price: 250 },
      { id: "4", name: "Garlic Naan", quantity: 3, price: 50 }
    ],
    paymentMethod: "Card",
    paymentStatus: "Paid",
    subtotal: 400,
    taxes: 20,
    discount: 0,
    grandTotal: 420,
    orderTime: "12:50 PM",
    status: "Accepted"
  },
  {
    id: "#ORD-9023",
    customerName: "Amit Kumar",
    customerPhone: "+91 99887 76655",
    deliveryAddress: "Tech Park Phase 2, Tower B, 4th Floor",
    items: [
      { id: "5", name: "Mutton Rogan Josh", quantity: 1, price: 450 }
    ],
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Pending",
    subtotal: 450,
    taxes: 22,
    discount: 0,
    grandTotal: 472,
    orderTime: "12:30 PM",
    status: "Preparing"
  },
  {
    id: "#ORD-9024",
    customerName: "Sneha Reddy",
    customerPhone: "+91 98712 34567",
    deliveryAddress: "Koramangala 4th Block, Near Sony World",
    items: [
      { id: "6", name: "Veg Hakka Noodles", quantity: 2, price: 180 },
      { id: "7", name: "Chilli Chicken Dry", quantity: 1, price: 220 }
    ],
    paymentMethod: "Wallet",
    paymentStatus: "Paid",
    subtotal: 580,
    taxes: 29,
    discount: 100,
    grandTotal: 509,
    orderTime: "12:15 PM",
    status: "Ready for Pickup",
    deliveryPartner: { name: "Ramesh Singh", phone: "+91 88776 65544" }
  },
  {
    id: "#ORD-9025",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 99001 12233",
    deliveryAddress: "Indiranagar 100ft Road",
    items: [
      { id: "8", name: "Butter Chicken", quantity: 1, price: 320 }
    ],
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    subtotal: 320,
    taxes: 16,
    discount: 0,
    grandTotal: 336,
    orderTime: "12:00 PM",
    status: "Picked Up",
    deliveryPartner: { name: "Suresh", phone: "+91 77665 54433" }
  }
];

export default function PartnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  
  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Derived Data
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) || 
                            order.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Handlers
  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-[#FC8019] selection:text-white">
      
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
            
            <OrdersHeader />
            
            <OrdersSummary orders={orders} />

            <OrdersFilterBar 
              viewMode={viewMode} setViewMode={setViewMode}
              search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            />

            {/* Dynamic Views */}
            {viewMode === "list" ? (
              <OrdersList 
                orders={filteredOrders} 
                onUpdateStatus={handleUpdateStatus} 
                onViewDetails={setSelectedOrder} 
              />
            ) : (
              <OrdersKanban 
                orders={filteredOrders} 
                onUpdateStatus={handleUpdateStatus} 
                onViewDetails={setSelectedOrder} 
              />
            )}

          </div>
        </main>
      </div>

      {/* Details Drawer */}
      <OrderDetailsModal 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />

    </div>
  );
}
