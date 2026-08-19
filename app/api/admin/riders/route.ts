import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const riders = await prisma.user.findMany({
      where: {
        role: 'RIDER',
      },
      include: {
        deliveries: {
          where: {
            createdAt: {
              gte: today,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const enrichedRiders = riders.map(rider => {
      let status = 'Offline';
      if (rider.isOnline) {
        status = 'Online';
        // Check if on delivery (you can enhance this based on your specific OrderStatus logic)
        const activeDelivery = rider.deliveries.find(d => 
          ['PREPARING', 'OUT_FOR_DELIVERY'].includes(d.status)
        );
        if (activeDelivery) {
          status = 'On Delivery';
        }
      }

      return {
        id: rider.id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        vehicleNumber: rider.vehicleNumber,
        kycStatus: rider.kycStatus,
        isOnline: rider.isOnline,
        rating: rider.rating,
        codBalance: rider.codBalance,
        status,
        todayDeliveriesCount: rider.deliveries.length,
      };
    });

    return NextResponse.json({ success: true, data: enrichedRiders });
  } catch (error: any) {
    console.error('Error fetching riders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch riders' },
      { status: 500 }
    );
  }
}
