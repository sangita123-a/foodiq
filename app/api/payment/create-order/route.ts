import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : null);

    // If using a more robust auth logic, you can check user id here.
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required" },
        { status: 400 }
      );
    }

    // Fetch the order from Prisma to get the correct amount
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: "Order cannot be paid for in its current state" },
        { status: 400 }
      );
    }

    // Amount in paise (multiply by 100)
    // order.totalAmount is a Decimal, so we convert it to number first
    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.id,
      notes: {
        orderId: order.id,
      }
    });

    // Update our Order with the razorpayOrderId
    await prisma.order.update({
      where: { id: order.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      success: true,
      order: razorpayOrder,
    }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Payment order creation failed";
    console.error("Razorpay order creation error:", msg);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
