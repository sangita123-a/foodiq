import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/authProxy";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : null);

    const body = await request.json().catch(() => ({}));
    const backend = getBackendUrl();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = token;

    const res = await fetch(`${backend}/api/admin/dispatch/run`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Dispatch execution failed";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
