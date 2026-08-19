import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Generate a random 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Set expiration time (e.g., 5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Upsert the OTP in the database
    await prisma.otp.upsert({
      where: { phoneNumber },
      update: {
        code,
        expiresAt,
        createdAt: new Date(),
      },
      create: {
        phoneNumber,
        code,
        expiresAt,
      },
    });

    // Simulate sending SMS (In production, integrate Twilio here)
    console.log(`[SIMULATED SMS] Sending OTP ${code} to ${phoneNumber}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
