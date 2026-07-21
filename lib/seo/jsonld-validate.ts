type JsonLd = Record<string, unknown>;

export type SchemaValidationResult = {
  schema: string;
  valid: boolean;
  errors: string[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAbsoluteUrl(value: unknown): boolean {
  return isNonEmptyString(value) && /^https?:\/\//.test(value);
}

function hasType(schema: JsonLd, expected: string | string[]): boolean {
  const types = schema["@type"];
  const expectedList = Array.isArray(expected) ? expected : [expected];
  if (typeof types === "string") return expectedList.includes(types);
  if (Array.isArray(types)) {
    return types.some((type) => expectedList.includes(String(type)));
  }
  return false;
}

function requireField(
  errors: string[],
  label: string,
  value: unknown,
  predicate: (value: unknown) => boolean
): void {
  if (!predicate(value)) {
    errors.push(`${label} is missing or invalid`);
  }
}

function validateContext(schema: JsonLd, errors: string[]): void {
  requireField(errors, "@context", schema["@context"], (value) => value === "https://schema.org");
}

function validateOrganization(schema: JsonLd): SchemaValidationResult {
  const errors: string[] = [];
  validateContext(schema, errors);
  requireField(errors, "@type Organization", schema, (value) =>
    hasType(value as JsonLd, "Organization")
  );
  requireField(errors, "name", schema.name, isNonEmptyString);
  requireField(errors, "url", schema.url, isAbsoluteUrl);
  requireField(errors, "logo", schema.logo, (value) => typeof value === "object" && value !== null);
  requireField(errors, "email", schema.email, isNonEmptyString);
  return { schema: "Organization", valid: errors.length === 0, errors };
}

function validateWebSite(schema: JsonLd): SchemaValidationResult {
  const errors: string[] = [];
  validateContext(schema, errors);
  requireField(errors, "@type WebSite", schema, (value) =>
    hasType(value as JsonLd, "WebSite")
  );
  requireField(errors, "name", schema.name, isNonEmptyString);
  requireField(errors, "url", schema.url, isAbsoluteUrl);
  requireField(errors, "potentialAction", schema.potentialAction, (value) =>
    typeof value === "object" && value !== null
  );
  return { schema: "WebSite", valid: errors.length === 0, errors };
}

function validateLocalBusiness(schema: JsonLd): SchemaValidationResult {
  const errors: string[] = [];
  validateContext(schema, errors);
  requireField(errors, "@type LocalBusiness", schema, (value) =>
    hasType(value as JsonLd, ["LocalBusiness", "FoodEstablishment"])
  );
  requireField(errors, "name", schema.name, isNonEmptyString);
  requireField(errors, "url", schema.url, isAbsoluteUrl);
  requireField(errors, "address", schema.address, (value) => typeof value === "object" && value !== null);
  requireField(errors, "telephone", schema.telephone, isNonEmptyString);
  return { schema: "LocalBusiness", valid: errors.length === 0, errors };
}

function validateRestaurant(schema: JsonLd): SchemaValidationResult {
  const errors: string[] = [];
  validateContext(schema, errors);
  requireField(errors, "@type Restaurant", schema, (value) =>
    hasType(value as JsonLd, ["Restaurant", "LocalBusiness", "FoodEstablishment"])
  );
  requireField(errors, "name", schema.name, isNonEmptyString);
  requireField(errors, "url", schema.url, isAbsoluteUrl);
  requireField(errors, "address", schema.address, (value) => typeof value === "object" && value !== null);
  return { schema: "Restaurant", valid: errors.length === 0, errors };
}

function validateBreadcrumbList(schema: JsonLd): SchemaValidationResult {
  const errors: string[] = [];
  validateContext(schema, errors);
  requireField(errors, "@type BreadcrumbList", schema, (value) =>
    hasType(value as JsonLd, "BreadcrumbList")
  );

  const items = schema.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    errors.push("itemListElement must be a non-empty array");
    return { schema: "BreadcrumbList", valid: false, errors };
  }

  items.forEach((item, index) => {
    const entry = item as JsonLd;
    requireField(errors, `itemListElement[${index}].position`, entry.position, (value) =>
      Number(value) === index + 1
    );
    requireField(errors, `itemListElement[${index}].name`, entry.name, isNonEmptyString);
    requireField(errors, `itemListElement[${index}].item`, entry.item, isAbsoluteUrl);
  });

  return { schema: "BreadcrumbList", valid: errors.length === 0, errors };
}

function validateSearchAction(schema: JsonLd): SchemaValidationResult {
  const errors: string[] = [];
  requireField(errors, "@type SearchAction", schema, (value) =>
    hasType(value as JsonLd, "SearchAction")
  );

  const target = schema.target as JsonLd | string | undefined;
  if (typeof target === "string") {
    requireField(errors, "target", target, (value) =>
      isNonEmptyString(value) && value.includes("{search_term_string}")
    );
  } else if (target && typeof target === "object") {
    requireField(errors, "target.urlTemplate", target.urlTemplate, (value) =>
      isNonEmptyString(value) && value.includes("{search_term_string}")
    );
  } else {
    errors.push("target is missing or invalid");
  }

  requireField(errors, "query-input", schema["query-input"], isNonEmptyString);
  return { schema: "SearchAction", valid: errors.length === 0, errors };
}

function validateProduct(schema: JsonLd): SchemaValidationResult {
  const errors: string[] = [];
  validateContext(schema, errors);
  requireField(errors, "@type Product", schema, (value) => hasType(value as JsonLd, "Product"));
  requireField(errors, "name", schema.name, isNonEmptyString);
  requireField(errors, "url", schema.url, isAbsoluteUrl);
  requireField(errors, "image", schema.image, (value) =>
    isAbsoluteUrl(value) || (Array.isArray(value) && value.length > 0)
  );

  const offers = schema.offers as JsonLd | undefined;
  if (!offers || typeof offers !== "object") {
    errors.push("offers is missing or invalid");
  } else {
    requireField(errors, "offers.price", offers.price, (value) => Number(value) >= 0);
    requireField(errors, "offers.priceCurrency", offers.priceCurrency, (value) => value === "INR");
    requireField(errors, "offers.availability", offers.availability, isNonEmptyString);
    requireField(errors, "offers.url", offers.url, isAbsoluteUrl);
  }

  return { schema: "Product", valid: errors.length === 0, errors };
}

export function validateJsonLdSchemas(schemas: {
  organization: JsonLd;
  website: JsonLd;
  localBusiness: JsonLd;
  restaurant: JsonLd;
  breadcrumb: JsonLd;
  searchAction: JsonLd;
  product: JsonLd;
}): SchemaValidationResult[] {
  return [
    validateOrganization(schemas.organization),
    validateWebSite(schemas.website),
    validateLocalBusiness(schemas.localBusiness),
    validateRestaurant(schemas.restaurant),
    validateBreadcrumbList(schemas.breadcrumb),
    validateSearchAction(schemas.searchAction),
    validateProduct(schemas.product),
  ];
}

export function assertValidJsonLdSchemas(
  results: SchemaValidationResult[]
): asserts results is SchemaValidationResult[] {
  const failures = results.filter((result) => !result.valid);
  if (failures.length === 0) return;

  const message = failures
    .map((failure) => `${failure.schema}: ${failure.errors.join("; ")}`)
    .join("\n");
  throw new Error(`JSON-LD schema validation failed:\n${message}`);
}
