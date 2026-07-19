"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackingHeader from "@/components/tracking/TrackingHeader";
import OrderTimeline from "@/components/tracking/OrderTimeline";
import DeliveryPartnerCard from "@/components/tracking/DeliveryPartnerCard";
import TrackingOrderSummary from "@/components/tracking/TrackingOrderSummary";
import TrackingActions from "@/components/tracking/TrackingActions";
import { useSearchParams } from "next/navigation";
import { useOrderLiveTracking } from "@/hooks/useOrderLiveTracking";
import { Wifi, WifiOff } from "lucide-react";

const LiveTrackingMap = dynamic(() => import("@/components/tracking/LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] md:h-[400px] mb-8 rounded-3xl border border-[#E5E7EB] bg-[#F8FAFC] animate-pulse" />
  ),
});

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");

  const {
    orderData,
    trackingData,
    status,
    stage,
    location,
    connected,
    offline,
    isLoading,
    error,
  } = useOrderLiveTracking(id || null);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <div className="text-[#111827] text-xl">Loading live tracking…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 flex items-center justify-center min-h-[50vh]">
        <div className="text-[#111827] text-xl bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
          Failed to load tracking data.
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 flex items-center justify-center min-h-[50vh]">
        <div className="text-[#111827] text-xl">Order not found.</div>
      </div>
    );
  }

  const address =
    trackingData?.customer?.address ||
    [orderData.house_no, orderData.street, orderData.city, orderData.state, orderData.zip_code]
      .filter(Boolean)
      .join(", ");

  const etaLabel =
    location?.eta_minutes != null
      ? `${location.eta_minutes} min`
      : trackingData?.eta_minutes != null
        ? `${trackingData.eta_minutes} min`
        : trackingData?.estimated_delivery_time
          ? new Date(trackingData.estimated_delivery_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "25 - 35 Minutes";

  const headerOrder = {
    orderId: orderData.id,
    restaurantName: orderData.restaurant_name || trackingData?.restaurant?.name || "Restaurant",
    eta: etaLabel,
    address: address || "Address unavailable",
  };

  const partner = {
    name: trackingData?.rider?.name || "Delivery Partner",
    vehicleDetails:
      trackingData?.rider?.vehicle_details ||
      trackingData?.rider?.vehicle_type ||
      "Assigned after pickup",
    rating: Number(trackingData?.rider?.rating || 4.8),
    deliveries: 0,
    phone: trackingData?.rider?.phone || "",
  };

  const paymentLabels: Record<string, string> = {
    cod: "Cash on Delivery",
    upi: "UPI",
    credit_card: "Credit Card",
    debit_card: "Debit Card",
    razorpay: "Razorpay",
    wallet: "Wallet",
    net_banking: "Net Banking",
  };

  const restaurantPoint =
    trackingData?.restaurant?.lat != null
      ? {
          lat: Number(trackingData.restaurant.lat),
          lng: Number(trackingData.restaurant.lng),
          label: trackingData.restaurant.name || "Restaurant",
        }
      : null;

  const customerPoint =
    trackingData?.customer?.lat != null
      ? {
          lat: Number(trackingData.customer.lat),
          lng: Number(trackingData.customer.lng),
          label: "You",
        }
      : null;

  const riderPoint =
    location != null
      ? { lat: location.lat, lng: location.lng, label: "Rider" }
      : trackingData?.rider?.lat != null
        ? {
            lat: Number(trackingData.rider.lat),
            lng: Number(trackingData.rider.lng),
            label: "Rider",
          }
        : null;

  // Map actions stages: old 1–5 → new 1–7 roughly
  const actionsStage = stage >= 6 ? 4 : stage >= 5 ? 3 : stage >= 3 ? 2 : 1;

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <TrackingHeader {...headerOrder} />
        <div
          className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
            connected && !offline
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {connected && !offline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {offline ? "Offline — will resume" : connected ? "Live" : "Reconnecting…"}
        </div>
      </div>

      {(location?.distance_km != null || location?.eta_minutes != null) && (
        <div className="mb-6 grid grid-cols-2 gap-3 max-w-md">
          {location.distance_km != null && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Distance</p>
              <p className="text-lg font-black text-[#111827]">{location.distance_km.toFixed(1)} km</p>
            </div>
          )}
          {location.eta_minutes != null && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">ETA</p>
              <p className="text-lg font-black text-[#E23744]">{location.eta_minutes} min</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-[65%]">
          <LiveTrackingMap
            restaurant={restaurantPoint}
            customer={customerPoint}
            rider={stage >= 5 ? riderPoint : riderPoint}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <OrderTimeline currentStageId={stage} cancelled={stage === 0} />
            <div className="flex flex-col gap-8">
              {stage >= 5 && stage !== 0 && <DeliveryPartnerCard partner={partner} />}
              <TrackingActions currentStageId={Math.min(5, Math.max(1, actionsStage))} />
              <p className="text-xs text-[#9CA3AF]">
                Status: <span className="font-bold text-[#111827]">{status || "—"}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[35%]">
          <div className="sticky top-[100px]">
            <TrackingOrderSummary
              items={orderData.items}
              subtotal={parseFloat(orderData.subtotal)}
              deliveryFee={parseFloat(orderData.delivery_fee || 0)}
              discount={parseFloat(orderData.discount_amount || 0)}
              totalPaid={parseFloat(orderData.total_amount)}
              paymentMethod={
                paymentLabels[orderData.payment_method] ||
                orderData.payment_method ||
                "Cash on Delivery"
              }
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
