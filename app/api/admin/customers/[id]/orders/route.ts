import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sp = request.nextUrl.searchParams;
    const status = sp.get("status")?.toLowerCase();

    const orders = [
      {
        id: "ord-8891",
        orderNumber: "OD-889104",
        date: "2026-08-04T09:30:00.000Z",
        restaurantId: "rest-1",
        restaurantName: "Punjabi Grill Express",
        restaurantImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150",
        status: "Completed",
        totalAmount: 649,
        subtotal: 550,
        discountAmount: 50,
        deliveryFee: 49,
        taxAmount: 100,
        paymentMethod: "UPI (Google Pay)",
        paymentStatus: "Paid",
        itemCount: 3,
        itemsSummary: "Butter Chicken (1), Butter Naan (3), Dal Makhani (1)",
        timeline: [
          { status: "Order Placed", timestamp: "09:30 AM", description: "Payment confirmed via UPI" },
          { status: "Order Accepted", timestamp: "09:32 AM", description: "Accepted by Punjabi Grill Express" },
          { status: "Preparing", timestamp: "09:35 AM", description: "Food preparation started" },
          { status: "Out for Delivery", timestamp: "09:50 AM", description: "Picked up by Rajesh Kumar (Delivery Partner)" },
          { status: "Delivered", timestamp: "10:12 AM", description: "Delivered at doorstep" },
        ],
        deliveryAddress: "Flat 402, Sunshine Heights, Bandra West, Mumbai",
        hasInvoice: true,
      },
      {
        id: "ord-8892",
        orderNumber: "OD-889103",
        date: "2026-08-02T14:15:00.000Z",
        restaurantId: "rest-2",
        restaurantName: "Pizza Italiano & Pasta Bar",
        restaurantImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150",
        status: "Completed",
        totalAmount: 1250,
        subtotal: 1100,
        discountAmount: 100,
        deliveryFee: 60,
        taxAmount: 190,
        paymentMethod: "Credit Card (HDFC)",
        paymentStatus: "Paid",
        itemCount: 2,
        itemsSummary: "Truffle Mushroom Pizza (Large), Garlic Breadsticks",
        timeline: [
          { status: "Order Placed", timestamp: "02:15 PM", description: "Card authorized" },
          { status: "Preparing", timestamp: "02:20 PM", description: "Baking in oven" },
          { status: "Out for Delivery", timestamp: "02:40 PM", description: "En route" },
          { status: "Delivered", timestamp: "03:02 PM", description: "Delivered successfully" },
        ],
        deliveryAddress: "Tower B, 7th Floor, Maker Maxity, BKC, Mumbai",
        hasInvoice: true,
      },
      {
        id: "ord-8893",
        orderNumber: "OD-889102",
        date: "2026-07-29T20:00:00.000Z",
        restaurantId: "rest-3",
        restaurantName: "Sushi & Ramen House",
        restaurantImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150",
        status: "Cancelled",
        totalAmount: 890,
        subtotal: 800,
        discountAmount: 0,
        deliveryFee: 45,
        taxAmount: 45,
        paymentMethod: "Foodiq Wallet",
        paymentStatus: "Refunded",
        itemCount: 2,
        itemsSummary: "Salmon Roll (8pcs), Tonkotsu Ramen",
        timeline: [
          { status: "Order Placed", timestamp: "08:00 PM", description: "Deducted from Foodiq Wallet" },
          { status: "Cancelled", timestamp: "08:05 PM", description: "Cancelled by customer (Change of mind). Wallet refunded." },
        ],
        deliveryAddress: "Flat 402, Sunshine Heights, Bandra West, Mumbai",
        hasInvoice: false,
      },
      {
        id: "ord-8894",
        orderNumber: "OD-889101",
        date: "2026-07-20T12:45:00.000Z",
        restaurantId: "rest-4",
        restaurantName: "Natural Ice Cream & Desserts",
        restaurantImage: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150",
        status: "Refunded",
        totalAmount: 450,
        subtotal: 400,
        discountAmount: 20,
        deliveryFee: 30,
        taxAmount: 40,
        paymentMethod: "UPI (Paytm)",
        paymentStatus: "Refunded",
        itemCount: 3,
        itemsSummary: "Tender Coconut Tub (500g), Alphonso Mango Scoop (2)",
        timeline: [
          { status: "Order Placed", timestamp: "12:45 PM", description: "Paid via Paytm" },
          { status: "Delivered", timestamp: "01:20 PM", description: "Delivered" },
          { status: "Refunded", timestamp: "02:00 PM", description: "Full refund issued due to item melting during transit" },
        ],
        deliveryAddress: "Flat 402, Sunshine Heights, Bandra West, Mumbai",
        hasInvoice: true,
      },
      {
        id: "ord-8895",
        orderNumber: "OD-889100",
        date: "2026-08-04T11:00:00.000Z",
        restaurantId: "rest-5",
        restaurantName: "Subway Fresh Sandwiches",
        restaurantImage: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=150",
        status: "Scheduled",
        totalAmount: 380,
        subtotal: 340,
        discountAmount: 0,
        deliveryFee: 20,
        taxAmount: 20,
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending",
        itemCount: 1,
        itemsSummary: "Paneer Tikka 6-inch Sub + Cookie + Coke",
        timeline: [
          { status: "Scheduled", timestamp: "11:00 AM", description: "Scheduled for delivery at 01:30 PM today" },
        ],
        deliveryAddress: "Tower B, 7th Floor, Maker Maxity, BKC, Mumbai",
        hasInvoice: true,
      },
    ];

    let filtered = orders;
    if (status && status !== "all") {
      filtered = orders.filter((o) => o.status.toLowerCase() === status);
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch customer orders";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
