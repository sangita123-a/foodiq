import { NextRequest, NextResponse } from "next/server";

function getBackendUrl() {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_API_FORCE_REMOTE) {
    return envUrl || "http://localhost:4000";
  }
  return envUrl || "https://foodiq-2.onrender.com";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : null);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { paymentId } = await params;
    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: "Payment ID is required" },
        { status: 400 }
      );
    }

    const backend = getBackendUrl();
    const res = await fetch(`${backend}/api/payment/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch payment details";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
