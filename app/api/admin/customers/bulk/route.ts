import { NextRequest, NextResponse } from "next/server";
import { MOCK_CUSTOMERS } from "../route";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as "verify" | "block" | "unblock" | "delete";
    const ids = (body.customerIds || []) as string[];

    if (!ids.length) {
      return NextResponse.json({ success: false, message: "No customer IDs provided" }, { status: 400 });
    }

    let affectedCount = 0;

    MOCK_CUSTOMERS.forEach((c) => {
      if (ids.includes(c.id) || ids.includes(c.customerId)) {
        affectedCount++;
        if (action === "verify") {
          c.isVerified = true;
          c.verificationStatus = "verified";
        } else if (action === "block") {
          c.status = "blocked";
        } else if (action === "unblock") {
          c.status = "active";
        }
      }
    });

    if (action === "delete") {
      for (let i = MOCK_CUSTOMERS.length - 1; i >= 0; i--) {
        if (ids.includes(MOCK_CUSTOMERS[i].id) || ids.includes(MOCK_CUSTOMERS[i].customerId)) {
          MOCK_CUSTOMERS.splice(i, 1);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { affectedCount },
      message: `Successfully performed bulk action '${action}' on ${affectedCount || ids.length} customer(s).`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to execute bulk customer action";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
