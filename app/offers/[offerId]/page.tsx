import type { Metadata } from "next";
import OfferDetailView from "@/components/offers/OfferDetailView";
import JsonLd from "@/components/seo/JsonLd";
import { OFFER_IDS } from "@/lib/offers";
import {
  ApiEnvelope,
  breadcrumbJsonLd,
  fetchApiJson,
} from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";

export function generateStaticParams() {
  return OFFER_IDS.map((offerId) => ({ offerId }));
}

export const dynamicParams = true;

type PageProps = {
  params: Promise<{ offerId: string }>;
};

type Offer = {
  id?: string;
  title?: string;
  name?: string;
  description?: string | null;
  image_url?: string | null;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { offerId } = await params;
  const res = await fetchApiJson<ApiEnvelope<Offer>>(`/api/offers/${offerId}`);
  const offer = res?.data;
  const title = offer?.title || offer?.name || "Special Offer";
  const description =
    offer?.description?.trim() ||
    `Claim the ${title} deal on ${SITE_NAME} and save on your next food order.`;

  return buildPageMetadata({
    title,
    description: description.slice(0, 160),
    path: `/offers/${offerId}`,
    image: offer?.image_url,
  });
}

export default async function OfferDetailPage({ params }: PageProps) {
  const { offerId } = await params;
  const res = await fetchApiJson<ApiEnvelope<Offer>>(`/api/offers/${offerId}`);
  const offer = res?.data;
  const title = offer?.title || offer?.name || "Special Offer";

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Offers", path: "/offers" },
            { name: title, path: `/offers/${offerId}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Offer",
            name: title,
            description: offer?.description || undefined,
            url: absoluteUrl(`/offers/${offerId}`),
            image: offer?.image_url || undefined,
            availability: "https://schema.org/InStock",
          },
        ]}
      />
      <OfferDetailView offerId={offerId} />
    </>
  );
}
