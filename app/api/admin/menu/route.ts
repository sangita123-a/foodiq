import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, category, isVeg, imageUrl, restaurantId } = body;

    if (!name || !price || !restaurantId) {
      return NextResponse.json(
        { success: false, message: 'Name, price, and restaurantId are required' },
        { status: 400 }
      );
    }

    const newMenuItem = await prisma.menuItem.create({
      data: {
        name,
        price,
        category,
        isVeg: typeof isVeg === 'boolean' ? isVeg : true,
        imageUrl,
        restaurantId,
      },
    });

    return NextResponse.json({ success: true, data: newMenuItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isAvailable, name, price, category, isVeg, imageUrl } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Menu item ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (typeof isAvailable === 'boolean') updateData.isAvailable = isAvailable;
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (category) updateData.category = category;
    if (typeof isVeg === 'boolean') updateData.isVeg = isVeg;
    if (imageUrl) updateData.imageUrl = imageUrl;

    const updatedMenuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedMenuItem });
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Menu item ID is required' },
        { status: 400 }
      );
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
