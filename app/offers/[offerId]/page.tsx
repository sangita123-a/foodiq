import OfferDetailView from "@/components/offers/OfferDetailView";
import { OFFER_IDS } from "@/lib/offers";

export function generateStaticParams() {
  return OFFER_IDS.map((offerId) => ({ offerId }));
}

export const dynamicParams = true;

type PageProps = {
  params: Promise<{ offerId: string }>;
};

export default async function OfferDetailPage({ params }: PageProps) {
  const { offerId } = await params;
  return <OfferDetailView offerId={offerId} />;
}
