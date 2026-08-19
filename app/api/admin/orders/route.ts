import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        restaurant: { select: { name: true, address: true } },
        rider: { select: { id: true, name: true, phone: true, vehicleNumber: true } },
        orderItems: {
          include: { menuItem: { select: { name: true, isVeg: true } } }
        }
      }
    });
    
    // Also fetch riders for the Assign Rider dropdown to save an API call
    const riders = await prisma.user.findMany({
      where: { role: "RIDER" },
      select: { id: true, name: true, phone: true, isOnline: true }
    });

    return NextResponse.json({ success: true, data: { orders, riders } });
  } catch (error: any) {
    console.error("Admin Orders Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, riderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (riderId !== undefined) updateData.riderId = riderId; // riderId can be null to unassign

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        rider: { select: { id: true, name: true, phone: true } }
      }
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    console.error("Admin Update Order Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}
