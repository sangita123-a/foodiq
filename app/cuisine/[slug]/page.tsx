import CuisineDetailView from "@/components/cuisines/CuisineDetailView";
import { CUISINE_SLUGS } from "@/lib/cuisines";

export function generateStaticParams() {
  return CUISINE_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CuisinePage({ params }: PageProps) {
  const { slug } = await params;
  return <CuisineDetailView slug={slug} />;
}
