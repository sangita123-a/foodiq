import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local Node tooling scripts (CommonJS) — not Next app source
    "scripts/**",
    // The Express/PostgreSQL backend is a separate CommonJS project with its
    // own runtime and dependencies; it must not be linted with Next.js rules.
    "foodiq-frontend/**",
  ]),
  {
    rules: {
      // API responses are dynamically shaped; `any` is intentional at boundaries.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Downgrade opinionated stylistic/perf rules to warnings so they do not
      // block production builds; behavior is unaffected.
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
