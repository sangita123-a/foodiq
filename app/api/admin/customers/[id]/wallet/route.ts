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
        balance: 1250,
        transactions: [
          {
            id: "tx-501",
            type: "credit",
            amount: 500,
            balanceAfter: 1250,
            description: "Admin Credit Bonus - Customer Appreciation",
            referenceId: "ADM-BONUS-99",
            createdAt: "2026-08-03T11:20:00.000Z",
            status: "success",
          },
          {
            id: "tx-502",
            type: "refund",
            amount: 890,
            balanceAfter: 750,
            description: "Refund for cancelled order #OD-889102",
            orderId: "ord-8893",
            referenceId: "RFND-8893",
            createdAt: "2026-07-29T20:05:00.000Z",
            status: "success",
          },
          {
            id: "tx-503",
            type: "debit",
            amount: 649,
            balanceAfter: -140,
            description: "Paid for Order #OD-889104",
            orderId: "ord-8891",
            createdAt: "2026-07-25T14:10:00.000Z",
            status: "success",
          },
          {
            id: "tx-504",
            type: "credit",
            amount: 1000,
            balanceAfter: 509,
            description: "Added money via UPI (Google Pay)",
            referenceId: "UPI-TX-998811",
            createdAt: "2026-07-20T10:00:00.000Z",
            status: "success",
          },
        ],
        refunds: [
          {
            id: "rf-101",
            refundNumber: "RF-90021",
            orderId: "ord-8893",
            amount: 890,
            reason: "Customer cancelled within 2 minutes",
            status: "processed",
            paymentMethod: "Foodiq Wallet",
            createdAt: "2026-07-29T20:05:00.000Z",
          },
          {
            id: "rf-102",
            refundNumber: "RF-90022",
            orderId: "ord-8894",
            amount: 450,
            reason: "Melted ice cream - Quality defect report",
            status: "processed",
            paymentMethod: "UPI (Paytm)",
            createdAt: "2026-07-20T14:00:00.000Z",
          },
        ],
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch wallet info";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount || 0);
    const type = body.type === "debit" ? "debit" : "credit";

    return NextResponse.json({
      success: true,
      data: {
        newBalance: type === "credit" ? 1250 + amount : Math.max(0, 1250 - amount),
      },
      message: `Successfully ${type === "credit" ? "credited" : "debited"} ₹${amount} to customer wallet.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to adjust wallet";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
