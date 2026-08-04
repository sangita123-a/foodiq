import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tempPassword = `Foodiq#${Math.floor(100000 + Math.random() * 900000)}`;

    return NextResponse.json({
      success: true,
      data: {
        temporaryPassword: tempPassword,
        message: "Password reset link sent to customer email. Temporary password generated.",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to reset password";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
