"use client";

import { useState, useMemo, useEffect } from "react";
import { mutate } from "swr";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import OrdersHeader from "@/components/partner/orders/OrdersHeader";
import OrdersSummary from "@/components/partner/orders/OrdersSummary";
import OrdersFilterBar from "@/components/partner/orders/OrdersFilterBar";
import OrdersList from "@/components/partner/orders/OrdersList";
import OrdersKanban from "@/components/partner/orders/OrdersKanban";
import OrderDetailsModal from "@/components/partner/orders/OrderDetailsModal";
import { Order, OrderStatus } from "@/components/partner/orders/types";
import { usePartnerOrders } from "@/hooks/usePartnerData";
import { updatePartnerOrderStatus } from "@/services/partnerApi";

export default function PartnerOrdersPage() {
  const { data, isLoading, error } = usePartnerOrders();
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (data) setOrders(data as Order[]);
  }, [data]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) || 
                            order.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    try {
      const updated = await updatePartnerOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      mutate("/api/partner/orders");
      mutate("/api/partner/dashboard");
      mutate("/api/partner/notifications");
    } catch {
      mutate("/api/partner/orders");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-[#FC8019] selection:text-white">
      
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        
        <PartnerHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            <OrdersHeader />

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Unable to load orders.
              </div>
            )}
            {isLoading && !orders.length && (
              <p className="text-[#6B7280] mb-4 text-sm">Loading orders…</p>
            )}
            
            <OrdersSummary orders={orders} />

            <OrdersFilterBar 
              viewMode={viewMode} setViewMode={setViewMode}
              search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            />

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

      <OrderDetailsModal 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />

    </div>
  );
}
