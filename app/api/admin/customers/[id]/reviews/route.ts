import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json({
      success: true,
      data: [
        {
          id: "rev-1",
          targetType: "restaurant",
          targetName: "Punjabi Grill Express",
          rating: 5,
          comment: "Authentic taste and fast packaging! Loved the Butter Naan.",
          createdAt: "2026-08-04T10:30:00.000Z",
          helpfulCount: 12,
          isReported: false,
        },
        {
          id: "rev-2",
          targetType: "delivery_partner",
          targetName: "Rajesh Kumar (Driver)",
          rating: 5,
          comment: "Very polite rider, delivered piping hot food in the rain.",
          createdAt: "2026-08-04T10:20:00.000Z",
          helpfulCount: 4,
          isReported: false,
        },
        {
          id: "rev-3",
          targetType: "food",
          targetName: "Truffle Mushroom Pizza",
          rating: 4,
          comment: "Crispy crust and generous cheese topping.",
          createdAt: "2026-08-02T15:00:00.000Z",
          helpfulCount: 8,
          isReported: false,
        },
      ],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch customer reviews";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
