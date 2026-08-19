import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const updateData: any = {};
    if (body.kycStatus) {
      updateData.kycStatus = body.kycStatus;
      if (body.kycStatus === 'REJECTED') {
        updateData.isOnline = false; // Suspend if rejected
      }
    }
    
    if (typeof body.isOnline === 'boolean') {
      updateData.isOnline = body.isOnline;
    }

    const updatedRider = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedRider });
  } catch (error: any) {
    console.error('Error updating rider KYC/status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update rider' },
      { status: 500 }
    );
  }
}
