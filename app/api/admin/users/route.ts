import { NextRequest, NextResponse } from "next/server";
import { GET as getCustomers, POST as createCustomer } from "../customers/route";

export async function GET(request: NextRequest) {
  return getCustomers(request);
}

export async function POST(request: NextRequest) {
  return createCustomer(request);
}
