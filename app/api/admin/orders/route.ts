import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET all orders and available riders
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          },
        },
        address: true,
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                isVeg: true,
              },
            },
          },
        },
      },
    });

    const riders = await prisma.user.findMany({
      where: {
        role: 'RIDER',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        vehicleNumber: true,
        isOnline: true,
      },
    });

    return NextResponse.json({ success: true, data: { orders, riders } }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// PATCH update order status or assign rider
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, riderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }

    if (riderId !== undefined) {
      // Allow nulling out the rider if empty string passed
      updateData.riderId = riderId === '' ? null : riderId;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: { name: true, phone: true },
        },
        restaurant: {
          select: { name: true },
        },
        rider: {
          select: { id: true, name: true, phone: true },
        },
      }
    });

    return NextResponse.json({ success: true, data: updatedOrder, message: 'Order updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
