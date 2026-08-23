import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'foodiq_secure_admin_jwt_secret_key_2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').toString().trim().toLowerCase();
    const password = (body.password || '').toString().trim();

    const FIXED_EMAIL = 'ssangitasahoo48@gmail.com';
    const FIXED_PASSWORD = 'Foodiq@9090';

    if (email === FIXED_EMAIL.toLowerCase() && password === FIXED_PASSWORD) {
      const token = await new SignJWT({ email: FIXED_EMAIL, role: 'ADMIN' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secretKey);

      const response = NextResponse.json(
        { 
          success: true, 
          message: 'Admin authenticated successfully',
        },
        { status: 200 }
      );

      response.cookies.set({
        name: 'admin_token',
        value: token,
        path: '/',
        maxAge: 604800, // 7 days in seconds
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid admin credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
