import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json({
      success: true,
      data: {
        sms: true,
        email: true,
        push: true,
        whatsapp: true,
        promotions: false,
        orderUpdates: true,
        auditLogs: [
          {
            id: "notif-1",
            title: "Your order #OD-889104 is delivered!",
            channel: "Push Notification",
            sentAt: "2026-08-04T10:12:00.000Z",
            status: "opened",
          },
          {
            id: "notif-2",
            title: "50% OFF Monsoon Offer - Use code MONSOON50",
            channel: "SMS",
            sentAt: "2026-08-01T09:00:00.000Z",
            status: "delivered",
          },
          {
            id: "notif-3",
            title: "Security Alert: Password change requested",
            channel: "Email",
            sentAt: "2026-07-25T14:30:00.000Z",
            status: "opened",
          },
        ],
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch notification preferences";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
