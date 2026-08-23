import { NextRequest, NextResponse } from "next/server";
import { GET as getCustomers } from "../customers/route";

export async function GET(request: NextRequest) {
  return getCustomers();
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
