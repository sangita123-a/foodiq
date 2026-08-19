import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';

export async function POST(req: Request) {
  try {
    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    // Find the OTP record
    const otpRecord = await prisma.otp.findUnique({
      where: { phoneNumber },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      );
    }

    // Verify code
    if (otpRecord.code !== code) {
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      );
    }

    // Create or find user
    const user = await prisma.user.upsert({
      where: { phone: phoneNumber },
      update: {},
      create: {
        phone: phoneNumber,
        role: 'CUSTOMER',
      },
    });

    // Delete the used OTP
    await prisma.otp.delete({
      where: { id: otpRecord.id },
    });

    // Generate JWT
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-key-for-development'
    );
    const alg = 'HS256';

    const token = await new SignJWT({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
