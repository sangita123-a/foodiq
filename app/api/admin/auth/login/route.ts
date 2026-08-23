import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'foodiq_secure_admin_jwt_secret_key_2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (
      (email || '').trim().toLowerCase() === 'ssangitasahoo48@gmail.com' &&
      password === 'Foodiq@9090'
    ) {
      const token = await new SignJWT({ email: 'ssangitasahoo48@gmail.com', role: 'ADMIN' })
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
      { success: false, error: 'Invalid admin email or password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
