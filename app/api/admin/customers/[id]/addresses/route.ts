import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addresses = [
      {
        id: "addr-1",
        label: "Home",
        addressLine1: "Flat 402, Sunshine Heights, Bandra West",
        addressLine2: "Near Linking Road",
        landmark: "Opposite National College",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400050",
        latitude: 19.0600,
        longitude: 72.8362,
        isDefault: true,
        deliveryInstructions: "Leave at door if not home. Ring doorbell once.",
      },
      {
        id: "addr-2",
        label: "Work",
        addressLine1: "Tower B, 7th Floor, Maker Maxity, BKC",
        addressLine2: "Bandra Kurla Complex",
        landmark: "Near One BKC",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400051",
        latitude: 19.0657,
        longitude: 72.8687,
        isDefault: false,
        deliveryInstructions: "Call upon arrival. Hand over at reception.",
      },
      {
        id: "addr-3",
        label: "Other",
        addressLine1: "Villa 12, Green Acres, Juhu Beach Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400049",
        latitude: 19.1075,
        longitude: 72.8263,
        isDefault: false,
        deliveryInstructions: "Gate code is 4321.",
      },
    ];

    return NextResponse.json({ success: true, data: addresses });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch addresses";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
