"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderHeader from "@/components/orders/OrderHeader";
import OrderFilterTabs, { OrderFilter } from "@/components/orders/OrderFilterTabs";
import OrderCard, { OrderType } from "@/components/orders/OrderCard";
import OrderEmptyState from "@/components/orders/OrderEmptyState";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

const FILTERS: OrderFilter[] = ["All Orders", "Active", "Delivered", "Cancelled"];

export default function MyOrdersPage() {
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("All Orders");
  const { showToast } = useToast();
  
  const { data, isLoading, error, mutate } = useSWR('/api/orders', { refreshInterval: 10000 });
  const backendOrders = data || [];

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.put(`/api/orders/${orderId}/cancel`);
      mutate();
      showToast("Order cancelled successfully", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to cancel order", "error");
    }
  };

  const mappedOrders: OrderType[] = backendOrders.map((o: any) => ({
    id: o.id,
    restaurant: o.restaurant_name,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=200",
    date: new Date(o.created_at).toLocaleString(),
    items: (o.items || []).map((i: any) => ({
      name: i.name,
      qty: i.quantity,
      price: i.price_at_time ? parseFloat(i.price_at_time) : 0
    })),
    subtotal: o.subtotal ? parseFloat(o.subtotal) : 0,
    taxes: o.total_amount ? parseFloat(o.total_amount) - parseFloat(o.subtotal || 0) : 0,
    discount: o.discount_amount ? parseFloat(o.discount_amount) : 0,
    total: o.total_amount ? parseFloat(o.total_amount) : 0,
    paymentMethod: o.payment_status === 'completed' ? 'Paid' : 'Pending',
    address: [o.street, o.city].filter(Boolean).join(", ") || "Address on file",
    status: o.status.charAt(0).toUpperCase() + o.status.slice(1).toLowerCase(),
    onCancel: handleCancelOrder
  }));

  const filteredOrders = mappedOrders.filter(order => {
    if (activeFilter === "All Orders") return true;
    if (activeFilter === "Active") return ["Pending", "Accepted", "Preparing", "Ready for pickup", "Picked up", "On the way"].includes(order.status);
    return order.status.toLowerCase() === activeFilter.toLowerCase();
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] relative pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-5xl">
          <div className="w-48 h-10 bg-white/5 animate-pulse rounded-lg mb-8"></div>
          <div className="flex gap-4 mb-10">
            <div className="w-24 h-10 bg-white/5 animate-pulse rounded-full"></div>
            <div className="w-24 h-10 bg-white/5 animate-pulse rounded-full"></div>
            <div className="w-24 h-10 bg-white/5 animate-pulse rounded-full"></div>
          </div>
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white/5 animate-pulse rounded-3xl border border-white/10"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-white text-xl">Failed to load orders</div>
        <button onClick={() => mutate()} className="px-6 py-2 bg-primary text-white rounded-lg">Retry</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-5xl">
        
        <OrderHeader />

        <OrderFilterTabs 
          filters={FILTERS} 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        <div className="flex flex-col">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <OrderEmptyState />
          )}
        </div>

      </div>

      <Footer />
    </main>
  );
}
