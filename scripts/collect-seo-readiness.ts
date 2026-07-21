/**
 * Collects Google Search readiness metrics for docs/SEO_REPORT.md.
 */
import { buildRobotsConfig } from "../lib/seo/robots-config";
import {
  buildStaticSitemapEntries,
  dedupeSitemapEntries,
} from "../lib/seo/sitemap-entries";
import { validateJsonLdSchemas, type SchemaValidationResult } from "../lib/seo/jsonld-validate";
import {
  validateSampleSocialMetadata,
  validateSocialImageUrlBuilder,
  type SocialMetadataValidationResult,
} from "../lib/seo/social-metadata-validate";
import { validateTechnicalSeo } from "../lib/seo/technical-seo-validate";
import {
  organizationJsonLd,
  websiteJsonLd,
  localBusinessJsonLd,
  restaurantJsonLd,
  breadcrumbJsonLd,
  searchActionJsonLd,
  productJsonLd,
} from "../lib/seo/jsonld";
import { buildRootLayoutMetadata } from "../lib/seo/metadata";
import { publicMetadata, PUBLIC_PAGE_SEO } from "../lib/seo/pages";
import { getSiteUrl } from "../lib/seo/site";
import { discoverStaticPublicRoutes } from "../lib/seo/public-routes";

export type SeoReadinessData = {
  siteUrl: string;
  generatedAt: string;
  robots: {
    userAgent: string;
    allow: string[];
    disallowCount: number;
    disallowSample: string[];
    sitemap: string;
    host: string;
  };
  sitemap: {
    staticUrlCount: number;
    dedupedUrlCount: number;
    staticPublicRoutes: number;
    revalidateSeconds: number;
  };
  metadata: {
    publicPageEntries: number;
    rootHasMetadataBase: boolean;
    rootHasCanonical: boolean;
    rootHasRobotsIndex: boolean;
    samplePagesWithCanonical: number;
  };
  schema: SchemaValidationResult[];
  social: SocialMetadataValidationResult[];
  canonical: {
    legacyRedirects: number;
    pagesWithCanonical: number;
  };
  validation: {
    jsonLd: boolean;
    technical: boolean;
    social: boolean;
  };
};

function collect(): SeoReadinessData {
  let jsonLdOk = true;
  let technicalOk = true;
  let socialOk = true;

  const schemaResults = validateJsonLdSchemas({
    organization: organizationJsonLd(),
    website: websiteJsonLd(),
    localBusiness: localBusinessJsonLd(),
    restaurant: restaurantJsonLd({
      id: "sample-restaurant",
      name: "Sample Restaurant",
      description: "A sample restaurant for validation.",
      address: "123 Sample Street, Hyderabad",
      phone: "+91-40-4010-0100",
      rating: 4.5,
      review_count: 120,
    }),
    breadcrumb: breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Order Online", path: "/order-online" },
    ]),
    searchAction: searchActionJsonLd(),
    product: productJsonLd({
      id: "dish_pizza_1",
      name: "Margherita Pizza",
      description: "Classic cheese pizza with fresh basil.",
      price: 299,
      image: "/default-food.webp",
    }),
  });

  if (schemaResults.some((r) => !r.valid)) jsonLdOk = false;

  try {
    validateTechnicalSeo();
  } catch {
    technicalOk = false;
  }

  let socialResults: SocialMetadataValidationResult[] = [];
  try {
    validateSocialImageUrlBuilder();
    socialResults = validateSampleSocialMetadata();
    if (socialResults.some((r) => !r.valid)) socialOk = false;
  } catch {
    socialOk = false;
  }

  const robots = buildRobotsConfig();
  const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
  const allow = rules.allow
    ? Array.isArray(rules.allow)
      ? rules.allow
      : [rules.allow]
    : [];
  const disallow = rules.disallow
    ? Array.isArray(rules.disallow)
      ? rules.disallow
      : [rules.disallow]
    : [];

  const staticEntries = buildStaticSitemapEntries();
  const deduped = dedupeSitemapEntries(staticEntries);

  const root = buildRootLayoutMetadata();
  const sampleKeys = ["home", "orderOnline", "search", "offers"] as const;
  let pagesWithCanonical = 0;
  for (const key of sampleKeys) {
    const meta = publicMetadata(key);
    if (meta.alternates?.canonical) pagesWithCanonical += 1;
  }

  return {
    siteUrl: getSiteUrl(),
    generatedAt: new Date().toISOString(),
    robots: {
      userAgent: "*",
      allow,
      disallowCount: disallow.length,
      disallowSample: disallow.slice(0, 8),
      sitemap: String(robots.sitemap),
      host: String(robots.host),
    },
    sitemap: {
      staticUrlCount: staticEntries.length,
      dedupedUrlCount: deduped.length,
      staticPublicRoutes: discoverStaticPublicRoutes().length,
      revalidateSeconds: 3600,
    },
    metadata: {
      publicPageEntries: Object.keys(PUBLIC_PAGE_SEO).length,
      rootHasMetadataBase: Boolean(root.metadataBase),
      rootHasCanonical: Boolean(root.alternates?.canonical),
      rootHasRobotsIndex: root.robots !== undefined,
      samplePagesWithCanonical: pagesWithCanonical,
    },
    schema: schemaResults,
    social: socialResults,
    canonical: {
      legacyRedirects: 11,
      pagesWithCanonical: pagesWithCanonical,
    },
    validation: {
      jsonLd: jsonLdOk,
      technical: technicalOk,
      social: socialOk,
    },
  };
}

console.log(JSON.stringify(collect(), null, 2));
