import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Check if body has isOpen for toggling status, or other fields for edit
    const updateData: any = {};
    if (typeof body.isOpen === 'boolean') updateData.isOpen = body.isOpen;
    if (body.name) updateData.name = body.name;
    if (body.address) updateData.address = body.address;
    if (body.imageUrl) updateData.imageUrl = body.imageUrl;
    if (body.latitude) updateData.latitude = parseFloat(body.latitude);
    if (body.longitude) updateData.longitude = parseFloat(body.longitude);

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedRestaurant });
  } catch (error: any) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update restaurant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.restaurant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete restaurant' },
      { status: 500 }
    );
  }
}
