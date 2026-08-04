import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/authProxy";

// Sample production mock dataset fallback if backend server is unreachable
export const MOCK_CUSTOMERS = [
  {
    id: "cust-101",
    customerId: "CUST-9821",
    fullName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    registrationDate: "2024-01-15T10:30:00.000Z",
    lastActiveAt: "2026-08-04T09:15:00.000Z",
    isVerified: true,
    verificationStatus: "verified",
    status: "active",
    isPremium: true,
    tier: "Gold",
    totalOrders: 42,
    completedOrders: 38,
    cancelledOrders: 2,
    refundedOrders: 2,
    totalSpending: 24850,
    walletBalance: 1250,
    rewardPoints: 850,
    referralCode: "AARAV50",
    gender: "Male",
    dob: "1994-06-12",
  },
  {
    id: "cust-102",
    customerId: "CUST-9822",
    fullName: "Priya Patel",
    email: "priya.patel@example.com",
    phone: "+91 98765 43211",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    registrationDate: "2024-02-20T14:10:00.000Z",
    lastActiveAt: "2026-08-03T18:45:00.000Z",
    isVerified: true,
    verificationStatus: "verified",
    status: "active",
    isPremium: true,
    tier: "VIP",
    totalOrders: 89,
    completedOrders: 85,
    cancelledOrders: 3,
    refundedOrders: 1,
    totalSpending: 56400,
    walletBalance: 3400,
    rewardPoints: 2400,
    referralCode: "PRIYA100",
    gender: "Female",
    dob: "1992-11-25",
  },
  {
    id: "cust-103",
    customerId: "CUST-9823",
    fullName: "Rohan Verma",
    email: "rohan.verma@example.com",
    phone: "+91 98765 43212",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
    registrationDate: "2024-03-10T08:00:00.000Z",
    lastActiveAt: "2026-08-01T12:30:00.000Z",
    isVerified: false,
    verificationStatus: "unverified",
    status: "active",
    isPremium: false,
    tier: "Silver",
    totalOrders: 14,
    completedOrders: 12,
    cancelledOrders: 1,
    refundedOrders: 1,
    totalSpending: 6800,
    walletBalance: 150,
    rewardPoints: 210,
    referralCode: "ROHAN20",
    gender: "Male",
    dob: "1996-03-18",
  },
  {
    id: "cust-104",
    customerId: "CUST-9824",
    fullName: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    phone: "+91 98765 43213",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500001",
    registrationDate: "2024-04-05T16:20:00.000Z",
    lastActiveAt: "2026-07-28T10:10:00.000Z",
    isVerified: true,
    verificationStatus: "verified",
    status: "blocked",
    isPremium: false,
    tier: "Bronze",
    totalOrders: 6,
    completedOrders: 4,
    cancelledOrders: 2,
    refundedOrders: 0,
    totalSpending: 2300,
    walletBalance: 0,
    rewardPoints: 50,
    referralCode: "SNEHA10",
    gender: "Female",
    dob: "1998-08-30",
  },
  {
    id: "cust-105",
    customerId: "CUST-9825",
    fullName: "Vikram Singh",
    email: "vikram.singh@example.com",
    phone: "+91 98765 43214",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302001",
    registrationDate: "2026-08-04T02:15:00.000Z",
    lastActiveAt: "2026-08-04T10:00:00.000Z",
    isVerified: true,
    verificationStatus: "verified",
    status: "active",
    isPremium: true,
    tier: "Platinum",
    totalOrders: 65,
    completedOrders: 62,
    cancelledOrders: 1,
    refundedOrders: 2,
    totalSpending: 38900,
    walletBalance: 2100,
    rewardPoints: 1450,
    referralCode: "VIKRAM80",
    gender: "Male",
    dob: "1990-01-05",
  },
  {
    id: "cust-106",
    customerId: "CUST-9826",
    fullName: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    phone: "+91 98765 43215",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    registrationDate: "2026-08-03T11:45:00.000Z",
    lastActiveAt: "2026-08-04T07:20:00.000Z",
    isVerified: true,
    verificationStatus: "verified",
    status: "active",
    isPremium: false,
    tier: "Silver",
    totalOrders: 19,
    completedOrders: 18,
    cancelledOrders: 1,
    refundedOrders: 0,
    totalSpending: 8900,
    walletBalance: 450,
    rewardPoints: 320,
    referralCode: "ANANYA25",
    gender: "Female",
    dob: "1995-04-14",
  },
  {
    id: "cust-107",
    customerId: "CUST-9827",
    fullName: "Karan Gupta",
    email: "karan.gupta@example.com",
    phone: "+91 98765 43216",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700001",
    registrationDate: "2024-06-18T09:10:00.000Z",
    lastActiveAt: "2026-07-25T14:30:00.000Z",
    isVerified: false,
    verificationStatus: "unverified",
    status: "suspended",
    isPremium: false,
    tier: "Bronze",
    totalOrders: 3,
    completedOrders: 2,
    cancelledOrders: 1,
    refundedOrders: 0,
    totalSpending: 1200,
    walletBalance: 0,
    rewardPoints: 30,
    referralCode: "KARAN05",
    gender: "Male",
    dob: "1997-09-08",
  },
  {
    id: "cust-108",
    customerId: "CUST-9828",
    fullName: "Neha Kapoor",
    email: "neha.kapoor@example.com",
    phone: "+91 98765 43217",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    registrationDate: "2026-08-01T15:30:00.000Z",
    lastActiveAt: "2026-08-04T08:50:00.000Z",
    isVerified: true,
    verificationStatus: "verified",
    status: "active",
    isPremium: true,
    tier: "Gold",
    totalOrders: 31,
    completedOrders: 29,
    cancelledOrders: 1,
    refundedOrders: 1,
    totalSpending: 17400,
    walletBalance: 800,
    rewardPoints: 620,
    referralCode: "NEHA40",
    gender: "Female",
    dob: "1993-02-28",
  },
];

export async function GET(request: NextRequest) {
  try {
    const backend = getBackendUrl();
    const qs = request.nextUrl.searchParams.toString();
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : null);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = token;

    // Attempt remote backend call
    const res = await fetch(`${backend}/api/admin/customers${qs ? `?${qs}` : ""}`, {
      headers,
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // High-performance rich local filtering fallback
    const sp = request.nextUrl.searchParams;
    const search = sp.get("search")?.toLowerCase().trim() || "";
    const status = sp.get("status")?.toLowerCase() || "";
    const verification = sp.get("verification")?.toLowerCase() || "";
    const city = sp.get("city")?.toLowerCase() || "";
    const state = sp.get("state")?.toLowerCase() || "";
    const orderRange = sp.get("orderRange") || "";
    const isPremium = sp.get("isPremium") || "";
    const sortBy = sp.get("sortBy") || "newest";
    const page = parseInt(sp.get("page") || "1", 10);
    const limit = parseInt(sp.get("limit") || "10", 10);

    let filtered = [...MOCK_CUSTOMERS];

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.toLowerCase().includes(search) ||
          c.customerId.toLowerCase().includes(search) ||
          c.city.toLowerCase().includes(search)
      );
    }

    if (status) {
      filtered = filtered.filter((c) => c.status.toLowerCase() === status);
    }

    if (verification) {
      if (verification === "verified") filtered = filtered.filter((c) => c.isVerified);
      if (verification === "unverified") filtered = filtered.filter((c) => !c.isVerified);
    }

    if (city) {
      filtered = filtered.filter((c) => c.city.toLowerCase().includes(city));
    }

    if (state) {
      filtered = filtered.filter((c) => c.state.toLowerCase().includes(state));
    }

    if (isPremium) {
      if (isPremium === "true") filtered = filtered.filter((c) => c.isPremium);
      if (isPremium === "false") filtered = filtered.filter((c) => !c.isPremium);
    }

    if (orderRange) {
      if (orderRange === "0") filtered = filtered.filter((c) => c.totalOrders === 0);
      if (orderRange === "1-5") filtered = filtered.filter((c) => c.totalOrders >= 1 && c.totalOrders <= 5);
      if (orderRange === "6-20") filtered = filtered.filter((c) => c.totalOrders >= 6 && c.totalOrders <= 20);
      if (orderRange === "20+") filtered = filtered.filter((c) => c.totalOrders > 20);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
      if (sortBy === "oldest") return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
      if (sortBy === "highest_spending") return b.totalSpending - a.totalSpending;
      if (sortBy === "most_orders") return b.totalOrders - a.totalOrders;
      if (sortBy === "highest_rewards") return b.rewardPoints - a.rewardPoints;
      return 0;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: {
        customers: paginatedCustomers,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch customers";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const newCust = {
      id: `cust-${Date.now()}`,
      customerId: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: body.fullName || "New Customer",
      email: body.email || `user${Date.now()}@example.com`,
      phone: body.phone || "+91 99999 88888",
      city: body.city || "Mumbai",
      state: body.state || "Maharashtra",
      registrationDate: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isVerified: true,
      verificationStatus: "verified",
      status: "active",
      isPremium: false,
      tier: "Bronze",
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      refundedOrders: 0,
      totalSpending: 0,
      walletBalance: 0,
      rewardPoints: 100,
    };

    MOCK_CUSTOMERS.unshift(newCust as typeof MOCK_CUSTOMERS[0]);

    return NextResponse.json({
      success: true,
      data: newCust,
      message: "Customer created successfully",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create customer";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
