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
        favoriteRestaurants: [
          {
            id: "rest-1",
            name: "Punjabi Grill Express",
            cuisine: "North Indian, Tandoor",
            rating: 4.8,
            imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150",
          },
          {
            id: "rest-2",
            name: "Pizza Italiano & Pasta Bar",
            cuisine: "Italian, Gourmet Pizza",
            rating: 4.6,
            imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150",
          },
        ],
        favoriteFoods: [
          {
            id: "food-101",
            name: "Special Butter Chicken",
            price: 380,
            restaurantName: "Punjabi Grill Express",
            imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=150",
          },
          {
            id: "food-102",
            name: "Truffle Mushroom Pizza",
            price: 550,
            restaurantName: "Pizza Italiano & Pasta Bar",
            imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150",
          },
        ],
        wishlist: [
          {
            id: "wish-1",
            name: "Matcha Cheesecake Slice",
            price: 290,
            restaurantName: "Japanese Bakery & Cafe",
          },
          {
            id: "wish-2",
            name: "Dim Sum Basket (12pcs)",
            price: 480,
            restaurantName: "Dragon Wok",
          },
        ],
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch customer favorites";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
