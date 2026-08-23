import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const FIXED_EMAIL = 'ssangitasahoo48@gmail.com';
const FIXED_PASSWORD = 'Foodiq@9090';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'foodiq_secure_admin_jwt_secret_key_2026'
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').toString().trim().toLowerCase();
    const password = (body.password || '').toString().trim();

    if (email === FIXED_EMAIL.toLowerCase() && password === FIXED_PASSWORD) {
      const token = await new SignJWT({ email: FIXED_EMAIL, role: 'ADMIN' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

      const response = NextResponse.json(
        { success: true, message: 'Authenticated successfully' },
        { status: 200 }
      );

      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Wrong email or password' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
