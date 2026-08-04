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
          id: "tkt-301",
          ticketId: "TCK-88102",
          subject: "Missing item in order #OD-889104",
          category: "Order Issue",
          priority: "high",
          status: "resolved",
          createdAt: "2026-08-04T10:15:00.000Z",
          lastUpdated: "2026-08-04T10:30:00.000Z",
          orderId: "ord-8891",
          chatLog: [
            { sender: "customer", message: "Hi, I received Butter Chicken and Naan, but Dal Makhani was missing.", timestamp: "10:15 AM" },
            { sender: "bot", message: "We apologize for the inconvenience. Let me connect you with an agent.", timestamp: "10:15 AM" },
            { sender: "support", message: "Hello Aarav! I have verified with the restaurant. A refund of ₹180 has been processed to your Foodiq Wallet.", timestamp: "10:28 AM" },
            { sender: "customer", message: "Thank you! I see the wallet credit now.", timestamp: "10:30 AM" },
          ],
        },
        {
          id: "tkt-302",
          ticketId: "TCK-87201",
          subject: "Delayed delivery inquiry",
          category: "Delivery Delay",
          priority: "medium",
          status: "closed",
          createdAt: "2026-07-20T13:00:00.000Z",
          lastUpdated: "2026-07-20T13:40:00.000Z",
          orderId: "ord-8894",
          chatLog: [
            { sender: "customer", message: "The order is taking more than 40 minutes.", timestamp: "01:00 PM" },
            { sender: "support", message: "Heavy rain in Bandra. Partner is arriving in 5 mins.", timestamp: "01:05 PM" },
          ],
        },
      ],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch support tickets";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
