"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackingHeader from "@/components/tracking/TrackingHeader";
import LiveMapPlaceholder from "@/components/tracking/LiveMapPlaceholder";
import OrderTimeline from "@/components/tracking/OrderTimeline";
import DeliveryPartnerCard from "@/components/tracking/DeliveryPartnerCard";
import TrackingOrderSummary from "@/components/tracking/TrackingOrderSummary";
import TrackingActions from "@/components/tracking/TrackingActions";
import RecommendedNextOrder from "@/components/tracking/RecommendedNextOrder";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');

  const { data, isLoading, error } = useSWR(id ? `/api/orders/${id}` : null, { refreshInterval: 15000 });
  const orderData = data;

  const { data: trackingResponse } = useSWR(id ? `/api/orders/${id}/tracking` : null, { refreshInterval: 15000 });
  const trackingData = trackingResponse;

  // Map backend status to 1-7 stage
  // 'Pending'(1), 'Accepted'(2), 'Preparing'(3), 'Ready for Pickup'(4), 'Picked Up'(5), 'On The Way'(6), 'Delivered'(7)
  const getStageFromStatus = (status: string) => {
    if (!status) return 1;
    const s = status.toLowerCase();
    if (s === 'pending') return 1;
    if (s === 'accepted' || s === 'confirmed') return 2;
    if (s === 'preparing') return 3;
    if (s === 'ready for pickup') return 4;
    if (s === 'picked up') return 5;
    if (s === 'on the way') return 6;
    if (s === 'delivered') return 7;
    return 2;
  };

  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    if (orderData?.status) {
      setCurrentStage(getStageFromStatus(orderData.status));
    }
  }, [orderData]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl">Loading tracking info...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-xl bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
          Failed to load tracking data.
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-xl">Order not found.</div>
      </div>
    );
  }

  const mockOrder = {
    orderId: orderData.id,
    restaurantName: orderData.restaurant_name,
    eta: trackingData?.estimated_delivery_time 
      ? new Date(trackingData.estimated_delivery_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : "20 - 25 Minutes",
    address: orderData.street ? `${orderData.street}, ${orderData.city}` : "Unknown Address"
  };

  const dummyPartner = {
    name: "Raju Bhai",
    vehicleDetails: "TS 09 EB 8234 • Honda Activa",
    rating: 4.8,
    deliveries: 1240,
    phone: "+91 9876543210"
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <TrackingHeader {...mockOrder} />

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column (Main Tracking) */}
          <div className="w-full lg:w-[65%]">
            <LiveMapPlaceholder />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <OrderTimeline currentStageId={currentStage} />
              <div className="flex flex-col gap-8">
                {currentStage >= 5 && <DeliveryPartnerCard partner={dummyPartner} />}
                <TrackingActions currentStageId={currentStage} />
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="w-full lg:w-[35%]">
            <div className="sticky top-[100px]">
              <TrackingOrderSummary
                items={orderData.items}
                subtotal={parseFloat(orderData.subtotal)}
                deliveryFee={parseFloat(orderData.delivery_fee || 0)}
                discount={parseFloat(orderData.discount_amount || 0)}
                totalPaid={parseFloat(orderData.total_amount)}
                paymentMethod={orderData.payment_method || "UPI"}
              />
            </div>
          </div>
          
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <Suspense fallback={<div className="text-[#111827] p-10 text-center">Loading...</div>}>
        <TrackOrderContent />
      </Suspense>
      <Footer />
    </main>
  );
}
