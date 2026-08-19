import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        },
        orders: {
          select: {
            totalAmount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedCustomers = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        joinDate: customer.createdAt,
        totalOrders: customer._count.orders,
        totalSpent: totalSpent
      };
    });

    return NextResponse.json(formattedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
