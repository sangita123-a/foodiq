import type { Metadata } from "next";
import CollectionDetailView from "@/components/collections/CollectionDetailView";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildEntityMetadata } from "@/lib/seo/entity-metadata";
import { collectionKeywords } from "@/lib/seo/keywords";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";
import {
  COLLECTION_SLUGS,
  getCollectionBySlug,
  getCollectionDishes,
} from "@/lib/data/collectionsData";

export function generateStaticParams() {
  return COLLECTION_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  const title = collection?.title ?? "Collection";
  const description =
    collection?.description ??
    `Explore curated ${title} on ${SITE_NAME}.`;

  return buildEntityMetadata({
    entityName: title,
    title: `${title} Collection`,
    description: description.slice(0, 160),
    path: `/collections/${slug}`,
    image: collection?.bannerImage,
    keywords: collectionKeywords(title, slug),
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  return (
    <>
      {collection ? (
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: collection.title, path: `/collections/${slug}` },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: collection.title,
              description: collection.description,
              url: absoluteUrl(`/collections/${slug}`),
              numberOfItems: getCollectionDishes(slug).length,
            },
          ]}
        />
      ) : null}
      <CollectionDetailView slug={slug} />
    </>
  );
}
