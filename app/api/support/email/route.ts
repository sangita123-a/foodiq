import { NextRequest, NextResponse } from "next/server";

function getBackendUrl() {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_API_FORCE_REMOTE) {
    return envUrl || "http://localhost:4000";
  }
  return envUrl || "https://foodiq-2.onrender.com";
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : null);

    const formData = await request.formData();
    const backend = getBackendUrl();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = token;
    }

    const res = await fetch(`${backend}/api/support/email`, {
      method: "POST",
      headers,
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send email support request";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
