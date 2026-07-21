import { ensureValidSampleJsonLdSchemas, validateSampleJsonLdSchemas } from "../lib/seo/jsonld";

const results = validateSampleJsonLdSchemas();

for (const result of results) {
  const status = result.valid ? "OK" : "FAIL";
  console.log(`${result.schema}: ${status}`);
  if (!result.valid) {
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }
}

ensureValidSampleJsonLdSchemas();
console.log("All required JSON-LD schemas are valid.");
