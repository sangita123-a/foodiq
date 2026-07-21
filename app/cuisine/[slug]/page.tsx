import type { Metadata } from "next";
import CuisineDetailView from "@/components/cuisines/CuisineDetailView";
import JsonLd from "@/components/seo/JsonLd";
import { CUISINE_SLUGS } from "@/lib/cuisines";
import {
  ApiEnvelope,
  breadcrumbJsonLd,
  fetchApiJson,
} from "@/lib/seo/jsonld";
import { buildEntityMetadata } from "@/lib/seo/entity-metadata";
import { cuisineKeywords } from "@/lib/seo/keywords";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";
import {
  getCuisineCanonicalPath,
  isDuplicateCuisineSlug,
} from "@/lib/seo/urls";

export function generateStaticParams() {
  return CUISINE_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

type Cuisine = {
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
};

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetchApiJson<ApiEnvelope<Cuisine>>(`/api/cuisines/${slug}`);
  const cuisine = res?.data;
  const name = cuisine?.name || titleCaseSlug(slug);
  const description =
    cuisine?.description?.trim() ||
    `Explore ${name} restaurants and dishes on ${SITE_NAME}. Order authentic ${name} food online.`;

  return buildEntityMetadata({
    entityName: name,
    title: `${name} Cuisine`,
    description: description.slice(0, 160),
    path: `/cuisine/${slug}`,
    canonicalPath: getCuisineCanonicalPath(slug),
    noIndex: isDuplicateCuisineSlug(slug),
    image: cuisine?.image_url,
    keywords: cuisineKeywords(name, slug),
  });
}

export default async function CuisinePage({ params }: PageProps) {
  const { slug } = await params;
  const res = await fetchApiJson<ApiEnvelope<Cuisine>>(`/api/cuisines/${slug}`);
  const cuisine = res?.data;
  const name = cuisine?.name || titleCaseSlug(slug);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Cuisines", path: "/popular-cuisines" },
            { name, path: `/cuisine/${slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${name} Cuisine`,
            description:
              cuisine?.description ||
              `Browse ${name} food on ${SITE_NAME}.`,
            url: absoluteUrl(getCuisineCanonicalPath(slug)),
          },
        ]}
      />
      <CuisineDetailView slug={slug} />
    </>
  );
}
