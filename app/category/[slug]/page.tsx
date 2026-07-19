import type { Metadata } from "next";
import CategoryDetailView from "@/components/categories/CategoryDetailView";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";
import {
  CATEGORY_SLUGS,
  getCategoryBySlug,
  getCategoryDishes,
} from "@/lib/data/categoryData";

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  const name = category?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1);
  const description =
    category?.description ??
    `Explore ${name} dishes and order online on ${SITE_NAME}.`;

  return buildPageMetadata({
    title: `${name} Collection`,
    description: description.slice(0, 160),
    path: `/category/${slug}`,
    image: category?.image,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  const name = category?.name ?? slug;

  return (
    <>
      {category ? (
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: name, path: `/category/${slug}` },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: `${name} Collection`,
              description: category.description,
              url: absoluteUrl(`/category/${slug}`),
              numberOfItems: getCategoryDishes(slug).length,
            },
          ]}
        />
      ) : null}
      <CategoryDetailView slug={slug} />
    </>
  );
}
