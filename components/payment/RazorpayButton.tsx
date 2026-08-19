"use client";

import React, { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

interface RazorpayButtonProps {
  orderId: string;
  amount: number; // For display purposes if needed
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export default function RazorpayButton({ orderId, amount, onSuccess, onError }: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 1. Create order on server
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create order");
      }

      const { order: razorpayOrder } = data;

      // 2. Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use NEXT_PUBLIC if you want to expose it to client, else fetch it from server or just omit it if the script handles it, wait no, Razorpay needs the key on client side.
        // Wait, standard approach is to pass key from the server response if not exposed as NEXT_PUBLIC.
        // I will use NEXT_PUBLIC_RAZORPAY_KEY_ID
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "FoodIQ",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              if (onSuccess) {
                onSuccess();
              } else {
                router.push(`/orders/${orderId}`);
              }
            } else {
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            console.error(err);
            if (onError) onError(err);
            else alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#ef4444", // Red color matching FoodIQ theme typically
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        console.error(response.error);
        if (onError) onError(response.error);
        else alert("Payment failed! Please try again.");
      });

      rzp1.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      if (onError) onError(err);
      else alert(err.message || "Could not initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition duration-300 disabled:opacity-50 flex justify-center items-center"
      >
        {loading ? (
          <span className="animate-pulse">Processing...</span>
        ) : (
          `Pay Now (₹${amount})`
        )}
      </button>
    </>
  );
}
