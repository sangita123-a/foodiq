import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'foodiq_secure_admin_jwt_secret_key_2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (
      (email || '').trim().toLowerCase() === 'admin@foodiq.com' &&
      password === 'admin123'
    ) {
      const token = await new SignJWT({ email: 'admin@foodiq.com', role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secretKey);

      const response = NextResponse.json(
        { 
          success: true, 
          message: 'Authenticated successfully',
          data: { role: 'admin', token }
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
      { error: 'Invalid admin credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
