import { NextRequest, NextResponse } from "next/server";

export function getBackendUrl() {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_API_FORCE_REMOTE) {
    return envUrl || "http://localhost:4000";
  }
  return envUrl || "https://foodiq-2.onrender.com";
}

export async function proxyAuthPost(
  request: NextRequest,
  backendPath: string,
  options?: { requireAuth?: boolean }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : null);

    if (options?.requireAuth && !token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const backend = getBackendUrl();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = token;

    const cookie = request.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;

    const res = await fetch(`${backend}${backendPath}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });

    const setCookie = res.headers.getSetCookie?.() || [];
    for (const c of setCookie) {
      response.headers.append("Set-Cookie", c);
    }

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Auth request failed";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
