import { ImageResponse } from "next/og";
import { absoluteUrl } from "./site";

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const SOCIAL_IMAGE_CONTENT_TYPE = "image/png";

const BRAND_RED = "#0F766E";
const BRAND_MUTED = "#686B78";

export type SocialImageInput = {
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string | null;
};

function resolveImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  return absoluteUrl(imageUrl);
}

export function createSocialImageResponse({
  title,
  subtitle = "Order online with fast delivery on Foodiq.",
  badge = "Foodiq",
  imageUrl,
}: SocialImageInput): ImageResponse {
  const resolvedImage = resolveImageUrl(imageUrl);
  const trimmedTitle = title.slice(0, 90);
  const trimmedSubtitle = subtitle.slice(0, 120);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#FFF5F6",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            width: 500,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: BRAND_RED,
            color: "#FFFFFF",
            padding: "48px 56px",
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 20 }}>
            {badge}
          </div>
          <div
            style={{
              fontSize: 50,
              fontWeight: 800,
              lineHeight: 1.08,
              marginBottom: 24,
            }}
          >
            {trimmedTitle}
          </div>
          <div style={{ fontSize: 24, lineHeight: 1.35, color: "#FFE4E7" }}>
            {trimmedSubtitle}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            backgroundColor: "#FFFFFF",
          }}
        >
          {resolvedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedImage}
              alt=""
              width={520}
              height={520}
              style={{
                objectFit: "cover",
                borderRadius: 24,
                border: "2px solid #F3D4D8",
              }}
            />
          ) : (
            <div
              style={{
                width: 520,
                height: 520,
                borderRadius: 24,
                backgroundColor: "#FFECEE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 96,
              }}
            >
              🍽️
            </div>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 40,
            fontSize: 22,
            color: BRAND_MUTED,
          }}
        >
          foodiq-ecru.vercel.app
        </div>
      </div>
    ),
    { ...SOCIAL_IMAGE_SIZE }
  );
}
