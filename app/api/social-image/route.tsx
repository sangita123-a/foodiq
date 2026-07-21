import { createSocialImageResponse } from "@/lib/seo/social-image";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() || "Foodiq";
  const subtitle =
    searchParams.get("subtitle")?.trim() ||
    "Order delicious food from top restaurants with fast delivery.";
  const image = searchParams.get("image");

  return createSocialImageResponse({
    title,
    subtitle,
    imageUrl: image,
  });
}
