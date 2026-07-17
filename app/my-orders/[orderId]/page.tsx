"use client";

import { use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useSWR from "swr";
import { MapPin, Receipt, Navigation, ArrowLeft } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { data, isLoading, error } = useSWR(orderId ? `/api/orders/${orderId}` : null);

  const order = data;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="h-96 bg-[#F8FAFC] animate-pulse rounded-3xl" />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl text-white mb-4">Order not found</h1>
          <Link href="/my-orders" className="text-primary hover:underline">
            Back to My Orders
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const items = order.items || [];
  const status = order.status
    ? order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()
    : "Pending";
  const isTrackable = ["Pending", "Accepted", "Preparing", "Ready for pickup", "Picked up", "On the way"].includes(
    status
  );

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
        <Link
          href="/my-orders"
          className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Orders
        </Link>

        <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB]">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
              <SafeImage
                src={order.restaurant_image}
                fallback={RESTAURANT_FALLBACK}
                alt={order.restaurant_name || "Restaurant"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {order.restaurant_name || "Order"}
              </h1>
              <p className="text-[#6B7280] text-sm mb-2">
                Order #{order.id?.slice(0, 8)} • {new Date(order.created_at).toLocaleString()}
              </p>
              <span className="inline-flex text-xs font-bold px-3 py-1 rounded-full border border-[#E5E7EB] text-[#111827]">
                {status}
              </span>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[#6B7280] text-sm">Total</p>
              <p className="text-3xl font-black text-[#111827]">
                ₹{order.total_amount ? parseFloat(order.total_amount).toFixed(0) : "0"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-8 pb-8 border-b border-[#E5E7EB]">
            <MapPin className="w-4 h-4" />
            <span>
              {[order.street, order.city, order.state].filter(Boolean).join(", ") || "Delivery address on file"}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Items
            </h2>
            <div className="space-y-3">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">
                    <span className="text-white font-bold mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="text-[#111827]">
                    ₹{item.price_at_time ? parseFloat(item.price_at_time) * item.quantity : 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] space-y-3 text-sm mb-8">
            <div className="flex justify-between text-[#6B7280]">
              <span>Subtotal</span>
              <span className="text-[#111827]">₹{order.subtotal ? parseFloat(order.subtotal).toFixed(0) : 0}</span>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>Taxes & Fees</span>
              <span className="text-[#111827]">
                ₹
                {order.total_amount && order.subtotal
                  ? (parseFloat(order.total_amount) - parseFloat(order.subtotal)).toFixed(0)
                  : 0}
              </span>
            </div>
            {order.discount_amount && parseFloat(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>-₹{parseFloat(order.discount_amount).toFixed(0)}</span>
              </div>
            )}
          </div>

          {isTrackable && (
            <Link
              href={`/track-order?id=${order.id}`}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Track Order
            </Link>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
