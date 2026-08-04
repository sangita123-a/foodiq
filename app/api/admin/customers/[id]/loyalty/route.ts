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
        rewardPoints: 850,
        tier: "Gold",
        nextTierPointsNeeded: 150,
        pointsEarnedTotal: 3400,
        pointsRedeemedTotal: 2550,
        referralCode: "AARAV50",
        referralCount: 7,
        referralBonusEarned: 1750,
        couponsUsed: [
          {
            code: "WELCOME50",
            discountAmount: 50,
            orderId: "ord-8891",
            usedAt: "2026-08-04T09:30:00.000Z",
          },
          {
            code: "GOLDCREW100",
            discountAmount: 100,
            orderId: "ord-8892",
            usedAt: "2026-08-02T14:15:00.000Z",
          },
          {
            code: "MONSOONFEAST",
            discountAmount: 75,
            orderId: "ord-8870",
            usedAt: "2026-07-15T19:00:00.000Z",
          },
        ],
        achievements: [
          {
            id: "ach-1",
            title: "Super Foodie",
            description: "Placed more than 30 completed orders on Foodiq",
            unlockedAt: "2026-05-10",
            icon: "Utensils",
          },
          {
            id: "ach-2",
            title: "Night Owl",
            description: "Placed 5 orders after 11 PM",
            unlockedAt: "2026-06-22",
            icon: "Moon",
          },
          {
            id: "ach-3",
            title: "Referral Champion",
            description: "Successfully invited 5+ friends",
            unlockedAt: "2026-07-01",
            icon: "Users",
          },
        ],
        referees: [
          { id: "ref-1", name: "Sunil Sharma", date: "2026-07-10", bonusEarned: 250 },
          { id: "ref-2", name: "Divya Kapoor", date: "2026-07-18", bonusEarned: 250 },
          { id: "ref-3", name: "Aakash Mehta", date: "2026-07-25", bonusEarned: 250 },
        ],
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch loyalty info";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
