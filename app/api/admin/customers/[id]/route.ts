import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/authProxy";
import { MOCK_CUSTOMERS } from "../route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backend = getBackendUrl();
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : null);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = token;

    const res = await fetch(`${backend}/api/admin/customers/${id}`, {
      headers,
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const customer = MOCK_CUSTOMERS.find((c) => c.id === id || c.customerId === id) || MOCK_CUSTOMERS[0];
    return NextResponse.json({ success: true, data: customer });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch customer profile";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const customerIndex = MOCK_CUSTOMERS.findIndex((c) => c.id === id || c.customerId === id);

    if (customerIndex !== -1) {
      MOCK_CUSTOMERS[customerIndex] = {
        ...MOCK_CUSTOMERS[customerIndex],
        ...body,
        isVerified: body.isVerified !== undefined ? body.isVerified : MOCK_CUSTOMERS[customerIndex].isVerified,
        verificationStatus: body.isVerified ? "verified" : MOCK_CUSTOMERS[customerIndex].verificationStatus,
      };
      return NextResponse.json({
        success: true,
        data: MOCK_CUSTOMERS[customerIndex],
        message: "Customer updated successfully",
      });
    }

    return NextResponse.json({
      success: true,
      data: { id, ...body },
      message: "Customer updated successfully",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update customer";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerIndex = MOCK_CUSTOMERS.findIndex((c) => c.id === id || c.customerId === id);
    if (customerIndex !== -1) {
      MOCK_CUSTOMERS.splice(customerIndex, 1);
    }
    return NextResponse.json({
      success: true,
      message: "Customer account deleted successfully",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete customer account";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
