import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Total Revenue (Sum of DELIVERED orders or orders with payment)
    const revenueAggregation = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: {
          in: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"],
        },
      },
    });
    
    const totalRevenue = revenueAggregation._sum.totalAmount || 0;

    // 2. Active Live Orders count
    const activeOrdersCount = await prisma.order.count({
      where: {
        status: {
          in: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"],
        },
      },
    });

    // 3. Total Customers
    const totalCustomers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
      },
    });

    // 4. Total Riders
    const totalRiders = await prisma.user.count({
      where: {
        role: "RIDER",
      },
    });

    // 5. Recent 5 orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue),
        activeOrdersCount,
        totalCustomers,
        totalRiders,
        recentOrders,
      },
    });
  } catch (error: any) {
    console.error("Admin Analytics Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
