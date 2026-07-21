import type { Metadata } from "next";
import CategoryDetailView from "@/components/categories/CategoryDetailView";
import InternalSeoLinks from "@/components/seo/InternalSeoLinks";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildEntityMetadata } from "@/lib/seo/entity-metadata";
import {
  getContextualInternalLinks,
  getInternalLinksNavLabel,
} from "@/lib/seo/internal-links";
import { categoryKeywords } from "@/lib/seo/keywords";
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
  const trimmedDescription = description.slice(0, 160);

  return buildEntityMetadata({
    entityName: name,
    title: `${name} Collection`,
    description: trimmedDescription,
    path: `/category/${slug}`,
    image: category?.image,
    keywords: categoryKeywords(name, slug),
    socialTitle: `${name} Food Category | Foodiq`,
    socialDescription: trimmedDescription,
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
              { name: "Food Categories", path: "/popular-cuisines" },
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
      <InternalSeoLinks
        links={getContextualInternalLinks("categoryDetail")}
        label={getInternalLinksNavLabel("categoryDetail")}
      />
      <CategoryDetailView slug={slug} />
    </>
  );
}
