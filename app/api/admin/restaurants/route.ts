import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        menuItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: restaurants });
  } catch (error: any) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, address, latitude, longitude, imageUrl, ownerId } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { success: false, message: 'Name and ownerId are required' },
        { status: 400 }
      );
    }

    const newRestaurant = await prisma.restaurant.create({
      data: {
        name,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        imageUrl,
        ownerId,
      },
    });

    return NextResponse.json({ success: true, data: newRestaurant }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating restaurant:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create restaurant' },
      { status: 500 }
    );
  }
}
