import { NextRequest, NextResponse } from "next/server";
import { MOCK_CUSTOMERS } from "../route";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const format = sp.get("format")?.toLowerCase() || "csv";

    if (format === "json") {
      return NextResponse.json({ success: true, data: MOCK_CUSTOMERS });
    }

    const headers = [
      "Customer ID",
      "Full Name",
      "Email",
      "Phone",
      "City",
      "State",
      "Registration Date",
      "Verification Status",
      "Status",
      "Total Orders",
      "Completed Orders",
      "Cancelled Orders",
      "Total Spending (INR)",
      "Wallet Balance (INR)",
      "Reward Points",
      "Premium Tier",
    ];

    const rows = MOCK_CUSTOMERS.map((c) => [
      c.customerId,
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.email,
      c.phone,
      c.city,
      c.state,
      new Date(c.registrationDate).toLocaleDateString(),
      c.isVerified ? "Verified" : "Unverified",
      c.status,
      c.totalOrders,
      c.completedOrders,
      c.cancelledOrders,
      c.totalSpending,
      c.walletBalance,
      c.rewardPoints,
      c.isPremium ? `Yes (${c.tier})` : "No",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=foodiq_customers_${Date.now()}.csv`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to export customer dataset";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
