import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getBackendUrl() {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (envUrl && !envUrl.includes("localhost")) return envUrl.replace(/\/$/, "");
  return "https://foodiq-2.onrender.com";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { status: "error", message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const backend = getBackendUrl();
    const res = await fetch(`${backend}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "footer" }),
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return NextResponse.json({
        status: "success",
        message: data.message || "Successfully subscribed to the newsletter",
      });
    }

    return NextResponse.json(
      {
        status: "error",
        message: data.message || "Unable to subscribe right now. Please try again.",
      },
      { status: res.status || 500 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", message: "Unable to subscribe right now. Please try again." },
      { status: 503 }
    );
  }
}
