import { NextRequest } from "next/server";
import { proxyAuthPost } from "@/lib/authProxy";

export async function POST(request: NextRequest) {
  return proxyAuthPost(request, "/api/auth/login");
}
