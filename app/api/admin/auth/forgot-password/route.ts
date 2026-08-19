import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'ADMIN') {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ success: true, message: 'If the email exists, an OTP has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpires: expiresAt,
      },
    });

    // Send email using nodemailer
    // You should configure these in your .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: '"Foodiq Admin" <admin@foodiq.com>',
        to: email,
        subject: 'Password Reset OTP',
        text: `Your password reset OTP is: ${otp}. It will expire in 15 minutes.`,
        html: `<p>Your password reset OTP is: <strong>${otp}</strong>. It will expire in 15 minutes.</p>`,
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // We might be testing locally without SMTP
      console.log(`[DEV MODE] OTP for ${email} is ${otp}`);
    }

    return NextResponse.json({ success: true, message: 'If the email exists, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
